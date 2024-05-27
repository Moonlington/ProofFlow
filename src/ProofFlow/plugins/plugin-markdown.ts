import {EditorState, Plugin} from "prosemirror-state";
import {EditorView} from "prosemirror-view";

export const testPlugin = new Plugin({
    view() {
        return {
            update(view: EditorView) {
                console.log(view.state.doc.childCount);
            }
        }
    }
});