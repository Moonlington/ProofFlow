import { EditorView } from "prosemirror-view";
import { undo, redo } from "prosemirror-history";
import { selectParentNode } from "prosemirror-commands";
import { getCollapsibleInsertCommand } from "./insert-commands";

/**
 * Applies global key bindings to the editor view.
 * @param editorView - The editor view to apply key bindings to.
 */
export function applyGlobalKeyBindings(editorView: EditorView): void {
  document.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "z" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      undo(editorView.state, editorView.dispatch);
      console.log("undo");
    } else if (event.key === "y" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      redo(editorView.state, editorView.dispatch);
    } else if (event.key === "p" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      selectParentNode(editorView.state, editorView.dispatch);
    } else if (event.key === "b" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      let command = getCollapsibleInsertCommand();
      command(editorView.state, editorView.dispatch);
    }
  });
}