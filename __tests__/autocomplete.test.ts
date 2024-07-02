// import {
//     autocompletion,
//     CompletionContext,
//     CompletionResult,
//   } from "@codemirror/autocomplete";
//   import { CompletionList } from "../src/ProofFlow/lspClient/models.ts";
import { autocomplete } from "../src/ProofFlow/codemirror/extensions/autocomplete.ts";
import { CodeMirrorView } from "../src/ProofFlow/codemirror/codemirrorview.ts";
import { ProofFlow } from "../src/ProofFlow/editor/ProofFlow.ts";
import { Schema } from "prosemirror-model";
import { ProofFlowSchema } from "../src/ProofFlow/editor/proofFlowSchema.ts";

// Tests the autocomplete function
describe('autocomplete', () => {
  // Returns completion results when LSP client provides valid data
  it('should return completion results when LSP client provides valid data', async () => {
    const mockLSPClient: LSPClientHandler = {
      initialize: jest.fn(),
      initialized: true,
      shutdown: jest.fn(),
      exit: jest.fn(),
      // Add other required properties here
      completion: jest.fn().mockResolvedValue({
        isIncomplete: false,
        items: [{ label: 'testCompletion' }],
      }),
    };
    const mockProofFlow: ProofFlow = {
      _editorElem: new HTMLElement(),
      _containerElem: new HTMLElement(),
      _schema: new Schema({}),
      editorStateConfig: {},
      getLSPClient: () => mockLSPClient,
      findNode: jest.fn().mockReturnValue([{ attrs: { id: 'testId' } }]),
      pfDocument: {
        _outputConfig: {},
        uri: ''
      },
    };
    const view = new CodeMirrorView(mockProofFlow, { node: {}, view: {}, getPos: () => 0 });
    const context = {
      state: { doc: { lineAt: jest.fn().mockReturnValue({ text: 'test', from: 0 }) } },
      pos: 1,
    };
    const result = await autocomplete(view).override[0](context);
    expect(result).toEqual({ from: 1, options: [{ label: 'testCompletion' }] });
  });

  // Handles cases where the trigger character is at the start of the line
  it('should handle cases where the trigger character is at the start of the line', async () => {
    const mockLSPClient = {
      completion: jest.fn().mockResolvedValue({
        isIncomplete: false,
        items: [{ label: 'testCompletion' }],
      }),
    };
    const mockProofFlow = {
      getLSPClient: () => mockLSPClient,
      findNode: jest.fn().mockReturnValue([{ attrs: { id: 'testId' } }]),
      pfDocument: {
        areas: {},
        _outputConfig: {},
        uri: '',
        documentProgressed: jest.fn(),
      },
    };
    const view = new CodeMirrorView(mockProofFlow, { node: {}, view: {}, getPos: () => 0 });
    const context = {
      state: { doc: { lineAt: jest.fn().mockReturnValue({ text: 't', from: 0 }) } },
      pos: 1,
    };
    const result = await autocomplete(view).override[0](context);
    expect(result).toEqual({ from: 1, options: [{ label: 'testCompletion' }] });
  });
});
