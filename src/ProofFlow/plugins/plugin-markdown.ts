import { Plugin } from "prosemirror-state";
import { Node } from "prosemirror-model";
import { TextSelection } from "prosemirror-state";

import {
  isClickedNode,
  renderedToMarkdown,
  markdownToRendered,
  highLevelCells,
  getContainingNode,
} from "../commands/helpers.ts";
import { ProofFlowSchema } from "../editor/proofflowschema.ts";
import { proofFlow } from "../../main.ts";
import { UserMode, lockEditing } from "../UserMode/userMode.ts";

export const markdownPlugin = new Plugin({
  props: {
    handleClickOn(view, pos, node, nodePos, event, direct) {
      if (node.type.name === undefined || !direct) return; // If the node being clicked is not a valid node or the click is not a user action, return

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
              offsetToClicked += innerOffsetToClicked + 1;
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
            { id: node.attrs.id },
            newInputContentNode,
          );

          newNode = newInputNode;
        }

        if (bIsClickedNode) {
          offsetToClicked += cursorOffset - clickedPos;
          correctPos = offsetToClicked;
        }

        offsetToClicked += newNode.nodeSize;
        newNodes.push(newNode); // Push the new node to the new nodes array
      });

      trans.replaceWith(0, view.state.doc.content.size, newNodes);
      trans.setSelection(TextSelection.near(trans.doc.resolve(correctPos), -1));
      view.dispatch(trans);

      // If we switch while inside of student Mode, we need to lock the editing of the new nodes
      if (locked) {
        lockEditing(true);
      }
    },
  },
});
