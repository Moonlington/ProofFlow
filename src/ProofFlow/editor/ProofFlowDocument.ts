import { Node } from "prosemirror-model";
import { CoqMDOutput } from "../parser/outputconfigs";

export {
  AreaType,
  Area,
  CollapsibleArea,
  InputArea,
  ProofFlowDocument,
  docToPFDocument,
  getNextAreaId,
  NOPConfig,
  nodeToArea,
  Range,
};

// Type for the position of a character in the document
export type Position = {
  line: number;
  character: number;
};

/*
 * Function to convert an index to a position in the document
 * @param index: Index of the character in the document
 * @param str: String representation of the document
 * @returns: Position of the character in the document
 */
function indexToPosition(index: number, str: string): Position {
  let lineNumber = str.substring(0, index).split("\n").length - 1;
  let characterNumber =
    index - str.split("\n").slice(0, lineNumber).toString().length;
  return { line: lineNumber, character: characterNumber };
}

// Class to represent a range in the document
class Range {
  start: Position; // Starting line and character within range
  end: Position; // Ending line and character within range

  constructor(start: Position, end: Position) {
    this.start = start;
    this.end = end;
  }

  /*
   * Function to check if a position is within the range
   * @param pos: Position to be checked
   * @returns: boolean value indicating if the position is within the range
   */
  contains(pos: Position): boolean {
    if (pos.line < this.start.line) return false;
    if (pos.line > this.end.line) return false;
    if (pos.line === this.start.line && pos.character < this.start.character)
      return false;
    if (pos.line === this.end.line && pos.character > this.end.character)
      return false;
    return true;
  }
}

// Enumeration for the type of area
enum AreaType {
  Text = "text",
  Code = "code",
  Math = "math",
  Collapsible = "collapsible",
  Input = "input",
}

let nextAreaId = 0; //start value for the area id

/*
 * Function to increase nextAreaId and return the new value
  * @returns: the new value of nextAreaId
 */ 
function getNextAreaId(): number {
  return nextAreaId++;
}

/*
 * Area class is the base class for all the areas in the ProofFlowDocument.
 */
class Area {
  id: number; // Unique identifier for the area
  type: AreaType; // Type of the area
  content: string; // Content of the area
  parent: undefined | CollapsibleArea | InputArea; // Parent of the area
  range: Range | undefined; // Range of the area in the document

  // Constructor for the Area class
  constructor(
    type: Exclude<AreaType, AreaType.Collapsible | AreaType.Input>, 
    content: string,
  ) {
    this.id = getNextAreaId();
    this.type = type;
    this.content = content;
  }

  /*
   * Function to convert the area to a string
   * @param config: OutputConfig object containing the configuration for the output
   * @returns: string representation of the area
   */ 
  toString(config: OutputConfig): string {
    return config[this.type][0] + this.content + config[this.type][1];
  }

  /*
   * Function to get the position of the area in the document
   * @param offset: Offset of the position in the document
   * @returns: Position of the area in the document
   */  
  getPosition(offset: number): Position {
    let localPos = indexToPosition(offset, this.content);
    if (localPos.line > 0) localPos.character--; // Go the the left  of the current position
    if (!this.range) return localPos; // If the range is not defined, return the local position
    return {
      line: this.range.start.line + localPos.line, // Add the local position to the start of the range
      character: this.range.start.character + localPos.character, // Add the local character to the start of the range
    };
  }

  /*
   * Function to get the offset of a position in the area
   * @param pos: Position in the document
   * @returns: Offset of the position in the area
   */
  getOffset(pos: Position): number | undefined {
    if (!this.range?.contains(pos)) return undefined; // If the position is not in the range, return undefined

    let lines = this.content.split("\n");
    let localLine = pos.line - this.range.start.line; // Get the local line
    if (localLine > 0) pos.character++; // If the local line is greater than 0, increment the character position
    return (
      lines.slice(0, localLine).join("\n").length +
      pos.character
    );
  }
}

/*
 * CollapsibleArea class is a subclass of Area class which represents a collapsible area in the ProofFlowDocument.
 */
class CollapsibleArea extends Area {
  subAreas: Area[] = []; // Subareas of the collapsible area
  constructor(title: string) {
    super(null!, title);
    this.type = AreaType.Collapsible;
  }

  // Function to add an area to the collapsible area
  addArea(area: Area): boolean {
    if ([AreaType.Collapsible, AreaType.Input].includes(area.type))
      return false;
    this.subAreas.push(area);
    area.parent = this;
    return true;
  }

  /*
   * Function to remove an area from the collapsible area
   * @param area: Area to be removed from the collapsible area
   * @returns: boolean value indicating if the area was removed successfully
   */
  removeArea(area: Area): boolean {
    if (this.subAreas.includes(area)) {
      this.subAreas.splice(this.subAreas.indexOf(area), 1);
      return true;
    }
    return false;
  }

  /*
   * Function to convert the collapsible area to a string
   * @param config: OutputConfig object containing the configuration for the output
   * @returns: string representation of the collapsible area
   */ 
  toString(config: OutputConfig): string {
    let inner = "";
    for (let area of this.subAreas) {
      inner += area.toString(config);
    }
    return this.content
      ? config["collapsibletitle"][0].replace("TITLE", this.content) +
          inner +
          config[this.type][1]
      : config[this.type][0] + inner + config[this.type][1];
  }
}

/*
 * InputArea class is a subclass of Area class which represents an input area in the ProofFlowDocument.
 */
class InputArea extends Area {
  subAreas: Area[] = []; // Subareas of the input area
  constructor() {
    super(null!, "");
    this.type = AreaType.Input;
  }

  /*
   * Function to add an area to the input area
   * @param area: Area to be added to the input area
   * @returns: boolean value indicating if the area was added successfully
   */
  addArea(area: Area): boolean {
    if ([AreaType.Collapsible, AreaType.Input].includes(area.type))
      return false;
    this.subAreas.push(area);
    area.parent = this;
    return true;
  }

  /*
   * Function to remove an area from the input area
   * @param area: Area to be removed from the input area
   * @returns: boolean value indicating if the area was removed successfully
   */
  removeArea(area: Area): boolean {
    if (this.subAreas.includes(area)) {
      this.subAreas.splice(this.subAreas.indexOf(area), 1);
      return true;
    }
    return false;
  }

  /* 
   * Function to convert the input area to a string
   * @param config: OutputConfig object containing the configuration for the output
   * @returns: string representation of the input area
   */
  toString(config: OutputConfig): string {
    let inner = "";
    for (let area of this.subAreas) {
      inner += area.toString(config);
    }
    return config[this.type][0] + inner + config[this.type][1];
  }
}

// OutputConfig type for the configuration of the output
export type OutputConfig = {
  [key: string]: [string, string];
};

// Default output configuration for the ProofFlowDocument
const NOPConfig: OutputConfig = {
  text: ["", ""],
  code: ["", ""],
  math: ["", ""],
  collapsible: ["", ""],
  collapsibletitle: ["", ""],
  input: ["", ""],
};

/*
 * ProofFlowDocument class represents the document in the ProofFlow editor.
 */
class ProofFlowDocument {
  areas: Area[]; // Areas in the document
  private _outputConfig: OutputConfig = CoqMDOutput; // Output configuration for the document

  public uri: string; // URI of the document

  constructor(uri: string, areas: Area[]) {
    this.uri = uri;
    this.areas = areas;
  }

  /*
   * Function to add an area to the document
   * @param area: Area to be added to the document
   * @returns: boolean value indicating if the area was added successfully
   */
  addArea(area: Area): boolean {
    this.areas.push(area);
    return true;
  }

  /*
   * Function to convert the document to a string
   * @returns: string representation of the document
   */
  toString(): string {
    let sum = "";
    for (let area of this.areas) {
      sum += area.toString(this.outputConfig);
    }
    return sum;
  }

  // Setter for the output configuration
  public set outputConfig(config: OutputConfig) {
    this._outputConfig = config;
    this.updateBounds();
  }

  // Getter for the output configuration
  public get outputConfig(): OutputConfig {
    return this._outputConfig;
  }

  /*
   * Function to update the bounds of the areas in the document
   */
  updateBounds() {
    let fullstring = this.toString(); // Get the string representation of the document
    let lastIndex = 0; // Initialize the last index
    for (let area of this.areas) { 
      let areaString = area.toString(this.outputConfig); // Get the string representation of the area
      let startPosition = indexToPosition( // Get the start position of the area
        fullstring.indexOf(areaString, lastIndex) +
          this.outputConfig[area.type][0].length,
        fullstring,
      );
      if (startPosition.line > 0) startPosition.character--;
      let endPosition = indexToPosition( // Get the end position of the area
        fullstring.indexOf(areaString, lastIndex) +
          areaString.length -
          this.outputConfig[area.type][1].length -
          1,
        fullstring,
      );
      area.range = new Range(startPosition, endPosition); // Set the range of the area
      let newLastIndex = // Get the new last index
        fullstring.indexOf(areaString, lastIndex) + areaString.length;
      // If the area is a collapsible or input area, set the bounds of the subareas
      if (area.type === AreaType.Collapsible || area.type === AreaType.Input) { 
        let innerAreas: Area[];
        switch (area.type) {
          case AreaType.Collapsible:
            innerAreas = (area as CollapsibleArea).subAreas;
            break;
          case AreaType.Input:
            innerAreas = (area as InputArea).subAreas;
            break;
        }
        for (let subarea of innerAreas) {
          let subAreaString = subarea.toString(this.outputConfig);
          let subStartPosition = indexToPosition(
            fullstring.indexOf(subAreaString, lastIndex) +
              this.outputConfig[subarea.type][0].length,
            fullstring,
          );
          if (subStartPosition.line > 1) subStartPosition.character--;
          let subEndPosition = indexToPosition(
            fullstring.indexOf(subAreaString, lastIndex) +
              subAreaString.length -
              this.outputConfig[subarea.type][1].length -
              1,
            fullstring,
          );
          subarea.range = new Range(subStartPosition, subEndPosition);
          lastIndex =
            fullstring.indexOf(subAreaString, lastIndex) + subAreaString.length;
        }
      }
      lastIndex = newLastIndex;
    }
  }

  /*
   * Function to add an area before another area in the document
   * @param area: Area to be added to the document
   * @param beforeId: Id of the area before which the new area is to be added
   * @returns: boolean value indicating if the area was added successfully
   */
  addAreaBefore(area: Area, beforeId: number): boolean {
    let beforeArea = this.getAreaById(beforeId);
    if (beforeArea === undefined) return false;
    if (beforeArea.parent !== undefined) {
      beforeArea.parent.subAreas.splice(
        beforeArea.parent.subAreas.indexOf(beforeArea),
        1,
        area,
        beforeArea,
      );
      area.parent = beforeArea.parent;
      return true;
    }
    this.areas.splice(this.areas.indexOf(beforeArea), 0, area);
    return true;
  }

  /*
   * Function to add an area after another area in the document
   * @param area: Area to be added to the document
   * @param afterId: Id of the area after which the new area is to be added
   * @returns: boolean value indicating if the area was added successfully
   */
  addAreaAfter(area: Area, afterId: number): boolean {
    let afterArea = this.getAreaById(afterId);
    if (afterArea === undefined) return false;
    if (afterArea.parent !== undefined) {
      afterArea.parent.subAreas.splice(
        afterArea.parent.subAreas.indexOf(afterArea),
        0,
        area,
      );
      area.parent = afterArea.parent;
      return true;
    }
    this.areas.splice(this.areas.indexOf(afterArea), 0, area);
    return true;
  }

  /*
   * Function to replace an area in the document with another area
   * @param newArea: Area to replace the existing area
   * @param replaceId: Id of the area to be replaced
   * @returns: boolean value indicating if the area was replaced successfully
   */
  replaceArea(newArea: Area, replaceId: number): boolean {
    let replacedArea = this.getAreaById(replaceId);
    if (replacedArea === undefined) return false;
    if (replacedArea.parent !== undefined) {
      replacedArea.parent.subAreas.splice(
        replacedArea.parent.subAreas.indexOf(replacedArea),
        1,
        newArea,
      );
      newArea.parent = replacedArea.parent;
      return true;
    }
    this.areas.splice(this.areas.indexOf(replacedArea), 1, newArea);
    return true;
  }

  /*
   * Function to remove an area from the document
   * @param id: Id of the area to be removed
   * @returns: boolean value indicating if the area was removed successfully
   */
  removeAreaById(id: number): boolean {
    for (let area of this.areas) {
      switch (area.type) {
        // If the area is a collapsible area, remove the area from the subareas
        case AreaType.Collapsible:
          let collapsible = area as CollapsibleArea;
          for (let otherarea of collapsible.subAreas) {
            if (otherarea.id === id) return collapsible.removeArea(otherarea);
          }
          break;
        // If the area is an input area, remove the area from the subareas
        case AreaType.Input:
          let input = area as InputArea;
          for (let otherarea of input.subAreas) {
            if (otherarea.id === id) return input.removeArea(otherarea);
          }
          break;
        default:
          if (area.id === id) {
            this.areas.splice(this.areas.indexOf(area), 1);
            return true;
          }
          break;
      }
    }
    return false;
  }

  /*
   * Function to get an area by its id
   * @param id: Id of the area to be retrieved
   * @returns: Area with the given id
   */
  getAreaById(id: number): Area | undefined {
    for (let area of this.areas) {
      switch (area.type) {
        // If the area is a collapsible area, get the area from the subareas
        case AreaType.Collapsible:
          let collapsible = area as CollapsibleArea;
          for (let otherarea of collapsible.subAreas) {
            if (otherarea.id === id) return otherarea;
          }
          break;
        // If the area is an input area, get the area from the subareas
        case AreaType.Input:
          let input = area as InputArea;
          for (let otherarea of input.subAreas) {
            if (otherarea.id === id) return otherarea;
          }
          break;
        default:
          if (area.id === id) return area;
          break;
      }
    }
    return undefined;
  }

  /*
   * Function to get an area by its position in the document
   * @param pos: Position of the area to be retrieved
   * @returns: Area at the given position
   */
  getAreayByPosition(pos: Position): [Area, number] | undefined {
    for (let area of this.areas) {
      switch (area.type) {
        // If the area is a collapsible area, get the area from the subareas
        case AreaType.Collapsible: 
          let collapsible = area as CollapsibleArea;
          for (let otherarea of collapsible.subAreas) {
            if (otherarea.range?.contains(pos))
              return [otherarea, otherarea.getOffset(pos)!];
          }
          break;
        // If the area is an input area, get the area from the subareas
        case AreaType.Input:
          let input = area as InputArea;
          for (let otherarea of input.subAreas) {
            if (otherarea.range?.contains(pos))
              return [otherarea, otherarea.getOffset(pos)!];
          }
          break;
        default:
          if (area.range?.contains(pos)) return [area, area.getOffset(pos)!];
          break;
      }
    }
    return undefined;
  }
}

/*
 * Function to convert a ProseMirror document to a ProofFlowDocument
 * @param uri: URI of the document
 * @param doc: ProseMirror document to be converted
 * @returns: ProofFlowDocument object
 */
function docToPFDocument(uri: string, doc: Node): ProofFlowDocument {
  let pfDocument = new ProofFlowDocument(uri, []);
  if (doc.type.name !== "doc") {
    console.error(
      "docToPFDocument received other node, expected 'doc' received '%s'",
      doc.type.name,
    );
    return pfDocument;
  }
  let prevNodeId = nextAreaId;
  doc.content.forEach((node: Node, _offset: number, _index: number) => {
    let area = nodeToArea(node);
    if (area) pfDocument.addArea(area);
  });
  nextAreaId = prevNodeId;
  pfDocument.updateBounds();
  return pfDocument;
}

/*
 * Function to convert a ProseMirror node to an area
 * @param node: ProseMirror node to be converted
 * @returns: Area object
 */
function nodeToArea(node: Node): Area | undefined {
  let area: Area;
  switch (node.type.name) {
    case "markdown":
      area = new Area(AreaType.Text, node.textContent);
      break;
    case "markdown_rendered":
      area = new Area(AreaType.Text, node.attrs.original_text);
      break;
    case "math_display":
      area = new Area(AreaType.Math, node.textContent);
      break;
    case "code_mirror":
      area = new Area(AreaType.Code, node.textContent);
      break;
    case "input":
      let input = new InputArea();
      node.content
        .child(0)
        .content.forEach((n: Node, _offset: number, _index: number) => {
          let area = nodeToArea(n);
          if (area) input.addArea(area);
        });
      area = input;
      break;
    case "collapsible":
      let collapsible = new CollapsibleArea(node.content.child(0).textContent);
      node.content
        .child(1)
        .content.forEach((n: Node, _offset: number, _index: number) => {
          let area = nodeToArea(n);
          if (area) collapsible.addArea(area);
        });
      area = collapsible;
      break;
    default:
      return undefined;
  }

  area.id = node.attrs.id;
  return area;
}
