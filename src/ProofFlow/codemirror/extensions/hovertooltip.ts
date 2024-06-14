import { hoverTooltip } from "@codemirror/view";
import { LSPMessenger } from "../../../basicLspFunctions";
import { Text } from '@codemirror/state';
import CodeMirrorView from "../codemirrorview";
import { ProofFlow } from "../../editor/ProofFlow";
import { offsetToPos } from "./mappinghelper";

/**
 * Copied and modified from https://codemirror.net/examples/tooltip/
 * 
 * Extension for hovering in CodeMirror
 * @param instance Relevant CodeMirror instance
 * @returns 
 */
export function getHoverExtension(instance: CodeMirrorView) {
  return hoverTooltip((view, pos, side) => {
    let { from, to, text } = view.state.doc.lineAt(pos);
    let {line, character} = offsetToPos(instance, view.state.doc, pos);
    let start = pos,
      end = pos;
    while (start > from && /\w/.test(text[start - from - 1])) start--;
    while (end < to && /\w/.test(text[end - from])) end++;
    if ((start == pos && side < 0) || (end == pos && side > 0)) return null;
    return {
      pos: start,
      end,
      above: true,
      create(view) {
        let dom = document.createElement("div");
        dom.textContent = text.slice(start - from, end - from);
        LSPMessenger.hover(ProofFlow.fileName, line, character).then((response) => {
          dom.textContent = response.contents.value
        });
        return { dom };
      },
    }
  });
}