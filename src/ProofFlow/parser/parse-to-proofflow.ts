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

  if (areaParsingFunction == parseToAreasLean) {
    let leanParser: LeanParser = new LeanParser(text);
    return convertGenericToRenderable(leanParser.parse());
  }

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
    let area = new Area(AreaType.None);
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
    let area = new Area(AreaType.None);
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
      let area = new Area(AreaType.Code);
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

enum GenericAreaType {
  Text = "Text",
  Code = "Code",
  Math = "Math",
  Empty = "Empty",
  Collapsible = "Collapsible",
  Input = "Input",
}

class GenericArea {
  type: GenericAreaType;
  content: string = "";
  subareas: GenericArea[] = [];

  constructor (type: GenericAreaType) {
    this.type = type;
  }

  addAreas(genericArea: GenericArea): void {
    this.subareas.push(genericArea);
  }

}

function convertGenericToRenderable(genericArray: GenericArea[]): Wrapper[] {
  let wrappers : Wrapper[] = new Array;
  for(let i = 0; i < genericArray.length; i++) {
    let wrapper = new Wrapper();
    switch (genericArray[i].type) {
      case (GenericAreaType.Collapsible):
        wrapper.wrapperType = WrapperType.Collapsible;
        break
      case (GenericAreaType.Input):
        wrapper.wrapperType = WrapperType.Input;
        break;
      default:
        wrapper.wrapperType = WrapperType.None;
        break;
    }
    for (let j = 0; j < genericArray[i].subareas.length; j++) {
      let area: Area = new Area(AreaType.None);
      switch (genericArray[i].subareas[j].type) {
        case (GenericAreaType.Text):
          area.areaType = AreaType.Markdown;
          break;
        case (GenericAreaType.Math):
          area.areaType = AreaType.Math;
          break;
        case (GenericAreaType.Code):
          area.areaType = AreaType.Code;
          break;
      }
      area.text = genericArray[i].subareas[j].content;
      wrapper.areas.push(area);
    }
    if (wrapper.areas.length < 1) continue;
    wrappers.push(wrapper);
  }
  return wrappers;
}

interface GenericParser {
  parse(): GenericArea[];
}

type GenericConfig = {
  [key: string]: [string, string];
}

class LeanParser implements GenericParser {
  defaultAreaType: GenericAreaType = GenericAreaType.Text;
  document: String;

  parsedDocument: GenericArea[] = [];

  inTrueWrapper: boolean = false;
  inText: boolean = true;

  constructor (document: String) {
    this.document = document;
  }

  createArea(content: string, areaType: GenericAreaType): GenericArea{
    let area = new GenericArea(areaType);
    area.content = content;
    return area;
  }

  parseSubAreas(start: number): number {
    let i: number = start;
    while (i < this.document.length) {
      if (this.document.startsWith(":::text", i)) {
        let pos = i + ":::text\n".length;
        console.log(this.document.startsWith(":::text", i));
        for(let j = pos; j < this.document.length; j++) {
          if(!this.document.startsWith(":::", j)) continue;
          const content = this.document.substring(pos, j);
          const subarea = this.createArea(content, GenericAreaType.Text);
          this.parsedDocument[this.parsedDocument.length -1].addAreas(subarea);
          i = j + ":::\n".length;
          break;
        }
      } else if (this.document.startsWith(":::math", i)) {
        let pos = i + ":::math\n".length;
        for(let j = pos; j < this.document.length; j++) {
          if(!this.document.startsWith(":::", j)) continue;
          const content = this.document.substring(pos, j - 1);
          const subarea = this.createArea(content, GenericAreaType.Math);
          this.parsedDocument[this.parsedDocument.length -1].addAreas(subarea);
          i = j + ":::\n".length;
          break;
        }
      } else if (this.document.startsWith(":::code", i)) {
        let pos = i + ":::code\n".length;
        for(let j = pos; j < this.document.length; j++) {
          if(!this.document.startsWith(":::", j)) continue;
          const content = this.document.substring(pos, j - 1);
          const subarea = this.createArea(content, GenericAreaType.Code);
          this.parsedDocument[this.parsedDocument.length -1].addAreas(subarea);
          i = j + ":::\n".length;
          break;
        }
      } else if (this.document.startsWith(":::", i) && this.inTrueWrapper) {
        console.log(i);
        console.log(this.document.slice(i, this.document.length));
        console.log(this.document.slice(i, this.document.length).length);
        i += ":::\n".length;
        this.inTrueWrapper = false;
        console.log(i);
        console.log(this.document.slice(i, this.document.length));
        console.log(this.document.slice(i, this.document.length).length);
        return i;
      } else if (this.document.startsWith(":::collapsible", i) ||this.document.startsWith(":::input", i)) {
        return i;
      } else {
        i++;
      }
    }
    return i;
  }
  
  parse(): GenericArea[] {
    let i = 0
    while (i < this.document.length) {
      if (this.document.startsWith(":::collapsible", i)) {
        this.inTrueWrapper = true;
        this.parsedDocument.push(new GenericArea(GenericAreaType.Collapsible));
        i = this.parseSubAreas(i + ":::collapsible".length);
      } else if (this.document.startsWith(":::input", i)) {
        this.inTrueWrapper = true;
        this.parsedDocument.push(new GenericArea(GenericAreaType.Input));
        i = this.parseSubAreas(i + ":::input".length);
      } else {
        console.log(i);
        this.parsedDocument.push(new GenericArea(GenericAreaType.Empty));
        i = this.parseSubAreas(i);
        console.log(i);
      }
    }
    return this.parsedDocument;
  }
}


/**
 * Converts a lean file with the ProofFlow genre into different areas for easier conversion to the Prosemirror format.
 * @param text - The input text to parse.
 * @returns An array of areas representing the parsed text.
 */
export function parseToAreasLean(text: string): Area[] {return []}
//   let areas : Area[] = new Array();
//   let areaType: AreaType = AreaType.Code;
//   let startIndex = 0;
//   let skip = false;
//   for (let i = 0; i < text.length; i++) {
//     if (!text.startsWith(":::", i)) continue;
//     if (startIndex == 0) {
//       let area = createArea(text.substring(startIndex, i), areaType);
//       areas.push(area);
//     }
//     if (text.startsWith(":::text\n", i)) {
//       areaType = AreaType.Markdown;
//       startIndex = i + ":::text\n".length;
//       continue;
//     } else if (text.startsWith(":::math\n", i)) {
//       areaType = AreaType.Math;
//       startIndex = i + ":::math\n".length;
//       continue;
//     } else if (text.startsWith(":::code\n", i)) {
//       areaType = AreaType.Code;
//       startIndex = i + ":::code\n".length;
//       continue;
//     }

//     if (areaType == AreaType.Code && text.startsWith(":::", i)) {
//       let area = createArea(text.substring(startIndex, i), areaType);
//       areas.push(area);
//       console.log(startIndex, i);
//     } else if ((areaType == AreaType.Math || areaType == AreaType.Markdown) && text.startsWith(":::", i)) {
//       let area = createArea(text.substring(startIndex, i), areaType);
//       areas.push(area);
//       console.log(startIndex, i);
//     }
//   }
//   return areas;
// }