import { hoverTooltip, Tooltip, EditorView } from "@codemirror/view";
import CodeMirrorView from "../codemirrorview";
import { MarkupContent } from "../../lspClient/models";
import { marked } from "marked";

/**
 * Hover tooltip function for the CodeMirrorView
 * @param {CodeMirrorView} cmview - The CodeMirrorView instance
 * @returns - The hover tooltip function
 */
export function wordHover(cmview: CodeMirrorView) {
  return hoverTooltip(
    async (
      _view: EditorView,
      pos: number,
      _side: 1 | -1,
    ): Promise<Tooltip | null> => { 
      return new Promise(async (resolve, _) => {
        // Get the LSP client
        const lsp = cmview.proofflow.getLSPClient(); 
        if (!lsp) return resolve(null); // If the LSP client is not available, return null

        let found = cmview.proofflow.findNode( // Find the node at the position
          (_, pos) => pos === cmview.getPos(),
        );
        if (!found) return resolve(null);

        let area = cmview.proofflow.pfDocument.getAreaById(found[0].attrs.id);
        if (!area) return resolve(null);

        let position = area.getPosition(pos);

        const result = await lsp.hover(cmview.proofflow.pfDocument, position);

        if (!result) return resolve(null);

        return resolve({
          pos: pos,
          above: true,
          create(_view: EditorView) {
            let markdown = marked.parse(
              (result?.contents as MarkupContent).value,
              { async: false },
            );
            let dom = document.createElement("div");
            dom.className = "cm-tooltip-section hovertooltip";
            dom.innerHTML = markdown as string;
            return { dom };
          },
        });
      });
    },
  );
}
