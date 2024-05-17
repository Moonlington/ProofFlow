
// Define your key bindings
import { keymap } from 'prosemirror-keymap';
import {newlineInCode} from "prosemirror-commands";

export const myKeymap: any = keymap({
    "Tab": (state, dispatch) => {
        if(dispatch){ dispatch(state.tr.insertText("\t")); }
        return true;
    },
    "Enter": newlineInCode,
});
