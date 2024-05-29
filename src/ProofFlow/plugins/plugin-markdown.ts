import {EditorState, Plugin} from "prosemirror-state";
import {EditorView} from "prosemirror-view";

export const testPlugin = new Plugin({
    
    view() {
        return {
            update(view: EditorView) {
                let $from = view.state.selection.$from;
                let depth = $from.depth
                let node = $from.node(depth);
                console.log(node.type.name);
            }
            
        }
    }
});