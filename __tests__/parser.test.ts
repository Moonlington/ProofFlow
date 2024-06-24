import { SimpleParser, ParserConfig, AreaType } from '../src/ProofFlow/parser/parser';
import { ProofFlowDocument, Area, CollapsibleArea, InputArea } from '../src/ProofFlow/editor/ProofFlowDocument';

jest.mock('../src/ProofFlow/editor/ProofFlowDocument', () => {
  return {
    ProofFlowDocument: jest.fn().mockImplementation(() => {
      return {
        addArea: jest.fn()
      };
    }),
    Area: jest.fn(),
    CollapsibleArea: jest.fn(),
    InputArea: jest.fn()
  };
});

describe('SimpleParser', () => {
  let parserConfig: ParserConfig;
  let parser: SimpleParser;

  beforeEach(() => {
    parserConfig = {
        [AreaType.Text]: [/^TextBegin/, /^TextEnd/],
        [AreaType.Collapsible]: [/^CollapsibleBegin/, /^CollapsibleEnd/],
        [AreaType.Input]: [/^InputBegin/, /^InputEnd/]
    };
    parser = new SimpleParser(parserConfig);
  });

  // is this how the document style is meant to be? becuase i dont think so 
  test('parse() should parse document with Text areas', () => {
    const document = `
        TextBeginThis is text content.TextEnd
        CollapsibleBeginTitle
            TextBeginNested text content.TextEnd
        CollapsibleEnd
        InputBegin
        InputEnd
    `;

    const parsedDocument = parser.parse(document);

    expect(parsedDocument).toBeInstanceOf(ProofFlowDocument);
    expect(parsedDocument.areas.length).toBe(3);
  
    // Validate each parsed area type and content
    const [area1, area2, area3] = parsedDocument.areas;

    expect(area1).toBeInstanceOf(Area);
    expect(area1.type).toBe(AreaType.Text);
    expect(area1.content).toBe("This is text content.");

    expect(area2).toBeInstanceOf(CollapsibleArea);
    expect(area2.type).toBe(AreaType.Collapsible);
    expect(area2.content).toBe("Title");
    expect((area2 as CollapsibleArea).subAreas.length).toBe(1); // Adjust based on nested areas

    const nestedArea = (area2 as CollapsibleArea).subAreas[0];
    expect(nestedArea).toBeInstanceOf(Area);
    expect(nestedArea.type).toBe(AreaType.Text);
    expect(nestedArea.content).toBe("Nested text content.");

    expect(area3).toBeInstanceOf(InputArea);
    expect(area3.type).toBe(AreaType.Input);
  });

    //second attempt
  // test('parse should initialize ProofFlowDocument correctly for text-only document', () => {
  //   const document = 'Some text content';
  //   const pfDocument = parser.parse(document);

  //   expect(ProofFlowDocument).toHaveBeenCalled();
  //   expect(pfDocument.addArea).toHaveBeenCalledWith(expect.any(Area));
  // });

  // test('parse should handle collapsible areas correctly', () => {
  //   const document = 'CollapsibleBegin Some collapsible content CollapsibleEnd';
  //   parser.parse(document);

  //   expect(CollapsibleArea).toHaveBeenCalled();
  // });

  // test('parse should handle input areas correctly', () => {
  //   const document = 'InputBegin Some input content InputEnd';
  //   parser.parse(document);

  //   expect(InputArea).toHaveBeenCalled();
  // });

  // Additional tests can be added to cover more scenarios and configurations
});