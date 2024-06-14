import { hoverTooltip } from "@codemirror/view";
import { LSPMessenger } from "../../../basicLspFunctions";

export const wordHover = hoverTooltip((view, pos, side) => {
  let { from, to, text } = view.state.doc.lineAt(pos);
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
      LSPMessenger.hover("CoqIntro_short.v", pos, start - from).then(
        (response) => {
          dom.textContent = response.contents.value;
        },
      );
      return { dom };
    },
  };
});
