// Enum representing different types of areas for text rendering
export enum AreaType {
  None, // No specific area type
  Markdown, // Area containing Markdown text
  Code, // Area containing code
  Math, // Area containing math
}

// Class representing an area, which holds its type and the text it contains
export class Area {
  areaType = AreaType.None; // The type of the area
  text = ""; // The text content of the area
  input: boolean = false; // Whether the area is in an input area

  constructor (areaType: AreaType) {
    this.areaType = areaType;
  }
}
