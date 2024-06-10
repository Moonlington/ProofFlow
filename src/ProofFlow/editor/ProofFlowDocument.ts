export { AreaType, Area, CollapsibleArea, InputArea, ProofFlowDocument };

enum AreaType {
  Text = "text",
  Code = "code",
  Math = "math",
  Collapsible = "collapsible",
  Input = "input",
}

let nextAreaId = 0;

class Area {
  id: number;
  type: AreaType;
  content: string;
  parent: undefined | CollapsibleArea | InputArea;

  constructor(
    type: Exclude<AreaType, AreaType.Collapsible | AreaType.Input>,
    content: string,
  ) {
    this.id = nextAreaId++;
    this.type = type;
    this.content = content;
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
}

//TODO: Incorporate handling the index mapping here, this is a big task and should be done carefully.
class ProofFlowDocument {
  areas: Area[];

  constructor(areas: Area[]) {
    this.areas = areas;
  }

  addArea(area: Area): boolean {
    this.areas.push(area);
    return true;
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
}
