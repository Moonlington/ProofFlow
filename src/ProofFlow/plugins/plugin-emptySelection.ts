import { Plugin } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { ProofFlowSchema } from "../editor/proofFlowSchema.ts"; // Adjust the path as necessary

// Helper function to check if a node type is valid in ProofFlowSchema
function isValidNodeType(nodeType: string) {
    return ProofFlowSchema.nodes[nodeType] !== undefined;
}

export let preventEmptyNodeSelection = new Plugin({
    props: {
        handleKeyDown(view: EditorView, event: KeyboardEvent) {
            const { state } = view;
            const { selection } = state;
            const node = selection.$from.node();

            // If the selection is empty or is not in a recognized node, prevent creating new code_mirror nodes
            console.log(node.type.name)
            if (
                selection.empty &&
                node &&
                (!isValidNodeType(node.type.name) || node.type.name === "doc" || node.type.name === "input_content")
            ) {
                // Prevent typing and creating nodes in empty selection
                event.preventDefault();
                return true;
            }
            return false;
        },
    },
});
