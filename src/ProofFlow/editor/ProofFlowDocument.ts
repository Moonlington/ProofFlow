import { Node } from "prosemirror-model";

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

export type Position = {
  line: number;
  character: number;
};

function indexToPosition(index: number, str: string): Position {
  let lineNumber = str.substring(0, index).split("\n").length - 1;
  let characterNumber =
    index - str.split("\n").slice(0, lineNumber).toString().length;
  return { line: lineNumber, character: characterNumber };
}

class Range {
  start: Position;
  end: Position;

  constructor(start: Position, end: Position) {
    this.start = start;
    this.end = end;
  }

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

enum AreaType {
  Text = "text",
  Code = "code",
  Math = "math",
  Collapsible = "collapsible",
  Input = "input",
}

let nextAreaId = 0;

function getNextAreaId(): number {
  return nextAreaId++;
}

class Area {
  id: number;
  type: AreaType;
  content: string;
  parent: undefined | CollapsibleArea | InputArea;
  range: Range | undefined;

  constructor(
    type: Exclude<AreaType, AreaType.Collapsible | AreaType.Input>,
    content: string,
  ) {
    this.id = getNextAreaId();
    this.type = type;
    this.content = content;
  }

  toString(config: OutputConfig): string {
    return config[this.type][0] + this.content + config[this.type][1];
  }

  getPosition(offset: number): Position {
    let localPos = indexToPosition(offset, this.content);
    if (localPos.line > 0) localPos.character--;
    if (!this.range) return localPos;
    return {
      line: this.range.start.line + localPos.line,
      character: this.range.start.character + localPos.character,
    };
  }

  getOffset(pos: Position): number | undefined {
    console.log(this.range, pos);
    if (!this.range?.contains(pos)) return undefined;

    let lines = this.content.split("\n");
    let localLine = pos.line - this.range.start.line;
    if (localLine > 0) pos.character++;
    return (
      lines.slice(0, localLine).join("\n").length +
      pos.character -
      this.range.start.character
    );
  }
}

class CollapsibleArea extends Area {
  subAreas: Area[] = [];
  constructor(title: string) {
    super(null!, title);
    this.type = AreaType.Collapsible;
  }

  addArea(area: Area): boolean {
    if ([AreaType.Collapsible, AreaType.Input].includes(area.type))
      return false;
    this.subAreas.push(area);
    area.parent = this;
    return true;
  }

  removeArea(area: Area): boolean {
    if (this.subAreas.includes(area)) {
      this.subAreas.splice(this.subAreas.indexOf(area), 1);
      return true;
    }
    return false;
  }

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

class InputArea extends Area {
  subAreas: Area[] = [];
  constructor() {
    super(null!, "");
    this.type = AreaType.Input;
  }

  addArea(area: Area): boolean {
    if ([AreaType.Collapsible, AreaType.Input].includes(area.type))
      return false;
    this.subAreas.push(area);
    area.parent = this;
    return true;
  }

  removeArea(area: Area): boolean {
    if (this.subAreas.includes(area)) {
      this.subAreas.splice(this.subAreas.indexOf(area), 1);
      return true;
    }
    return false;
  }
  toString(config: OutputConfig): string {
    let inner = "";
    for (let area of this.subAreas) {
      inner += area.toString(config);
    }
    return config[this.type][0] + inner + config[this.type][1];
  }
}

export type OutputConfig = {
  [key: string]: [string, string];
};

const NOPConfig: OutputConfig = {
  text: ["", ""],
  code: ["", ""],
  math: ["", ""],
  collapsible: ["", ""],
  collapsibletitle: ["", ""],
  input: ["", ""],
};

//TODO: Incorporate handling the index mapping here, this is a big task and should be done carefully.
class ProofFlowDocument {
  areas: Area[];
  private _outputConfig: OutputConfig = NOPConfig;

  constructor(areas: Area[]) {
    this.areas = areas;
  }

  addArea(area: Area): boolean {
    this.areas.push(area);
    return true;
  }

  toString(): string {
    let sum = "";
    for (let area of this.areas) {
      sum += area.toString(this.outputConfig);
    }
    return sum;
  }

  public set outputConfig(config: OutputConfig) {
    this._outputConfig = config;
    this.updateBounds();
  }

  public get outputConfig(): OutputConfig {
    return this._outputConfig;
  }

  updateBounds() {
    let fullstring = this.toString();
    let lastIndex = 0;
    for (let area of this.areas) {
      let areaString = area.toString(this.outputConfig);
      let startPosition = indexToPosition(
        fullstring.indexOf(areaString, lastIndex) +
          this.outputConfig[area.type][0].length,
        fullstring,
      );
      if (startPosition.line > 0) startPosition.character--;
      let endPosition = indexToPosition(
        fullstring.indexOf(areaString, lastIndex) +
          areaString.length -
          this.outputConfig[area.type][1].length -
          1,
        fullstring,
      );
      area.range = new Range(startPosition, endPosition);
      let newLastIndex =
        fullstring.indexOf(areaString, lastIndex) + areaString.length;
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

  removeAreaById(id: number): boolean {
    for (let area of this.areas) {
      switch (area.type) {
        case AreaType.Collapsible:
          let collapsible = area as CollapsibleArea;
          for (let otherarea of collapsible.subAreas) {
            if (otherarea.id === id) return collapsible.removeArea(otherarea);
          }
          break;
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

function docToPFDocument(doc: Node): ProofFlowDocument {
  let pfDocument = new ProofFlowDocument([]);
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
