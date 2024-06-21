import { Plugin } from "prosemirror-state";
import { proofFlow } from "../../main";

export let collapsibleAreaPlugin = new Plugin({
  props: {
    handleClickOn(view, _pos, node, nodePos, _event, _direct) {
      if (node.type.name == "collapsible_title") {
        let startPos = nodePos + node.nodeSize;
        const state = view.state.doc.nodeAt(startPos)?.attrs.visible as boolean;
        let trans = view.state.tr.setNodeAttribute(startPos, "visible", !state);

        view.dispatch(trans);
        proofFlow.addUndoTrack();
      }
    },
  },
});
