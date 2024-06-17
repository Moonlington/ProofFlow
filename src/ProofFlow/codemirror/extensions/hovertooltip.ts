import { hoverTooltip, Tooltip, EditorView } from "@codemirror/view";
import CodeMirrorView from "../codemirrorview";
import { MarkupContent } from "../../lspClient/models";

export function wordHover(cmview: CodeMirrorView) {
  return hoverTooltip(
    async (
      _view: EditorView,
      pos: number,
      _side: 1 | -1,
    ): Promise<Tooltip | null> => {
      return new Promise(async (resolve, _) => {
        const lsp = cmview.proofflow.getLSPClient();
        if (!lsp) return resolve(null);

        let found = cmview.proofflow.findNode(
          (_, pos) => pos === cmview.getPos(),
        );
        if (!found) return resolve(null);

        let area = cmview.proofflow.pfDocument.getAreaById(found[0].attrs.id);
        if (!area) return resolve(null);

        let position = area.getPosition(pos);

        const result = await lsp.hover(position);

        if (!result) resolve(null);

        return resolve({
          pos: pos,
          above: true,
          create(_view: EditorView) {
            let dom = document.createElement("div");
            dom.textContent = (result?.contents as MarkupContent).value;
            return { dom };
          },
        });
      });
    },
  );
}
