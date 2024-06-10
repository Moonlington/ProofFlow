import { Plugin } from "prosemirror-state";

export let preventDropPlugin = new Plugin({
  props: {
    handleDrop(view, from, to, slice) {
      return true;
    },
  },
});
