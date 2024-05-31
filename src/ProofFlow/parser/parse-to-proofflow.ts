import { AcceptedFileTypes } from "./accepted-file-types";
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
    return parseToAreasJSON(text);
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

/**
 * Converts a lean file with the ProofFlow genre into different areas for easier conversion to the Prosemirror format.
 * @param text - The input text to parse.
 * @returns An array of areas representing the parsed text.
 */
export function parseToAreasLean(text: string): Wrapper[] {
  let parser = new LeanParser(text);
  let genericAreas: LeanArea[] = parser.parse();
  return convertAreasToRenderable(genericAreas);
}

/**
 * Converts an array given in JSON containing objects describing areas into different areas for easier conversion to the Prosemirror format.
 * @param json - currently a placeholder to receive the list containing the objects to be rendered.
 * @returns An array of areas representing the parsed text.
 */
export function parseToAreasJSON(json: string): Wrapper[] {
  let areas = convertJSONToAreas([{"content": "", "input": false, "subAreas": [{"content": "text", "input": false, "subAreas": [], "type": "Text"}], "type": "Collapsible"}]);
  return convertAreasToRenderable(areas);
} 

/**
 * Enum representing the different kinds of areas present in the prosemirror format.
 */
enum ParseAreaType {
  Text = "Text",
  Code = "Code",
  Math = "Math",
  Empty = "Empty",
  Collapsible = "Collapsible",
  Input = "Input",
}

/**
 * An interface for defining different classes describing Areas to be parsed to the prosemirror format.
 */
interface ParseArea {
  type: ParseAreaType;
  content: string;
  subAreas: ParseArea[];
  input: boolean;
}

/**
 * A class describing areas in Lean documents according to the Verso genre defined in /verso-genre.
 */
class LeanArea implements ParseArea {
  type: ParseAreaType;
  content: string = "";
  subAreas: LeanArea[] = [];
  input: boolean = false;

  constructor (type: ParseAreaType) {
    this.type = type;
  }

  addAreas(genericArea: LeanArea): void {
    this.subAreas.push(genericArea);
  }
}

/**
 * A class describing areas as contained in the json lists passed by (TODO: add location). 
 */
class JSONArea implements ParseArea {
  type: ParseAreaType = ParseAreaType.Text;
  content: string = "";
  subAreas: JSONArea[] = [];
  input: boolean = false;
}

type AreaObject = {
  content:string,
  input: boolean,
  subAreas: AreaObject[],
  type: string
} 

/**
 * Converts a list of json objects as passed by (TODO: add location) to a list of JSONAreas. 
 * @param jsonList a list of json objects.
 * @returns a list of JSONAreas.
 */
function convertJSONToAreas(jsonList: AreaObject[]): JSONArea[] {
  let result : JSONArea[] = new Array;
  for(let i of jsonList) {
    let jsonArea : JSONArea = new JSONArea;
    jsonArea.type = i.type as ParseAreaType;
    jsonArea.content = i.content;
    jsonArea.input = i.input;
    jsonArea.subAreas = convertJSONToAreas(i.subAreas);
    result.push(jsonArea)
  }
  console.log(result);
  return result;
}

/**
 * Converts a list of areas to a list of objects renderable in the ProseMirror format.
 * @param AreaArray An array of ParseArea objects.
 * @returns An array of Wrapper objects.
 */
function convertAreasToRenderable(AreaArray: ParseArea[]): Wrapper[] {
  let wrappers : Wrapper[] = new Array;
  for(let i = 0; i < AreaArray.length; i++) {
    let wrapper = new Wrapper();
    switch (AreaArray[i].type) {
      case (ParseAreaType.Collapsible):
        wrapper.wrapperType = WrapperType.Collapsible;
        wrapper.info = " ";
        break
      case (ParseAreaType.Input):
        wrapper.wrapperType = WrapperType.Input;
        break;
      default:
        wrapper.wrapperType = WrapperType.None;
        break;
    }
    for (let j = 0; j < AreaArray[i].subAreas.length; j++) {
      let area: Area = new Area(AreaType.None);
      switch (AreaArray[i].subAreas[j].type) {
        case (ParseAreaType.Text):
          area.areaType = AreaType.Markdown;
          break;
        case (ParseAreaType.Math):
          area.areaType = AreaType.Math;
          break;
        case (ParseAreaType.Code):
          area.areaType = AreaType.Code;
          break;
      }
      area.text = AreaArray[i].subAreas[j].content;
      wrapper.areas.push(area);
    }
    if (wrapper.areas.length < 1) continue;
    wrappers.push(wrapper);
  }
  return wrappers;
}

/**
 * An interface for defining Parsers for diferrent filetypes.
 */
interface Parser {
  parse(): ParseArea[];
}

/**
 * A Parser for Lean files adhering to the genre defined in /verso-genre
 */
class LeanParser implements Parser {
  defaultAreaType: ParseAreaType = ParseAreaType.Text;
  document: String;

  parsedDocument: LeanArea[] = [];

  inTrueWrapper: boolean = false;
  inText: boolean = true;
  textStart: number = 0;

  constructor (document: String) {
    this.document = document;
  }

  /**
   * Creates a LeanArea with the given type and adds the string provided to its contents.
   * @param content The string to be added to the area.
   * @param areaType The type that should be assigned to the new area
   * @returns A LeanArea with the type and contents provided.
   */
  createArea(content: string, areaType: ParseAreaType): LeanArea{
    let area = new LeanArea(areaType);
    area.content = content;
    return area;
  }

  /**
   * A function to parse the contents of LeanAreas designated as subareas, i.e. areas with the types Text, Code or Math.
   * @param start The starting index of the underlying document from which the parsing will begin.
   * @returns The ending index upon which the parsing ended, either because it encountered a higher level area or because the document ended.
   */
  parseSubAreas(start: number): number {
    let i: number = start;
    while (i < this.document.length) {
      if ( i == this.document.length - 1 && this.inText) {
        if (i > this.textStart) {
          let content = this.document.substring(this.textStart, this.document.length);
            if (content.length == 0) {
              content = " ";
            }
            const subarea = this.createArea(content, ParseAreaType.Text);
            this.parsedDocument[this.parsedDocument.length -1].addAreas(subarea);
        }
        this.inText = false;
      } else if (this.document.startsWith(":::", i) && this.inText) {
        if (i > this.textStart) {
          let content = this.document.substring(this.textStart, i - 1);
          if (content.length == 0) {
            content = " ";
          }
          const subarea = this.createArea(content, ParseAreaType.Text);
          this.parsedDocument[this.parsedDocument.length -1].addAreas(subarea);
        }
        this.inText = false;
      } else if (this.document.startsWith(":::math", i)) {
        let pos = i + ":::math\n".length;
        for(let j = pos; j < this.document.length; j++) {
          if(this.document.startsWith(":::", j)) {
            const content = this.document.substring(pos, j - 1);
            const subarea = this.createArea(content, ParseAreaType.Math);
            this.parsedDocument[this.parsedDocument.length -1].addAreas(subarea);
            this.inText = true;
            this.textStart = j + ":::\n".length;
            i = j + ":::\n".length;
            break;
          }
        }
      } else if (this.document.startsWith(":::code", i)) {
        let pos = i + ":::code\n".length;
        for(let j = pos; j < this.document.length; j++) {
          if(!this.document.startsWith(":::", j)) continue;
          const content = this.document.substring(pos, j - 1);
          const subarea = this.createArea(content, ParseAreaType.Code);
          this.parsedDocument[this.parsedDocument.length -1].addAreas(subarea);
          this.inText = true;
          this.textStart = j + ":::\n".length;
          i = j + ":::\n".length;
          break;
        }
      } else if (this.document.startsWith(":::", i) && this.inTrueWrapper) {
        i += ":::\n".length;
        this.inTrueWrapper = false;
        return i;
      } else if (this.document.startsWith(":::collapsible", i) ||this.document.startsWith(":::input", i)) {
        return i;
      } else {
        i++;
      }
    }
    return i;
  }
  
  /**
   * Starts the parsing of the document provided in the construction of the class. It generates top-level areas (Empty, Collapsible, Input) which will contain all subareas (Text, Code, Math).
   * @returns An array of LeanAreas containing the contents of the document.
   */
  parse(): LeanArea[] {
    let i = 0
    while (i < this.document.length) {
      if (this.document.startsWith(":::collapsible", i)) {
        this.inTrueWrapper = true;
        this.parsedDocument.push(new LeanArea(ParseAreaType.Collapsible));
        this.inText = true;
        this.textStart = i + ":::collapsible\n".length;
        i = this.parseSubAreas(i + ":::collapsible\n".length);
      } else if (this.document.startsWith(":::input", i)) {
        this.inTrueWrapper = true;
        this.parsedDocument.push(new LeanArea(ParseAreaType.Input));
        this.inText = true;
        this.textStart = i + ":::input\n".length;
        i = this.parseSubAreas(i + ":::input\n".length);
      } else {
        console.log(i);
        this.parsedDocument.push(new LeanArea(ParseAreaType.Empty));
        this.inText = true;
        this.textStart = i;
        i = this.parseSubAreas(i);
      }
    }
    return this.parsedDocument;
  }
}
