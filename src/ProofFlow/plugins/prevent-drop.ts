import { Plugin } from "prosemirror-state";

export let preventDropPlugin = new Plugin({
  props: {
    handleDrop(_view, _from, _to, _slice) {
      return true;
    },
  },
});
