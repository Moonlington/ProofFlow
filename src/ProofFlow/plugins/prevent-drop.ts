import { Plugin } from "prosemirror-state";

/**
 * Plugin to prevent the drop of nodes
 */
export let preventDropPlugin = new Plugin({
  props: {
    handleDrop(_view, _from, _to, _slice) {
      return true;
    },
  },
});
