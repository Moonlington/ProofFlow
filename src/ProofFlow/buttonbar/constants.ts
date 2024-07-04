import { NodeSelection } from "prosemirror-state";
import { proofFlow, showOverlay } from "../../main";
import { UserMode } from "../UserMode/userMode";
import {
  getContainingNode,
  requestConfirm,
  toggleLineNumbers,
} from "../commands/helpers";
import { undo, redo, closeHistory } from "prosemirror-history";
import { deleteSelection, selectParentNode } from "prosemirror-commands";
import { EditorView } from "prosemirror-view";
import {
  getCollapsibleInsertCommand,
  getInputInsertCommand,
} from "../commands/insert-commands";

/**
 * Creates a delete function that deletes the selected content in the editor view.
 * @param editorView The editor view instance.
 * @returns A function that deletes the selected content.
 */
export function createDeleteFunction(editorView: EditorView): () => void {
  return () => {
    // Check if the user is in student mode and the selection is outside of an input node
    const selection = editorView.state.selection;
    let container = getContainingNode(selection);

    // If the user is in student mode and the selection is outside of an input node, return
    if (
      proofFlow.getUserMode() === UserMode.Student &&
      container?.type.name !== "input_content"
    )
      return;

    // Delete the selected content
    if (editorView.state.selection instanceof NodeSelection) {
      // this works for math nodes
      deleteSelection(editorView.state, editorView.dispatch);
    } else {
      // this works for markdown and code blocks
      // delete the content of the selection
      const depth = editorView.state.selection.$head.depth;
      let tr = editorView.state.tr;
      tr.delete(
        editorView.state.selection.$head.before(depth),
        editorView.state.selection.$head.after(depth),
      );
      tr = closeHistory(tr);
      editorView.dispatch(tr);
    }

    // get the node containing the selection check if the selection moved outside of input when it shouldn't
    container = getContainingNode(editorView.state.selection);
    // check if selection moved illegaly
    if (
      proofFlow.getUserMode() == UserMode.Student &&
      container?.type.name !== "input_content"
    ) {
      // if it did, deselect all nodes to ensure the user can't interact with the content
      proofFlow.deselectAll();
    }
  };
}

/**
 * Creates a list of buttons for the button bar.
 * @param editorView The editor view.
 * @returns The list of buttons.
 */
export function createButtonsList(editorView: EditorView) {
  // Create the delete function
  const deleteFunction = createDeleteFunction(editorView);

  // Return the list of buttons
  return [
    {
      // Create the button for deleting content
      name: "Delete",
      command: deleteFunction,
      hoverText: "Delete the selected node or content.",
    },
    {
      // Create the button for toggling line numbers
      name: "Line nr",
      command: () => {
        toggleLineNumbers();
      },
      hoverText: "Toggle line numbers",
    },
    {
      // Create the button for selecting the parent node
      name: "Parent",
      command: () => selectParentNode(editorView.state, editorView.dispatch),
      hoverText: "Select the parent node(Ctrl-p)",
    },
    {
      // Create the button for inserting an input node
      name: "Input",
      command: () => {
        let command = getInputInsertCommand(proofFlow);
        command(editorView.state, editorView.dispatch);
      },
      hoverText: "Place the current node in an input node(Ctrl-i)",
    },
    {
      // Create the button for inserting a collapsible node
      name: "Collapse",
      command: () => {
        let command = getCollapsibleInsertCommand(proofFlow);
        command(editorView.state, editorView.dispatch);
      },
      hoverText: "Place the current node in an colapsible node(Ctrl-b)",
    },
  ];
}

/**
 * Creates an array of setting commands for the button bar.
 * @param editorView The editor view object.
 * @returns An array of setting commands.
 */
export function createSettingCommands(editorView: EditorView) {
  return [
    {
      // Create the button for showing the settings menu
      symbol: "&#9881;",
      cmd: () => showOverlay(true),
      hoverText: "Show Settings Menu",
    },
    {
      // Create the button for clearing the file
      symbol: "&#x21bb;",
      cmd: async () => {
        if (await requestConfirm("Are you sure you want to clear the file?")) {
          // Clear the file
          proofFlow.reset();
          proofFlow.setFileName("File.mv");
        }
      },
      hoverText: "Clear File",
    },
    {
      // Create the button for saving the file
      symbol: "&#x1F5AB;",
      cmd: () => proofFlow.saveFile(),
      hoverText: "Save File",
    },
    {
      // Create the button for opening the file
      symbol: "&#x1f5c1;",
      cmd: () => NaN,
      hoverText: "Open File",
    },
    {
      // Create the button for undoing the last action
      symbol: "&#8617;",
      cmd: () => undo(editorView.state, editorView.dispatch),
      hoverText: "Undo Last Action(Ctrl-z)",
    },
    {
      // Create the button for redoing the last action
      symbol: "&#8618;",
      cmd: () => redo(editorView.state, editorView.dispatch),
      hoverText: "Redo Last Action(Ctrl-y)",
    },
  ];
}
