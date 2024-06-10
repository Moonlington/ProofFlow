import { EditorView } from "prosemirror-view";
import { undo, redo } from "prosemirror-history";
import { selectParentNode } from "prosemirror-commands";
import {
  getCollapsibleInsertCommand,
  getInputInsertCommand,
} from "./insert-commands";
import { proofFlow } from "../../main";
import { UserMode } from "../UserMode/userMode";
import { Minimap } from "../minimap";

/**
 * Applies global key bindings to the editor view.
 * @param editorView - The editor view to apply key bindings to.
 *
 * @returns function to remove the keybindings
 */
export function applyGlobalKeyBindings(
  editorView: EditorView,
  minimap: Minimap,
): () => void {
  let globalKeyBindings = (event: KeyboardEvent) => {
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
    } else if (
      event.key === "i" &&
      (event.ctrlKey || event.metaKey) &&
      proofFlow.getUserMode() === UserMode.Teacher
    ) {
      event.preventDefault();
      let command = getInputInsertCommand();
      command(editorView.state, editorView.dispatch);
    } else if (event.key === "h" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      minimap.switch();
    }
    // Add comments here to describe the purpose of each key binding
    // "Ctrl + Z" or "Cmd + Z" for undo
    // "Ctrl + Y" or "Cmd + Y" for redo
    // "Ctrl + P" or "Cmd + P" for selecting parent node
    // "Ctrl + B" or "Cmd + B" for collapsible insert command
    // "Ctrl + I" or "Cmd + I" for input insert command (only for teacher mode)
    // "Ctrl + H" or "Cmd + H" for toggling the minimap
  };
  document.addEventListener("keydown", globalKeyBindings);

  return () => {
    document.removeEventListener("keydown", globalKeyBindings);
  };
}
