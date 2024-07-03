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

export function createDeleteFunction(editorView: EditorView): () => void {
  return () => {
    const selection = editorView.state.selection;
    let container = getContainingNode(selection);
    if (
      proofFlow.getUserMode() === UserMode.Student &&
      container?.type.name !== "input_content"
    )
      return;

    if (editorView.state.selection instanceof NodeSelection) {
      // this works for math nodes
      deleteSelection(editorView.state, editorView.dispatch);
    } else {
      // this works for markdown and code blocks
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

export function createButtonsList(editorView: EditorView) {
  // Create the delete function
  const deleteFunction = createDeleteFunction(editorView);

  // Return the list of buttons
  return [
    {
      name: "Delete",
      command: deleteFunction,
      hoverText: "Delete the selected node or content.",
    },
    {
      name: "Line nr",
      command: () => {
        toggleLineNumbers();
      },
      hoverText: "Toggle line numbers",
    },
    {
      name: "Parent",
      command: () => selectParentNode(editorView.state, editorView.dispatch),
      hoverText: "Select the parent node(Ctrl-p)",
    },
    {
      name: "Input",
      command: () => {
        let command = getInputInsertCommand();
        command(editorView.state, editorView.dispatch);
      },
      hoverText: "Place the current node in an input node(Ctrl-i)",
    },
    {
      name: "Collapse",
      command: () => {
        let command = getCollapsibleInsertCommand();
        command(editorView.state, editorView.dispatch);
      },
      hoverText: "Place the current node in an colapsible node(Ctrl-b)",
    },
  ];
}

export function createSettingCommands(editorView: EditorView) {
  return [
    {
      symbol: "&#9881;",
      cmd: () => showOverlay(true),
      hoverText: "Show Settings Menu",
    },
    {
      symbol: "&#x21bb;",
      cmd: async () => {
        if (await requestConfirm("Are you sure you want to clear the file?")) {
          proofFlow.reset();
          proofFlow.setFileName("File.mv");
        }
      },
      hoverText: "Clear File",
    },
    {
      symbol: "&#x1F5AB;",
      cmd: () => proofFlow.saveFile(),
      hoverText: "Save File",
    },
    { symbol: "&#x1f5c1;", cmd: () => NaN, hoverText: "Open File" },
    {
      symbol: "&#8617;",
      cmd: () => undo(editorView.state, editorView.dispatch),
      hoverText: "Undo Last Action(Ctrl-z)",
    },
    {
      symbol: "&#8618;",
      cmd: () => redo(editorView.state, editorView.dispatch),
      hoverText: "Redo Last Action(Ctrl-y)",
    },
  ];
}
