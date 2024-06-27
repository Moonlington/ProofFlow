import { ProofFlow } from "../editor/ProofFlow";
import { Node } from "prosemirror-model";
import { ProofFlowSchema } from "../editor/proofFlowSchema";
import { UserMode, lockEditing } from "../UserMode/userMode";
import { highLevelCells, markdownToRendered } from "../commands/helpers";
import { TextSelection } from "prosemirror-state";

/**
 * Renders all markdown nodes in the ProofFlow editor.
 *
 * @param proofFlow The ProofFlow instance.
 */
export function renderAllMarkdown(proofFlow: ProofFlow) {
  const view = proofFlow.getEditorView();
  let newNodes = Array<Node>();
  let trans = view.state.tr;
  const pos = view.state.selection.from;

  view.state.doc.descendants((node) => {
    // If the node being clicked is not a valid node or the click is not a user action, return
    if (
      !highLevelCells.includes(node.type.name) ||
      node.type.name === undefined
    )
      return false;

    // Create a new node to store the new node
    let newNode: Node = node;

    // If the node is a markdown node, replace it with a markdown_rendered node
    if (node.type.name === "markdown") {
      newNode = markdownToRendered(node, ProofFlowSchema);
    }

    // If the node is a collapsible node, replace the markdown nodes in the collapsible content node
    else if (node.type.name === "collapsible") {
      let collapsibleParentNode: Node = node; // Get the collapsible parent node
      let collapsibleTitleNode: Node = collapsibleParentNode.firstChild!; // Get the collapsible title node
      let collapsibleContentNode: Node = collapsibleParentNode.child(1)!; // Get the collapsible content node
      let newCollapsibleChildNodes: Node[] = Array<Node>(); // Create an array to store the new child nodes

      // Go trough all the descendants of the collapsible content node
      collapsibleContentNode.descendants((node) => {
        if (!highLevelCells.includes(node.type.name)) return false; // Makes sure we do not treat low level nodes such as paragraphs or text nodes, cause duplication would occur

        // If we are either in the clicked on markdown node or in a code_mirror or math_display node no further cases will apply
        // hence this node will not be re-assigned and we just re-use the original node
        let newChildNode: Node = node;

        // If the child node is the clicked markdown_rendered node, replace it with a markdown node
        if (node.type.name === "markdown") {
          newChildNode = markdownToRendered(node, ProofFlowSchema);
        }

        // If it is neither the clicked markdown_rendered node nor a markdown node, add it as is
        newCollapsibleChildNodes.push(newChildNode);
      });

      // Create the new collapsible content node with the new child nodes
      let newCollapsibleContentNode = ProofFlowSchema.node(
        "collapsible_content",
        { visible: collapsibleContentNode.attrs.visible },
        newCollapsibleChildNodes,
      );

      // Replace the old colllapsible content child node of the collapsible parent node with the new one
      let newCollapsibleNode = ProofFlowSchema.node(
        "collapsible",
        { id: collapsibleParentNode.attrs.id },
        [collapsibleTitleNode, newCollapsibleContentNode],
      );

      // Set the new node to the new collapsible node
      newNode = newCollapsibleNode;
    }

    // If the node is an input node, replace the markdown nodes in the input content node
    else if (node.type.name === "input") {
      let inputParentNode: Node = node;
      let inputContentNode: Node = inputParentNode.child(0)!;
      let newInputChildNodes: Node[] = Array<Node>();

      // Go through all the descendants of the input content node
      inputContentNode.descendants((node) => {
        if (!highLevelCells.includes(node.type.name)) return false;

        let newChildNode: Node = node;

        // If the child node is the clicked markdown_rendered node, replace it with a markdown node
        if (node.type.name === "markdown") {
          newChildNode = markdownToRendered(node, ProofFlowSchema);
        }

        newInputChildNodes.push(newChildNode);
      });

      // Create the new input content node with the new child nodes
      let newInputContentNode = ProofFlowSchema.node(
        "input_content",
        { visible: true },
        newInputChildNodes,
      );

      let newInputNode = ProofFlowSchema.node(
        "input",
        { id: node.attrs.id, proof: node.attrs.proof },
        newInputContentNode,
      );

      // Replace the old input content child node of the input parent node with the new one
      newNode = newInputNode;
    }

    newNodes.push(newNode); // Push the new node to the new nodes array
  });

  // Replace the old document with the new nodes
  trans.replaceWith(0, view.state.doc.content.size, newNodes);

  // Ensure the selection remains correct
  const resolvedPos = trans.doc.resolve(pos);
  trans.setSelection(TextSelection.near(resolvedPos, 1));

  // Dispatch the transaction
  view.dispatch(trans);

  // Ensure undo tracking is added
  proofFlow.addUndoTrack();

  // Ensure the new markdown elements are locked
  if (proofFlow.getUserMode() === UserMode.Student) {
    lockEditing(true);
  }
}

/**
 * Fixes the click event propagation issue for rendered markdown elements.
 * Without this clicking inside of editable markdown elements would
 * propagate the click event to the parent element.
 * This prevents it from rendering the markdown again.
 */
export function markdownRenderedClickFix() {
  document.querySelectorAll("markdown").forEach((element) => {
    element.removeEventListener("click", (e) => e.stopPropagation()); // Remove existing listeners to avoid duplication
    element.addEventListener("click", (e) => e.stopPropagation());
  });
}
