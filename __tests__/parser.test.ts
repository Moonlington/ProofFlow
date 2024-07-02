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

// Tests createArea
describe('createArea', () => {

  // createArea should return an Area object when type is Text
  it('should return an Area object when type is Text', () => {
    const config = {}; // Mock config
    const outputConfig = {}; // Mock outputConfig
    const parser = new SimpleParser(config, outputConfig);
    const area = parser.createArea(AreaType.Text, "This is a text area");
    expect(area).toBeInstanceOf(Area);
    expect(area.type).toBe(AreaType.Text);
    expect(area.content).toBe("This is a text area");
  });

  // createArea should handle empty content for Text, Code, and Math areas
  it('should handle empty content for Text, Code, and Math areas', () => {
    const config = {}; // Mock config
    const outputConfig = {}; // Mock outputConfig
    const parser = new SimpleParser(config, outputConfig);

    const textArea = parser.createArea(AreaType.Text, "");
    expect(textArea).toBeInstanceOf(Area);
    expect(textArea.type).toBe(AreaType.Text);
    expect(textArea.content).toBe("");

    const codeArea = parser.createArea(AreaType.Code, "");
    expect(codeArea).toBeInstanceOf(Area);
    expect(codeArea.type).toBe(AreaType.Code);
    expect(codeArea.content).toBe("");

    const mathArea = parser.createArea(AreaType.Math, "");
    expect(mathArea).toBeInstanceOf(Area);
    expect(mathArea.type).toBe(AreaType.Math);
    expect(mathArea.content).toBe("");
  });
});