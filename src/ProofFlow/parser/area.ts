// Different kind of areas for text rendering
export enum AreaType {
  None,
  Markdown,
  Code,
}

// An area holds its type and the text it contains
export class Area {
  areaType = AreaType.None;
  text = "";
}
