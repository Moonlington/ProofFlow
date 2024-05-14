import { Area, AreaType } from "./area";

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
 * Parses the text into areas and converts Coqdoc into markdown.
 * @param text - The input text to parse.
 * @returns An array of areas representing the parsed text.
 */
export function parseToProofFlow(text: string): Area[] {
  let areas = parseToAreas(text);
  return areas;
}

/**
 * Converts a default Coq file into different areas for easier conversion to the Prosemirror format.
 * @param text - The input text to parse.
 * @returns An array of areas representing the parsed text.
 */
function parseToAreas(text: string): Area[] {
  let areas: Area[] = new Array();
  const regCoqdoc = /^\s*\(\*((.|\n)*?)\*\)\s*/;
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

      area.areaType = AreaType.Markdown;
      area.text = coqdoc[0];

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
