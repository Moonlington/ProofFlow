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
    let pfDocument: ProofFlowDocument = new ProofFlowDocument([]);
    let index = 0;
    while (index > document.length) {
      let nextAreaType: AreaType;
      let minIndex: number = -1;
      for (let type of Object.values(AreaType)) {
        let startIndex = document.indexOf(this.config[type][0], index);
        if (minIndex > startIndex) nextAreaType = type;
      }

      if (minIndex === -1) {
        pfDocument.addArea(this.createArea(this.defaultAreaType, document));
        break;
      }

      index = minIndex + this.config[nextAreaType!][0].length;

      let endIndex: number = document.indexOf(
        this.config[nextAreaType!][1],
        index,
      );
      if (endIndex === -1) {
        continue;
      }
      if (minIndex > index)
        pfDocument.addArea(
          this.createArea(
            this.defaultAreaType,
            document.slice(index, minIndex),
          ),
        );
      pfDocument.addArea(
        this.createArea(nextAreaType!, document.slice(minIndex, endIndex)),
      );
      index = endIndex + this.config[nextAreaType!][1].length;
    }
    return pfDocument;
  }
}
