import { hoverTooltip } from "@codemirror/view";
import { LSPMessenger } from "../../../basicLspFunctions";
import { Text } from '@codemirror/state';
import CodeMirrorView from "../codemirrorview";
import { ProofFlow } from "../../editor/ProofFlow";

function offsetToPos(instance: CodeMirrorView, doc: Text, offset: number) {
  const line = doc.lineAt(offset);
  const lineNumber = instance.lineStart + doc.lineAt(offset).number - 1;
  const character = offset - line.from;
  console.log('Line:', line, 'Character:', character);

  console.log('Line: ', lineNumber, 'Character: ', character);
  return {line: lineNumber, character: character};
}

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