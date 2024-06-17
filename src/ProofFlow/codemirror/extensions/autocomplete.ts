import {
  autocompletion,
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";
import { CompletionItem } from "../../lspClient/models.ts";
import CodeMirrorView from "../codemirrorview.ts";

export function autocomplete(view: CodeMirrorView) {
  return autocompletion({
    override: [
      async (context: CompletionContext): Promise<CompletionResult | null> => {
        return new Promise(async (resolve, _) => {
          const { state, pos } = context;

          const lsp = view.proofflow.getLSPClient();
          if (!lsp) return resolve(null);

          let found = view.proofflow.findNode(
            (_, pos) => pos === view.getPos(),
          );
          if (!found) {
            console.error("What the frick", found, context);
            return;
          }

          let area = view.proofflow.pfDocument.getAreaById(found[0].attrs.id);
          if (!area) {
            console.error("WHAT", found, context);
            return;
          }

          let line = state.doc.lineAt(pos);
          let trigChar = line.text[pos - line.from - 1];
          let position = area.getPosition(pos);

          const result = await lsp.completion(position, trigChar);
          if (!result) return resolve(null);

          const completionItems = result as CompletionItem[];

          if (!completionItems) return;

          resolve({ from: pos, options: completionItems });
        });
      },
    ],
  });
}
