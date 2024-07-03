/*
 * Area class is the base class for all the areas in the ProofFlowDocument.
 */
import { indexToPosition, Position } from "./ProofFlowPosition.ts";
import { OutputConfig, ProofFlowDocument, Range } from "./ProofFlowDocument.ts";
import { ProofStatus } from "./Schema/proofFlowSchema.ts";
import { Node } from "prosemirror-model";

// Enumeration for the type of area
export enum AreaType {
  Text = "text",
  Code = "code",
  Math = "math",
  Collapsible = "collapsible",
  Input = "input",
}

let nextAreaId = 0; //start value for the area id

/**
 * Function to increase nextAreaId and return the new value
 * @returns - the new value of nextAreaId
 */
export function getNextAreaId(): number {
  return nextAreaId++;
}

export class Area {
  id: number; // Unique identifier for the area
  type: AreaType; // Type of the area
  content: string; // Content of the area
  parent: undefined | CollapsibleArea | InputArea; // Parent of the area
  range: Range | undefined; // Range of the area in the document

  /**
   * Constructor for the Area class
   * @param {AreaType} type - Type of the area
   * @param {string} content - Content of the area
   */
  constructor(
    type: Exclude<AreaType, AreaType.Collapsible | AreaType.Input>,
    content: string,
  ) {
    this.id = getNextAreaId();
    this.type = type;
    this.content = content;
  }

  /**
   * Function to convert the area to a string
   * @param {OutputConfig} config - Configuration for the output
   * @returns - String representation of the area
   */
  toString(config: OutputConfig): string {
    return config[this.type][0] + this.content + config[this.type][1];
  }

  /**
   * Function to get the position of the character at the given offset
   * @param {number} offset - Offset of the character
   * @returns - Position of the character
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

  /**
   * Function to get the offset of the character at the given position
   * @param {Position} pos - Position of the character
   * @returns - Offset of the character
   */
  getOffset(pos: Position): number | undefined {
    if (!this.range?.contains(pos)) return undefined; // If the position is not in the range, return undefined

    let lines = this.content.split("\n");
    let localLine = pos.line - this.range.start.line;
    if (localLine > 0) pos.character++;
    return lines.slice(0, localLine).join("\n").length + pos.character;
  }
}

/*
 * CollapsibleArea class is a subclass of Area class which represents a collapsible area in the ProofFlowDocument.
 */
export class CollapsibleArea extends Area {
  subAreas: Area[] = []; // Subareas of the collapsible area
  constructor(title: string) {
    super(null!, title);
    this.type = AreaType.Collapsible;
  }

  /**
   * Function to add an area to the collapsible area
   * @param {Area} area - Area to be added
   * @returns - boolean value indicating if the area was added successfully
   */
  addArea(area: Area): boolean {
    if ([AreaType.Collapsible, AreaType.Input].includes(area.type))
      return false;
    this.subAreas.push(area);
    area.parent = this;
    return true;
  }

  /**
   * Function to convert the collapsible area to a string
   * @param {OutputConfig} config - Configuration for the output
   * @returns - String representation of the collapsible area
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
export class InputArea extends Area {
  subAreas: Area[] = [];
  status: ProofStatus = ProofStatus.Unattempted;
  constructor() {
    super(null!, "");
    this.type = AreaType.Input;
  }

  /**
   * Function to add an area to the input area
   * @param {Area} area - Area to be added to the input area
   * @returns - boolean value indicating if the area was added successfully
   */
  addArea(area: Area): boolean {
    if ([AreaType.Collapsible, AreaType.Input].includes(area.type))
      return false;
    this.subAreas.push(area);
    area.parent = this;
    return true;
  }

  /**
   * Function to remove an area from the input area
   * @param {Area} area - Area to be removed from the input area
   * @returns - boolean value indicating if the area was removed successfully
   */
  removeArea(area: Area): boolean {
    if (this.subAreas.includes(area)) {
      this.subAreas.splice(this.subAreas.indexOf(area), 1);
      return true;
    }
    return false;
  }

  /**
   * Function to convert the input area to a string
   * @param {OutputConfig} config - Configuration for the output
   * @returns - String representation of the input area
   */
  toString(config: OutputConfig): string {
    let inner = "";
    for (let area of this.subAreas) {
      inner += area.toString(config);
    }
    return config[this.type][0] + inner + config[this.type][1];
  }
}

/**
 * Function to convert a document to a ProofFlowDocument
 * @param {string} uri - URI of the document
 * @param {Node} doc - Document to be converted
 * @returns - ProofFlowDocument
 */
export function docToPFDocument(uri: string, doc: Node): ProofFlowDocument {
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

/**
 * Function to convert a node to an area
 * @param {Node} node - Node to be converted
 * @returns - Area
 */
export function nodeToArea(node: Node): Area | undefined {
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
      input.status = node.attrs.proof;
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
