import {
  autocompletion,
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";
import { CompletionList } from "../../lspClient/models.ts";
import CodeMirrorView from "../codemirrorview.ts";

/**
 * Autocompletion function for the CodeMirrorView
 * @param {CodeMirrorView} view - The CodeMirrorView instance
 * @returns - The autocompletion function
 */
export function autocomplete(view: CodeMirrorView) {
  return autocompletion({
    override: [
      // Override the default autocompletion function
      async (context: CompletionContext): Promise<CompletionResult | null> => {
        return new Promise(async (resolve, _) => {
          const { state, pos } = context;

          const lsp = view.proofflow.getLSPClient(); // Get the LSP client
          if (!lsp) return resolve(null); // If the LSP client is not available, return null

          // Find the node at the current position
          let found = view.proofflow.findNode(
            (_, pos) => pos === view.getPos(),
          );
          if (!found) {
            return;
          }

          // Get the area at the current position
          let area = view.proofflow.pfDocument.getAreaById(found[0].attrs.id);
          if (!area) {
            return;
          }

          let line = state.doc.lineAt(pos); // Get the line at the current position
          let trigChar = line.text[pos - line.from - 1]; // Get the trigger character
          let position = area.getPosition(pos); // Get the position in the area

          // Get the completion items from the LSP server
          const result = await lsp.completion(
            view.proofflow.pfDocument,
            position,
            trigChar,
          );
          if (!result) return resolve(null); // If no result is returned, return null

          const completionItems = result as CompletionList;

          if (!completionItems) return;

          resolve({ from: pos, options: completionItems.items });
        });
      },
    ],
  });
}
