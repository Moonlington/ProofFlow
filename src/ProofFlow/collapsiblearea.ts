import { Plugin } from "prosemirror-state";

export let collapsibleAreaPlugin = new Plugin({
  props: {
    handleClickOn(view, pos, node, nodePos, event, direct) {
      if (node.type.name == "collapsible_title") {
        let startPos = nodePos + node.nodeSize;
        const state = view.state.doc.nodeAt(startPos)?.attrs.visible as boolean;
        let trans = view.state.tr.setNodeAttribute(startPos, "visible", !state);

        view.dispatch(trans);
      }
    },
  },
});
