export { Parser, ParserConfig, SimpleParser };

import {
  ProofFlowDocument,
  AreaType,
  Area,
  CollapsibleArea,
  InputArea,
} from "../editor/ProofFlowDocument";

interface Parser {
  parse(document: string): ProofFlowDocument;
}

// TODO: NEEDS DOCUMENTATION key = AreaType: [begin, end]
type AreaConfig = [string, string];

type ParserConfig = {
  [key: string]: AreaConfig;
};

class SimpleParser implements Parser {
  config: ParserConfig;
  defaultAreaType: AreaType = AreaType.Text;

  constructor(config: ParserConfig) {
    this.config = config;
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
    let pfDocument = new ProofFlowDocument([]);
    return this.recurParse(pfDocument, document);
  }

  recurParse(doc: ProofFlowDocument, rest: string): ProofFlowDocument {
    if (rest === "") return doc;

    let nextAreaType: AreaType;
    let startIndex: number = -1;
    for (let type of Object.values(AreaType)) {
      if (type === this.defaultAreaType) continue;
      let i = rest.indexOf(this.config[type][0]);
      if (i === -1) continue;
      if (startIndex > i || startIndex === -1) {
        startIndex = i;
        nextAreaType = type;
      }
    }

    if (startIndex === -1) {
      doc.addArea(this.createArea(this.defaultAreaType, rest));
      return doc;
    }

    if (startIndex !== 0) {
      doc.addArea(
        this.createArea(this.defaultAreaType, rest.slice(0, startIndex)),
      );
    }

    if (
      nextAreaType! === AreaType.Collapsible ||
      nextAreaType! === AreaType.Input
    ) {
    }

    let endIndex = rest.indexOf(
      this.config[nextAreaType!][1],
      startIndex + this.config[nextAreaType!][0].length,
    );

    if (endIndex === -1) {
      doc.addArea(this.createArea(nextAreaType!, rest));
      return doc;
    }

    doc.addArea(
      this.createArea(
        nextAreaType!,
        rest.slice(startIndex + this.config[nextAreaType!][0].length, endIndex),
      ),
    );

    return this.recurParse(
      doc,
      rest.slice(endIndex + this.config[nextAreaType!][1].length),
    );
  }
}
