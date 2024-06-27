export { SimpleParser };

import {
  ProofFlowDocument,
  AreaType,
  Area,
  CollapsibleArea,
  InputArea,
  OutputConfig,
} from "../editor/ProofFlowDocument";

export interface Parser {
  parse(document: string): ProofFlowDocument;
}

// TODO: NEEDS DOCUMENTATION key = AreaType: [begin, end]
type AreaConfig = [RegExp, RegExp];

export type ParserConfig = {
  [key: string]: AreaConfig;
};

class SimpleParser implements Parser {
  config: ParserConfig;
  outputConfig: OutputConfig;
  defaultAreaType: Exclude<AreaType, AreaType.Collapsible | AreaType.Input> =
    AreaType.Text;

  constructor(config: ParserConfig, outputConfig: OutputConfig) {
    this.config = config;
    this.outputConfig = outputConfig;
  }

  createArea(type: AreaType, content: string): Area {
    switch (type) {
      case AreaType.Text:
      case AreaType.Code:
      case AreaType.Math:
        return new Area(type, content);
      case AreaType.Collapsible:
        return new CollapsibleArea(content);
      case AreaType.Input:
        return new InputArea();
    }
  }

  parse(document: string): ProofFlowDocument {
    let pfDocument = new ProofFlowDocument("", []);
    pfDocument.outputConfig = this.outputConfig;
    return this.recurParse(pfDocument, document);
  }

  recurParse(doc: ProofFlowDocument, rest: string): ProofFlowDocument {
    if (rest === "") return doc;

    let nextAreaType: AreaType = this.defaultAreaType;
    let startRegex: RegExpExecArray = null!;
    for (let type of Object.values(AreaType)) {
      if (type === this.defaultAreaType) continue;
      let regex = this.config[type][0].exec(rest);
      if (regex === null) continue;
      if (startRegex === null || startRegex.index > regex.index) {
        startRegex = regex;
        nextAreaType = type;
      }
    }

    if (startRegex === null) {
      doc.addArea(this.createArea(this.defaultAreaType, rest));
      return doc;
    }

    if (startRegex.index !== 0) {
      doc.addArea(
        this.createArea(this.defaultAreaType, rest.slice(0, startRegex.index)),
      );
    }

    if (
      nextAreaType === AreaType.Collapsible ||
      nextAreaType === AreaType.Input
    ) {
      let out = this.recurContainedAreas(
        [],
        nextAreaType,
        rest.slice(startRegex.index + startRegex[0].length),
      );
      let containedAreas: Area[] = out[0];
      rest = out[1];
      let area: CollapsibleArea | InputArea;
      switch (nextAreaType) {
        case AreaType.Collapsible:
          let title = "";
          if (startRegex[1] !== undefined) {
            title = startRegex[1];
          }
          area = new CollapsibleArea(title);
          break;
        case AreaType.Input:
          area = new InputArea();
          break;
      }
      containedAreas.forEach((sub) => {
        if ([AreaType.Collapsible, AreaType.Input].includes(sub.type)) {
          area.addArea(
            new Area(this.defaultAreaType, sub.toString(this.outputConfig)),
          );
          return;
        }
        area.addArea(sub);
      });
      doc.addArea(area);
      return this.recurParse(doc, rest);
    }

    let endRegex = this.config[nextAreaType][1].exec(
      rest.slice(startRegex.index + startRegex[0].length),
    );
    if (endRegex === null) {
      doc.addArea(this.createArea(nextAreaType, rest));
      return doc;
    }

    doc.addArea(
      this.createArea(
        nextAreaType,
        rest.slice(
          startRegex.index + startRegex[0].length,
          startRegex.index + startRegex[0].length + endRegex.index,
        ),
      ),
    );

    return this.recurParse(
      doc,
      rest.slice(
        startRegex.index +
          startRegex[0].length +
          endRegex.index +
          endRegex[0].length,
      ),
    );
  }

  recurContainedAreas(
    areas: Area[],
    type: AreaType,
    rest: string,
  ): [Area[], string] {
    let closingRegex = this.config[type][1].exec(rest);

    if (closingRegex === null) {
      areas.push(this.createArea(this.defaultAreaType, rest));
      return [areas, ""];
    }

    let nextAreaType: AreaType = this.defaultAreaType;
    let startRegex: RegExpExecArray = null!;
    for (let type of Object.values(AreaType)) {
      if (type === this.defaultAreaType) continue;
      let regex = this.config[type][0].exec(rest);
      if (regex === null) continue;
      if (startRegex === null || startRegex.index > regex.index) {
        startRegex = regex;
        nextAreaType = type;
      }
    }

    if (startRegex === null || closingRegex.index < startRegex.index) {
      if (closingRegex.index !== 0)
        areas.push(
          this.createArea(
            this.defaultAreaType,
            rest.slice(0, closingRegex.index),
          ),
        );
      return [areas, rest.slice(closingRegex.index + closingRegex[0].length)];
    }

    if (startRegex.index !== 0) {
      areas.push(
        this.createArea(this.defaultAreaType, rest.slice(0, startRegex.index)),
      );
    }

    if (
      nextAreaType === AreaType.Collapsible ||
      nextAreaType === AreaType.Input
    ) {
      let out = this.recurContainedAreas(
        [],
        nextAreaType,
        rest.slice(startRegex.index + startRegex[0].length),
      );
      let containedAreas: Area[] = out[0];
      rest = out[1];
      let area: CollapsibleArea | InputArea;
      switch (nextAreaType) {
        case AreaType.Collapsible:
          let title = "";
          if (startRegex[1] !== undefined) {
            title = startRegex[1];
          }
          area = new CollapsibleArea(title);
          break;
        case AreaType.Input:
          area = new InputArea();
          break;
      }
      containedAreas.forEach((sub) => {
        if ([AreaType.Collapsible, AreaType.Input].includes(sub.type)) {
          area.addArea(
            new Area(this.defaultAreaType, sub.toString(this.outputConfig)),
          );
          return;
        }
        area.addArea(sub);
      });
      areas.push(area);
      return this.recurContainedAreas(areas, type, rest);
    }

    let endRegex = this.config[nextAreaType][1].exec(
      rest.slice(startRegex.index + startRegex[0].length),
    );
    if (endRegex === null) {
      areas.push(
        this.createArea(nextAreaType, rest.slice(0, closingRegex.index)),
      );
      return [areas, rest.slice(closingRegex.index + closingRegex[0].length)];
    }

    areas.push(
      this.createArea(
        nextAreaType,
        rest.slice(
          startRegex.index + startRegex[0].length,
          startRegex.index + startRegex[0].length + endRegex.index,
        ),
      ),
    );

    return this.recurContainedAreas(
      areas,
      type,
      rest.slice(
        startRegex.index +
          startRegex[0].length +
          endRegex.index +
          endRegex[0].length,
      ),
    );
  }
}
