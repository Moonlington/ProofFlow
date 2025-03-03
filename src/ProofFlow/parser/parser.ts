export { SimpleParser };

import { ProofFlowDocument, OutputConfig } from "../editor/ProofFlowDocument";

import {
  AreaType,
  Area,
  CollapsibleArea,
  InputArea,
} from "../editor/ProofFlowArea.ts";

/**
 * Interface for a parser.
 */
export interface Parser {
  parse(document: string): ProofFlowDocument;
}
// TODO: NEEDS DOCUMENTATION key = AreaType: [begin, end]
type AreaConfig = [RegExp, RegExp];

export type ParserConfig = {
  [key: string]: AreaConfig;
};

/**
 * A simple parser to parse a document.
 * The parser creates areas following the ProofFlow schema
 */
class SimpleParser implements Parser {
  config: ParserConfig;
  outputConfig: OutputConfig;
  defaultAreaType: Exclude<AreaType, AreaType.Collapsible | AreaType.Input> =
    AreaType.Text;

  /**
   * Constructor for this SimpleParser class
   * @param config
   * @param outputConfig
   */
  constructor(config: ParserConfig, outputConfig: OutputConfig) {
    this.config = config;
    this.outputConfig = outputConfig;
  }

  /**
   * Creates an area of the given type with the given content.
   * @param type
   * @param content
   */
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

  /**
   * Handles the creation and population of CollapsibleArea and InputArea
   * @param nextAreaType
   * @param startRegex
   * @param rest
   * @returns a tuple containing the area and the remaining string to be parsed
   */
  handleSpecialAreas(
    nextAreaType: AreaType,
    startRegex: RegExpExecArray,
    rest: string
  ): [Area, string] {
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
    if (containedAreas.length === 0) {
      containedAreas = [new Area(this.defaultAreaType, "")];
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
    return [area!, rest];
  }

  /**
   * Parses the given document and returns a ProofFlowDocument.
   * @param document
   */
  parse(document: string): ProofFlowDocument {
    let pfDocument = new ProofFlowDocument("", []);
    pfDocument.outputConfig = this.outputConfig;
    return this.recurParse(pfDocument, document);
  }

  /**
   * Parses the given `rest` string and returns the next area type and the matched regular expression array.
   * @param rest - The string to be parsed.
   * @returns A tuple containing the next area type and the matched regular expression array.
   */
  getNextAreaRegex(rest: string): [AreaType, RegExpExecArray] {
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
    return [nextAreaType, startRegex];
  }

  /**
   * Continually parses the document until there is no more content to parse.
   * @param doc
   * @param rest
   */
  recurParse(doc: ProofFlowDocument, rest: string): ProofFlowDocument {
    if (rest === "") return doc;

    // Find the next area to parse and the matched regular expression
    const [nextAreaType, startRegex] = this.getNextAreaRegex(rest);

    // Stop the recursion if there are no more areas to parse
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
      const [area, newRest] = this.handleSpecialAreas(nextAreaType, startRegex, rest);
      doc.addArea(area);
      return this.recurParse(doc, newRest);
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

    // Recur with the rest of the document
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

  /**
   * Continually parses contained areas
   * @param areas
   * @param type
   * @param rest
   */
  recurContainedAreas(
    areas: Area[],
    type: AreaType,
    rest: string,
  ): [Area[], string] {
    let closingRegex = this.config[type][1].exec(rest);

    // If there are no more areas, return the areas and this means there is no more content to parse
    if (closingRegex === null) {
      areas.push(this.createArea(this.defaultAreaType, rest));
      return [areas, ""];
    }

    // Find the next area to parse and the matched regular expression
    const [nextAreaType, startRegex] = this.getNextAreaRegex(rest);

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
      const [area, newRest] = this.handleSpecialAreas(nextAreaType, startRegex, rest);
      areas.push(area);
      return this.recurContainedAreas(areas, type, newRest);
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

    // recur with the rest of the contained areas
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
