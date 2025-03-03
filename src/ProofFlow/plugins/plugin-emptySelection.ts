import { EditorState, Plugin } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { ProofFlowSchema } from "../editor/Schema/proofFlowSchema.ts";
import { getSelectionType } from "../commands/helpers.ts";

// Helper function to check if a node type is valid in ProofFlowSchema
function isValidNodeType(nodeType: string) {
  return ProofFlowSchema.nodes[nodeType] !== undefined;
}

// Custom command to handle typing with a node selected
function customTextInput(state: EditorState) {
  const { $from, $to } = state.selection;
  let selectionType = getSelectionType(state.selection);

  // Check if a node is selected
  if (
    selectionType.isNodeSelection &&
    $from.sameParent($to) &&
    $from.nodeAfter
  ) {
    return true;
  }

  // If no special handling is needed, return false to allow normal behavior
  return false;
}

/**
 * Plugin to prevent empty node selection in the editor.
 */
export let preventEmptyNodeSelection = new Plugin({
  props: {
    handleKeyDown(view: EditorView, event: KeyboardEvent) {
      const { state } = view;
      const { selection } = state;
      const node = selection.$from.node();

      // Disallow typing when selecting a node
      if (customTextInput(state)) {
        return true;
      }

      // If the selection is empty or is not in a recognized node, prevent creating new code_mirror nodes
      if (
        selection.empty &&
        node &&
        (!isValidNodeType(node.type.name) ||
          node.type.name === "doc" ||
          node.type.name === "input_content")
      ) {
        // Prevent typing and creating nodes in empty selection
        event.preventDefault();
        return true;
      }
      // Allow typing in other nodes
      return false;
    },
  },
});
