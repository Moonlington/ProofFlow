import { hoverTooltip, Tooltip, EditorView } from "@codemirror/view";
import { MarkupContent } from "vscode-languageserver-protocol";
import { ProofFlow } from "../../editor/ProofFlow";

export function wordHover(pf: ProofFlow) {
  return hoverTooltip(
    (view: EditorView, pos: number, side: 1 | -1): Tooltip | null => {
      let { from, to, text } = view.state.doc.lineAt(pos);
      let start = pos,
        end = pos;
      while (start > from && /\w/.test(text[start - from - 1])) start--;
      while (end < to && /\w/.test(text[end - from])) end++;
      if ((start == pos && side < 0) || (end == pos && side > 0)) return null;

      let lsp = pf.getLSPClient();
      if (!lsp) return null;

      return {
        pos: start,
        end,
        above: true,
        create(_view) {
          let dom = document.createElement("div");
          dom.textContent = text.slice(start - from, end - from);
          lsp.hover({ line: pos, character: start - from }).then((response) => {
            dom.textContent = (response?.contents as MarkupContent).value;
          });
          return { dom };
        },
      };
    },
  );
}
