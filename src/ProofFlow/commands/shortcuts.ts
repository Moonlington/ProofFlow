import { EditorView } from "prosemirror-view";
import { undo, redo } from "prosemirror-history";

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
    }
  });
}
