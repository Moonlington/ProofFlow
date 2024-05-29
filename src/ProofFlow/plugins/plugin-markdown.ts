import {EditorState, Plugin} from "prosemirror-state";
import {EditorView} from "prosemirror-view";
import { getContainingNode } from "../commands/helpers";
export const testPlugin = new Plugin({
    
    view() {
        return {
            update(view: EditorView) {
                
            }
            
        }
    }
});