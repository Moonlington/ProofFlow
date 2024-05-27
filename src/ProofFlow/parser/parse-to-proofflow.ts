import { Area, AreaType } from "./area";
import { Wrapper, WrapperType } from "./wrapper";

/**
 * Parses text into an HTML div to be rendered by ProseMirror.
 * @param text - The input text to parse.
 * @returns The HTML div containing the parsed text.
 */
export function domFromText(text: string): HTMLDivElement {
  const dom = document.createElement("div");
  text.split(/(?:\r\n?|\n){2,}/).forEach((block) => {
    let p = dom.appendChild(document.createElement("p"));
    if (block) {
      block.split(/(?:\r\n?|\n)/).forEach((line) => {
        if (line) {
          line = line.replace(/ /g, "\u00A0"); // Replaces space with special character, otherwise it is removed
          if (p.hasChildNodes()) p.appendChild(document.createElement("br"));
          p.appendChild(document.createTextNode(line));
        }
      });
    }
    dom.appendChild(p);
  });
  return dom;
}

/**
 * Parses the text into wrappers, containing different areas.
 * @param text - The input text to parse.
 * @returns An array of wrappers representing the parsed text.
 */
export function parseToProofFlow(
  text: string,
  areaParsingFunction: Function,
): Wrapper[] {
  let wrappers: Wrapper[] = [];
  let startIndex = 0;
  let inCollapsible = false;
  let inInput = false;

  let wrapper = new Wrapper();

  function insertInWrapper(endIndex: number, endTagLength: number) {
    let areasText = text.substring(startIndex, endIndex);
    wrapper.areas = areaParsingFunction(areasText);
    wrappers.push(wrapper);
    wrapper = new Wrapper();
    startIndex = endIndex + endTagLength;
  }

  const regExpHint = /\"([^"]+)\"/;
  for (let i = 0; i < text.length; i++) {
    if (inCollapsible) {
      if (!text.startsWith("</hint>", i)) continue;
      inCollapsible = false;
      insertInWrapper(i, "</hint>".length);
      continue;
    }
    if (inInput) {
      if (!text.startsWith("</input-area>", i)) continue;
      inInput = false;
      insertInWrapper(i, "</input-area>".length);
      continue;
    }
    if (!(text.startsWith("<input-area>", i) || text.startsWith("<hint", i)))
      continue;
    if (i > startIndex) {
      insertInWrapper(i, 0);
    }
    if (text.indexOf(">", i) == -1) return wrappers;
    if (text.startsWith("<input-area>", i)) {
      wrapper.wrapperType = WrapperType.Input;
      inInput = true;
    } else if (text.startsWith("<hint", i)) {
      wrapper.wrapperType = WrapperType.Collapsible;
      inCollapsible = true;
    }
    startIndex = text.indexOf(">", i) + 1;
    if (text.startsWith("<input-area>", i)) continue;

    let regex = regExpHint;
    regex.lastIndex = i;
    let titleString = regex.exec(text);
    if (titleString != null) wrapper.info = titleString[1];
  }

  if (startIndex != text.length) {
    insertInWrapper(text.length, 0);
  }
  return wrappers;
}

/**
 * Converts non-code text into Areas for math and Markdown
 * @param text - The input text (non-code) to parse.
 * @returns An array of areas representing the parsed text.
 */
function parseNonCode(text: string): Area[] {
  let areas = new Array();

  const regex = /(\$\$[\s\S]*?\$\$)|([\s\S]+?)(?=\$\$|$)/g;

  const matches: string[] = [];

  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push(match[0].trim());
  }

  matches.forEach((m) => {
    if (m.length == 0) return;
    let area = new Area();
    area.text = m;
    if (m.startsWith("$")) {
      area.areaType = AreaType.Math;
      const fixed = area.text.replace(/\$/g, "");
      area.text = fixed.trim();
    } else {
      area.areaType = AreaType.Markdown;
    }
    areas.push(area);
  });

  return areas;
}

/**
 * Converts a default Coq file into different areas for easier conversion to the Prosemirror format.
 * @param text - The input text to parse.
 * @returns An array of areas representing the parsed text.
 */
export function parseToAreasV(text: string): Area[] {
  let areas: Area[] = new Array();
  const regCoqdoc = /^\s*\(\*((.|\n)*?)\*\)\s*/;
  const regMath = /^\s*\$\$((.|\n)*?)\$\$\s*/;
  const reqCoqdocNoUse = /^\s*\(\**\)\s*/;
  const regCode = /^\s*(.|\n)*?(?=\(\*)\s*/;
  while (text.length > 0) {
    let area = new Area();
    let coqdoc = text.match(regCoqdoc);
    if (coqdoc != null) {
      // For Coqdoc sections
      text = text.replace(regCoqdoc, "");

      // Coqdoc sometimes contains (******) but this does not have any use
      if (coqdoc[0].match(reqCoqdocNoUse)) continue;

      areas = areas.concat(parseNonCode(coqdoc[0]));
      continue;
    }
    let math = text.match(regMath);
    if (math != null) {
      text = text.replace(regMath, "");

      area.areaType = AreaType.Math;
      area.text = math[1].trim();
      areas.push(area);
      continue;
    }

    let code = text.match(regCode);
    if (code != null) {
      // For code sections
      text = text.replace(regCode, "");

      area.areaType = AreaType.Code;
      area.text = code[0];

      areas.push(area);
      continue;
    }

    // Either this is the last code section or something went wrong
    area.areaType = AreaType.Code;
    area.text = text;
    areas.push(area);
    break;
  }

  return areas;
}

/**
 * Converts a markdown Coq file into different areas for easier conversion to the Prosemirror format.
 * @param text - The input text to parse.
 * @returns An array of areas representing the parsed text.
 */
export function parseToAreasMV(text: string): Area[] {
  let areas: Area[] = new Array();

  let inCode = false;
  let startIndex = 0;
  for (let i = 0; i < text.length; i++) {
    if (!text.startsWith("```", i)) continue;
    if (!inCode) {
      let nonCodeText = text.substring(startIndex, i);
      areas = areas.concat(parseNonCode(nonCodeText));
      inCode = true;
      startIndex = i + "```coq\n".length;
    } else {
      let area = new Area();
      area.areaType = AreaType.Code;
      area.text = text.substring(startIndex, i);
      areas.push(area);
      inCode = false;
      startIndex = i + "```\n".length;
    }
  }
  if (startIndex != text.length) {
    let nonCodeText = text.substring(startIndex, text.length);
    areas = areas.concat(parseNonCode(nonCodeText));
  }
  return areas;
}


/**
 * Converts a lean file with the ProofFlow genre into different areas for easier conversion to the Prosemirror format.
 * @param text - The input text to parse.
 * @returns An array of areas representing the parsed text.
 */
export function parseToAreasLean(text: string): Area[] {
  let areas : Area[] = new Array();
  let areatype: AreaType = AreaType.Code;
  let startIndex = 0;
  let skip = false;
  for (let i = 0; i < text.length; i++) {
    if (!text.startsWith(":::", i)) continue;
    if (startIndex == 0) {
      let area = new Area();
      area.text = text.substring(startIndex, i);
      area.areaType = areatype;
      areas.push(area);
    }
    if (text.startsWith(":::text\n", i)) {
      areatype = AreaType.Markdown;
      startIndex = i + ":::text\n".length;
      continue;
    } else if (text.startsWith(":::math\n", i)) {
      areatype = AreaType.Math;
      startIndex = i + ":::math\n".length;
      continue;
    } else if (text.startsWith(":::code\n", i)) {
      areatype = AreaType.Code;
      startIndex = i + ":::code\n".length;
      continue;
    }

    if (areatype == AreaType.Code && text.startsWith(":::", i)) {
      let area = new Area();
      area.text = text.substring(startIndex, i);
      area.areaType = areatype;
      areas.push(area);
      console.log(startIndex, i);
    } else if ((areatype == AreaType.Math || areatype == AreaType.Markdown) && text.startsWith(":::", i)) {
      let area = new Area();
      area.text = text.substring(startIndex, i);
      area.areaType = areatype;
      areas.push(area);
      console.log(startIndex, i);
    }
  }
  return areas;
}