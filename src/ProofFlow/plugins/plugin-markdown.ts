import { NodeSelection, Plugin, Transaction } from "prosemirror-state";
import { Node } from "prosemirror-model";
import { TextSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import {
  isClickedNode,
  renderedToMarkdown,
  markdownToRendered,
  highLevelCells,
  getContainingNode,
} from "../commands/helpers.ts";
import { ProofFlowSchema } from "../editor/proofFlowSchema.ts";
import { proofFlow } from "../../main.ts";
import { UserMode, lockEditing } from "../UserMode/userMode.ts";


/**
 * Plugin that handles the conversion between markdown and rendered markdown nodes.
 * Overall idea of the logic:
 * 1. Get the clicked node and its position
 * 2. Go through all the nodes in the document
 * 3. If the node is a markdown node and it is not the clicked node, replace it with a rendered markdown node
 * 4. If the node is a rendered markdown node and it is the clicked node, replace it with a markdown node
 * 5. If the node is a collapsible node, go through all its children and apply the same logic
 * 6. If the node is an input node, go through all its children and apply the same logic
 * 7. Replace the old document with the new one
 * 8. Set the cursor to the correct position (calculated with some magic)
 *    Although it is not perfect, since going from a markdown rendered to markdown will change internal offsets
 *    and thus calculating the exact character the user clicks at is not possible
 */
export const markdownPlugin = new Plugin({
  appendTransaction(transactions, oldState, newState) {
      let trans = newState.tr;
      let sameNode = false;



        // ============== Debugging ==============
        //console.log("Transaction: ", trx, trx.selectionSet);
        console.log("Old state: ", oldState.selection);
        console.log("New state: ", newState.selection);
        // ============== Debugging ==============

        let oldSelection = oldState.selection;
        let newSelection = newState.selection;

        let oldNode = undefined;
        let newNode = undefined;
        let resolvedPosOldNode = oldSelection.$anchor; // Get the resolved position of the old node
        let resolvedPosNewNode = newSelection.$head; // Get the resolved position of the new node

        console.log("DOC SIZE new", newState.doc.nodeSize, " OLD ", oldState.doc.nodeSize)
        // ==========================================================
        // ======== PART: Handling the new node =====================
        // ==========================================================

        // ======== Case: Node Selection ========
        if (newSelection instanceof NodeSelection) {
          newNode = newSelection.node;
          console.log("Node selection: ", newNode.type.name);
        }     
        // ======== Case: Text Selection ========
        else if (newSelection instanceof TextSelection) {
          let index = resolvedPosNewNode.depth;

          // ======== FUNCTION: Get the lowest level area node that the selection is part of ========
          for (let i = resolvedPosNewNode.depth; i > 0; i--) {
            console.log("Node at depth ", i, resolvedPosNewNode.node(i).type.name);
            if (highLevelCells.includes(resolvedPosNewNode.node(i).type.name)) {
              console.log("Found node: ", resolvedPosNewNode.node(i).type.name);
              index = i;
              break;
            }
          }

          newNode = resolvedPosNewNode.node(index); // The lowest level area node that the selection is part of
          console.log("New node: ", newNode.type.name, newNode.attrs.id)
        }

        if (newNode !== undefined && newNode.type.name === "markdown_rendered") {
          let startOfNewNode = resolvedPosNewNode.start(resolvedPosNewNode.depth) - 2; // -2 offset to get the correct position
          console.log(startOfNewNode)
          let endOfNewNode = startOfNewNode + newNode.nodeSize;
          let replacementNode = renderedToMarkdown(newNode, ProofFlowSchema);
          console.log("new node rep pos: ", startOfNewNode, endOfNewNode)
          trans.replaceWith(startOfNewNode, endOfNewNode, replacementNode);
        }
        // ==========================================================
        // ================= PART: Handling the old node ============
        // ==========================================================

        // ======== Case: Node Selection ========
        if (oldSelection instanceof NodeSelection) {
          oldNode = oldSelection.node;
        } 
        // ======== Case: Text Selection ========
        else if (oldSelection instanceof TextSelection) {
          let index = resolvedPosOldNode.depth; // Get the depth of the resolved position

          // ======== FUNCTION: Get the lowest level area node that the selection is part of ========
          for (let i = resolvedPosOldNode.depth; i > 0; i--) {
            if (highLevelCells.includes(resolvedPosOldNode.node(i).type.name)) {
              index = i;
              break;
            }
          }

          oldNode = resolvedPosOldNode.node(index); // The lowest level area node that the selection is part of
          console.log("Old node: ", oldNode.type.name, oldNode.attrs.id)
        }

        // ======== FUNCTION: If the old node was a markdown node, replace it with rendered markdown ========
        if (oldNode !== undefined && oldNode.type.name === "markdown") {       
          let startOfOldNode = resolvedPosOldNode.start(resolvedPosOldNode.depth) - 1; // -1 offset to get the correct position
          let endOfOldNode = startOfOldNode + oldNode.nodeSize;
          let replacementNode = markdownToRendered(oldNode, ProofFlowSchema);
          console.log("old node rep pos: ", startOfOldNode, endOfOldNode)
          trans.replaceWith(startOfOldNode, endOfOldNode, replacementNode);
        }
        

        // ======== FUNCTION: If we are still in the same node, do nothing ========
        if (oldNode !== undefined && newNode !== undefined && oldNode.attrs.id === newNode.attrs.id) {

          // ======== Debugging ==============
          console.log("Same node clicked");
          // ======== Debugging ==============
          sameNode = true;
        } 
 
      return sameNode ? null : trans;
  },
  /*props: {
    handleClickOn(view, pos, node, nodePos, _event, direct) {
      //if (node.type.name === undefined || !direct) return; // If the node being clicked is not a valid node or the click is not a user action, return
      //transformNodes(view, pos, nodePos);
      console.log("Handle click");
    },
    handleDOMEvents: {
      click(view, event) {
        console.log(view.posAtCoords({ left: event.clientX, top: event.clientY }))
        //if (view.posAtCoords({ left: event.clientX, top: event.clientY }) === null) return;
        let startOfNodePos = view.posAtCoords({ left: event.clientX, top: event.clientY })!.pos;
        let clickedNodePos = view.posAtCoords({ left: event.clientX, top: event.clientY })!.inside;
        let node = view.state.doc.nodeAt(clickedNodePos)!;
        //console.log(getContainingNode(view.state.selection)?.firstChild?.type.name);
        console.log("Pos:", startOfNodePos, "Clicked node pos:", clickedNodePos, "Node:", node.type.name)
        transformNodes(view, startOfNodePos, clickedNodePos, node);
        console.log("Default prev?" + event.defaultPrevented)
      },
      blur(view, event) {
        console.log("blur")
      }
    }
  },
});

function transformNodes(view: EditorView, pos: number, nodePos: number, node: Node) {
  let trans = view.state.tr;
  let cursorOffset = pos;
  let clickedPos = nodePos;
  let correctPos = 0;
  let offsetToClicked = 0;
  let newNodes = Array<Node>();
  let container = getContainingNode(view.state.selection);

  // Check if the node is locked
  let locked: boolean =
    proofFlow.getUserMode() === UserMode.Student &&
    container?.type.name !== "input_content";

  // Go through all the descendants of the document node
  view.state.doc.descendants((node, pos) => {
    if (!highLevelCells.includes(node.type.name)) return false; // Makes sure we do not treat low level nodes such as paragraphs or text nodes, cause duplication would occur

    // If we are either in the clicked on markdown node or in a code_mirror or math_display node no further cases will apply
    // hence this node will not be re-assigned and we just re-use the original node
    let newNode: Node = node;
    let bIsClickedNode: boolean = isClickedNode(node, pos, clickedPos);
    console.log(node.nodeSize, node.type.name, pos, bIsClickedNode)

    // Case: This is the clicked on rendered markdown node, hence we need to replace it with a markdown node
    // But not if the node is locked
    if (
      bIsClickedNode &&
      node.type.name === "markdown_rendered" &&
      !locked
    ) {
      newNode = renderedToMarkdown(node, ProofFlowSchema);
    }

    // Case: This is a not-clicked-on markdown node, hence we need to render it to markdown_rendered
    else if (!bIsClickedNode && node.type.name === "markdown") {
      newNode = markdownToRendered(node, ProofFlowSchema);
    }

    // Case: We are in a collapsible content node and hence need to add the new node
    // to the "collapsible" parent node and then replace the old collapsible content node
    // but not if the node is locked
    else if (node.type.name === "collapsible" && !locked) {
      let collapsibleParentNode: Node = node; // Get the collapsible parent node
      let collapsibleTitleNode: Node = collapsibleParentNode.firstChild!; // Get the collapsible title node
      let collapsibleContentNode: Node = collapsibleParentNode.child(1)!; // Get the collapsible content node
      let newCollapsibleChildNodes: Node[] = Array<Node>();

      // Start position of the collapsible content node is the start of the collapsible node + its size
      let collapsibleParentPos = pos + collapsibleTitleNode.nodeSize;
      // Position offset from the start of the collapsible node to the clicked child of collapsible content node
      let innerOffsetToClicked = collapsibleTitleNode.nodeSize;

      // Go trough all the descendants of the collapsible content node
      collapsibleContentNode.descendants((node, pos) => {
        if (!highLevelCells.includes(node.type.name)) return false; // Makes sure we do not treat low level nodes such as paragraphs or text nodes, cause duplication would occur

        // If we are either in the clicked on markdown node or in a code_mirror or math_display node no further cases will apply
        // hence this node will not be re-assigned and we just re-use the original node
        let newChildNode: Node = node;
        let bIsClickedCollapsibleNode: boolean = isClickedNode(
          node,
          collapsibleParentPos + pos,
          clickedPos,
        );

        // If the child node is the clicked markdown_rendered node, replace it with a markdown node
        if (
          bIsClickedCollapsibleNode &&
          node.type.name === "markdown_rendered"
        ) {
          newChildNode = renderedToMarkdown(node, ProofFlowSchema);
        }
        // If it is not the clicked node and it is a markdown node, render it to markdown_rendered
        else if (
          !bIsClickedCollapsibleNode &&
          node.type.name === "markdown"
        ) {
          newChildNode = markdownToRendered(node, ProofFlowSchema);
        }

        if (bIsClickedCollapsibleNode) {
          // Get the correct offset to where the clicked node will be in the new doc
          // offset of 2 for the start of the collapsible node and the start of the collapsible content node
          offsetToClicked += innerOffsetToClicked + 2;
        }
        innerOffsetToClicked += newChildNode.nodeSize;

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
      newNode = newCollapsibleNode;
    } else if (node.type.name === "input") {
      let inputParentNode: Node = node;
      let inputContentNode: Node = inputParentNode.child(0)!;
      let newInputChildNodes: Node[] = Array<Node>();

      let inputParentPos = pos;

      let innerOffsetToClicked = 0;

      inputContentNode.descendants((node, pos) => {
        if (!highLevelCells.includes(node.type.name)) return false;

        let newChildNode: Node = node;
        let bIsClickedInputNode: boolean = isClickedNode(
          node,
          inputParentPos + pos,
          clickedPos,
        );

        if (bIsClickedInputNode && node.type.name === "markdown_rendered") {
          newChildNode = renderedToMarkdown(node, ProofFlowSchema);
        } else if (!bIsClickedInputNode && node.type.name === "markdown") {
          newChildNode = markdownToRendered(node, ProofFlowSchema);
        }

        if (bIsClickedInputNode) {
          offsetToClicked += innerOffsetToClicked + 2;
        }
        innerOffsetToClicked += newChildNode.nodeSize;

        newInputChildNodes.push(newChildNode);
      });

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
      
      newNode = newInputNode;
    } 

    if (bIsClickedNode) {
      if (node.type.name === "math_display") {  
        console.log("Adding 2 for clicked math")
        offsetToClicked += 1; // Offset of 2 to get into the math node
      }
      console.log(offsetToClicked + " + " + cursorOffset + " - " + clickedPos + " = " + (offsetToClicked + cursorOffset - clickedPos));
      //offsetToClicked += cursorOffset - clickedPos;
      offsetToClicked += 1;
      correctPos = offsetToClicked;
    }
    console.log(offsetToClicked + " + " + newNode.nodeSize + " = " + (offsetToClicked + newNode.nodeSize));
    offsetToClicked += newNode.nodeSize;
    newNodes.push(newNode); // Push the new node to the new nodes array
  });

  trans.replaceWith(0, view.state.doc.content.size, newNodes);

  // Set the cursor to the correct position
  const resolveAndSetSelection = (position: number) => {
    const resolvedPos = trans.doc.resolve(position);
    trans.setSelection(TextSelection.near(resolvedPos, -1));
  };

      // Allows to get into math nodes
      console.log("Node type: ", node.type.name, correctPos);
      if (node.type.name === "math_display") {
        resolveAndSetSelection(correctPos);
      } else {
        const newResolvedPos = trans.doc.resolve(correctPos);
        const newContainerName = newResolvedPos.node(newResolvedPos.depth - 1)
          .type.name;
        if (
          newContainerName !== "input_content" &&
          proofFlow.getUserMode() === UserMode.Student
        ) {
          // Prevents bug for escaping collapsible areas
          resolveAndSetSelection(pos);
        } else {
          resolveAndSetSelection(correctPos);
        }
      }

  view.dispatch(trans);

      // If we switch while inside of student Mode, we need to lock the editing of the new nodes
      if (locked) {
        lockEditing(true);
      }
    },
  },*/
});

