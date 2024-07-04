import { CoqMDOutput } from "../parser/outputconfigs";
import { indexToPosition, Position } from "./ProofFlowPosition.ts";
import { Area, AreaType, CollapsibleArea, InputArea } from "./ProofFlowArea.ts";

export { ProofFlowDocument, NOPConfig, Range };

/**
 * Class for representing a range in the document
 */
class Range {
  start: Position; // Starting line and character within range
  end: Position; // Ending line and character within range

  constructor(start: Position, end: Position) {
    this.start = start;
    this.end = end;
  }

  /**
   * Function to check if a position is within the range
   * @param {Position} pos - Position to be checked
   * @returns - boolean value indicating if the position is within the range
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

// OutputConfig is a type for the configuration of the output
export type OutputConfig = {
  [key: string]: [string, string];
};

// Default output configuration for the proofFlowDocument
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

  public uri: string;

  public documentProgressed: boolean = false;

  constructor(uri: string, areas: Area[]) {
    this.uri = uri;
    this.areas = areas;
  }

  /**
   * Function to add an area to the document
   * @param {Area} area - Area to be added to the document
   * @returns - boolean value indicating if the area was added successfully
   */
  addArea(area: Area): boolean {
    this.areas.push(area);
    return true;
  }

  /**
   * Function to convert the document to a string
   * @returns - String representation of the document
   */
  toString(): string {
    let sum = "";
    for (let area of this.areas) {
      sum += area.toString(this.outputConfig);
    }
    return sum;
  }

  /**
   * Function to set the output configuration for the document
   * @param {OutputConfig} config - Configuration for the output
   */
  public set outputConfig(config: OutputConfig) {
    this._outputConfig = config;
    this.updateBounds();
  }

  /**
   * Function to get the output configuration for the document
   * @returns - Configuration for the output
   */
  public get outputConfig(): OutputConfig {
    return this._outputConfig;
  }

  /**
   * Function to update the bounds of the areas in the document
   */
  updateBounds() {
    let fullstring = this.toString(); // Get the string representation of the document
    let lastIndex = 0; // Initialize the last index
    for (let area of this.areas) {
      let areaString = area.toString(this.outputConfig); // Get the string representation of the area
      let startPosition = indexToPosition(
        // Get the start position of the area
        fullstring.indexOf(areaString, lastIndex) +
          this.outputConfig[area.type][0].length,
        fullstring,
      );
      if (startPosition.line > 0) startPosition.character--;
      let endPosition = indexToPosition(
        // Get the end position of the area
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

  /**
   * Function to get an area with the given id
   * @param {number} id - Id of the area to be retrieved
   * @returns - Area with the given id
   */
  getAreaById(id: number): Area | undefined {
    for (let area of this.areas) {
      switch (area.type) {
        case AreaType.Collapsible:
          let collapsible = area as CollapsibleArea;
          for (let otherarea of collapsible.subAreas) {
            if (otherarea.id === id) return otherarea;
          }
          break;
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

  /**
   * Function to get an area with the given position
   * @param {Position} pos - Position of the area to be retrieved
   * @returns - Area with the given position
   */
  getAreayByPosition(pos: Position): [Area, number] | undefined {
    for (let area of this.areas) {
      switch (area.type) {
        case AreaType.Collapsible:
          let collapsible = area as CollapsibleArea;
          for (let otherarea of collapsible.subAreas) {
            if (otherarea.range?.contains(pos))
              return [otherarea, otherarea.getOffset(pos)!];
          }
          break;
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
