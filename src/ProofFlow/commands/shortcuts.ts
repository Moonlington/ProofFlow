import { EditorView } from "prosemirror-view";
import { selectParentNode } from "prosemirror-commands";
import {
  getCollapsibleInsertCommand,
  getInputInsertCommand,
} from "./insert-commands";
import { proofFlow, showOverlay } from "../../main";
import { UserMode } from "../UserMode/userMode";
import { cmdInsertCode, cmdInsertMarkdown, cmdInsertMath } from "./commands";
import { InsertionPlace } from "./helpers";
import { markdownRenderedClickFix } from "../plugins/markdown-extra";

// Helper function to generate unique key combination strings
function getKeyCombination(event: KeyboardEvent) {
  let keys = [];
  if (event.ctrlKey || event.metaKey) keys.push("Ctrl");
  if (event.shiftKey) keys.push("Shift");
  keys.push(event.key.toLowerCase());
  return keys.join("+");
}

/**
 * Applies global key bindings to the editor view.
 * @param editorView - The editor view to apply key bindings to.
 *
 * @returns function to remove the keybindings
 */
export function applyGlobalKeyBindings(editorView: EditorView): () => void {
  // Mapping of key combinations to actions
  // Add comments here to describe the purpose of each key binding
  // "Ctrl + B" or "Cmd + B" for collapsible insert command (only for teacher mode)
  // "Ctrl + E" or "Cmd + E" for inserting code area underneath
  // "Ctrl + Shift + E" or "Cmd + Shift + E"  for inserting code area above
  // "Ctrl + I" or "Cmd + I" for input insert command (only for teacher mode)
  // "Ctrl + L" or "Cmd + L" for inserting math area underneath
  // "Ctrl + Shift + L" or "Cmd + Shift + L"  for inserting math area above
  // "Ctrl + M" or "Cmd + M" for inserting code area underneath
  // "Ctrl + Shift + M" or "Cmd + Shift + M"  for inserting code area above
  // "Ctrl + P" or "Cmd + P" for selecting parent node
  // "Ctrl + S" or "Cmd + S" for saving the file (only for teacher mode)
  // "Ctrl + Y" or "Cmd + Y" for redo
  // "Ctrl + Z" or "Cmd + Z" for undo
  // "Escape" for closing the settings overlay
  const keyBindings: { [key: string]: () => void } = {
    "Ctrl+b": () => {
      if (proofFlow.getUserMode() === UserMode.Teacher) {
        let command = getCollapsibleInsertCommand();
        command(editorView.state, editorView.dispatch);
      }
    },
    "Ctrl+e": () => {
      let command = cmdInsertCode(InsertionPlace.Underneath);
      command(editorView.state, editorView.dispatch);
    },
    "Ctrl+Shift+e": () => {
      let command = cmdInsertCode(InsertionPlace.Above);
      command(editorView.state, editorView.dispatch);
    },
    "Ctrl+i": () => {
      if (proofFlow.getUserMode() === UserMode.Teacher) {
        let command = getInputInsertCommand();
        command(editorView.state, editorView.dispatch);
      }
    },
    "Ctrl+l": () => {
      let command = cmdInsertMath(InsertionPlace.Underneath);
      command(editorView.state, editorView.dispatch);
    },
    "Ctrl+Shift+l": () => {
      let command = cmdInsertMath(InsertionPlace.Above);
      command(editorView.state, editorView.dispatch);
    },
    "Ctrl+m": () => {
      let command = cmdInsertMarkdown(InsertionPlace.Underneath);
      command(editorView.state, editorView.dispatch);
      markdownRenderedClickFix();
    },
    "Ctrl+Shift+m": () => {
      let command = cmdInsertMarkdown(InsertionPlace.Above);
      command(editorView.state, editorView.dispatch);
      markdownRenderedClickFix();
    },
    "Ctrl+p": () => {
      selectParentNode(editorView.state, editorView.dispatch);
    },
    "Ctrl+s": () => {
      proofFlow.saveFile();
    },
    "Ctrl+y": () => {
      proofFlow.customRedo();
    },
    "Ctrl+z": () => {
      proofFlow.customUndo();
    },
    escape: () => {
      showOverlay(false);
    },
  };

  let globalKeyBindings = (event: KeyboardEvent) => {
    const keyCombination = getKeyCombination(event);
    const action = keyBindings[keyCombination];
    if (action) {
      event.preventDefault();
      event.stopPropagation();
      action();
    }
  };
  document.addEventListener("keydown", globalKeyBindings);

  return () => {
    document.removeEventListener("keydown", globalKeyBindings);
  };
}
