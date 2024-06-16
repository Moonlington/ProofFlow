import { ProofFlow } from "../../editor/ProofFlow.ts";
import { autocompletion, CompletionContext } from "@codemirror/autocomplete";
import { Text } from "@codemirror/state";

function offsetToPos(doc: Text, offset: number) {
  const line = doc.lineAt(offset);
  const character = offset - line.from;
  console.log("Line:", line, "Character:", character);

  return { line: line.number, character };
}

export function autocomplete(pf: ProofFlow) {
  return autocompletion({
    override: [
      async (context: CompletionContext): Promise<any> => {
        const { state, pos } = context;
        const line = state.doc.lineAt(pos);

        const lsp = pf.getLSPClient();

        if (!lsp) return;

        let trigChar: string | undefined;
        trigChar = line.text[pos - line.from - 1];

        const completionItems = await lsp.completion(
          offsetToPos(state.doc, pos),
          trigChar,
        );

        if (!completionItems) return;

        return {
          from: context.pos,
          options: completionItems,
        };
      },
    ],
  });
}
