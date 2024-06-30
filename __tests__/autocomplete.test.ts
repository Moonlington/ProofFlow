// import {
//     autocompletion,
//     CompletionContext,
//     CompletionResult,
//   } from "@codemirror/autocomplete";
//   import { CompletionList } from "../src/ProofFlow/lspClient/models.ts";
import { autocomplete } from "../src/ProofFlow/codemirror/extensions/autocomplete.ts";
import { CodeMirrorView } from "../src/ProofFlow/codemirror/codemirrorview.ts";

jest.mock('@codemirror/autocomplete', () => ({
  autocompletion: jest.fn().mockImplementation((config) => config),
}));

describe('autocomplete', () => {
  it('should return completion items', async () => {
    // Mock CodeMirrorView and its methods
    const mockView = {
      proofflow: {
        getLSPClient: jest.fn().mockReturnValue({
          completion: jest.fn().mockResolvedValue({
            items: [{ label: 'testCompletion' }],
          }),
        }),
        findNode: jest.fn().mockReturnValue([{ attrs: { id: 'node1' } }]),
        pfDocument: {
          getAreaById: jest.fn().mockReturnValue({
            getPosition: jest.fn().mockReturnValue({ line: 1, character: 5 }),
          }),
        },
      },
      getPos: jest.fn().mockReturnValue(10),
    } as unknown as CodeMirrorView;

    // Mock CompletionContext
    const mockContext = {
      state: {
        doc: {
          lineAt: jest.fn().mockReturnValue({ text: 'test', from: 0 }),
        },
      },
      pos: 10,
    };

    // Call the autocomplete function with the mocked view
    const result = autocomplete(mockView);

    // Assert the override function is defined
    expect(result.override).toBeDefined();

    // Execute the override function and assert the result
    const overrideFn = result.override[0];
    const completionResult = await overrideFn(mockContext);
    expect(completionResult).toEqual({
      from: 10,
      options: [{ label: 'testCompletion' }],
    });
  });
});