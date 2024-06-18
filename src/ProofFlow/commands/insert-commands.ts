import { NodeType, Node } from "prosemirror-model";
import {
  allowedToInsert,
  getContainingNode,
  getSelectionType,
  InsertionFunction,
} from "./helpers";
import {
  Command,
  EditorState,
  NodeSelection,
  TextSelection,
  Transaction,
} from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { ProofFlowSchema } from "../editor/proofflowschema";
import { getNextAreaId } from "../editor/ProofFlowDocument";
import CodeMirrorView from "../codemirror/codemirrorview";

/**
 * Returns a command function for inserting a node of type `mdNodeType`.
 * @param insertionFunction - The function responsible for inserting the node.
 * @param mdNodeType - The node type to be inserted.
 * @returns The command function.
 */
export function getMdInsertCommand(
  insertionFunction: InsertionFunction,
  mdNodeType: NodeType,
): Command {
  return (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
    _view?: EditorView,
  ): boolean => {
    if (!allowedToInsert(state)) return false;

    let trans: Transaction | undefined;
    trans = insertionFunction(state, state.tr, mdNodeType);
    if (dispatch && trans) dispatch(trans);
    return true;
  };
}

/**
 * Returns a command function for inserting a node of type `latexNodeType`.
 * @param insertionFunction - The function responsible for inserting the node.
 * @param latexNodeType - The node type to be inserted.
 * @returns The command function.
 */
export function getMathInsertCommand(
  insertionFunction: InsertionFunction,
  latexNodeType: NodeType,
): Command {
  return (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
    _view?: EditorView,
  ): boolean => {
    if (!allowedToInsert(state)) return false;

    let trans: Transaction | undefined;
    trans = insertionFunction(state, state.tr, latexNodeType);
    if (dispatch && trans) dispatch(trans);
    return true;
  };
}

/**
 * Returns a command function for inserting a node of type `codeblockNodeType`.
 * @param insertionFunction - The function responsible for inserting the node.
 * @param codeblockNodeType - The node type to be inserted.
 * @returns The command function.
 */
export function getCodeInsertCommand(
  insertionFunction: InsertionFunction,
  codeblockNodeType: NodeType,
): Command {
  return (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
    _view?: EditorView,
  ): boolean => {
    if (!allowedToInsert(state)) return false;

    let trans: Transaction | undefined;
    trans = insertionFunction(state, state.tr, codeblockNodeType);
    if (dispatch && trans) dispatch(trans);
    CodeMirrorView.resortInstances();
    return true;
  };
}

/**
 * Returns a command function that inserts a collapsible node at the current selection.
 * @returns A command function that takes EditorState, dispatch, and view as parameters and returns a boolean.
 */
export function getCollapsibleInsertCommand(): Command {
  return (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
    _view?: EditorView,
  ): boolean => {
    // Check if insertion is allowed
    if (!allowedToInsert(state)) return false;

    let selection = state.selection;
    let parent = getContainingNode(selection);

    // Check if parent node is valid
    if (parent == undefined || parent.type.name != "doc") return false;
    let oldNode = null;
    let selectionType = getSelectionType(selection);

    // Get the old node based on the selection type
    if (selectionType.isTextSelection) {
      oldNode = selection.$from.node();
    } else if (selectionType.isNodeSelection) {
      oldNode = (selection as NodeSelection).node;
    }

    // Check if old node exists and not already a wrapper node
    if (oldNode == null) return false;
    if (oldNode.type.name == "input" || oldNode.type.name == "collapsible")
      return false;

    // Create the title node for the collapsible node
    let textNode: Node = ProofFlowSchema.node("collapsible_title", null, [
      ProofFlowSchema.text("Collapsible: "),
    ]);
    // Create the content node for the collapsible node
    let contentNode: Node = ProofFlowSchema.node(
      "collapsible_content",
      { visible: true },
      [oldNode],
    );
    // Create the collapsible node
    let collapsibleNode: Node = ProofFlowSchema.node(
      "collapsible",
      { id: getNextAreaId() },
      [textNode, contentNode],
    );
    let trans: Transaction = state.tr;
    // Replace the selection with the collapsible node
    if (selectionType.isTextSelection) {
      let resolved = selection.$from;
      console.log(resolved.start(), resolved.end());
      trans.replaceWith(resolved.start() - 1, resolved.end(), collapsibleNode);
    } else if (selectionType.isNodeSelection) {
      trans.replaceSelectionWith(collapsibleNode);
    }
    // Dispatch the transaction if provided
    if (dispatch && trans) dispatch(trans);
    return true;
  };
}

/**
 * Returns a command function that inserts an input command at the current selection.
 * @returns A command function that inserts an input command.
 */
export function getInputInsertCommand(): Command {
  return (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
    _view?: EditorView,
  ): boolean => {
    // Check if insertion is allowed
    if (!allowedToInsert(state)) return false;

    let selection = state.selection;
    let parent = getContainingNode(selection);

    // Check if parent node is valid
    if (parent == undefined || parent.type.name != "doc") return false;

    let oldNode = null;
    let selectionType = getSelectionType(selection);

    // Get the old node based on the selection type
    if (selectionType.isTextSelection) {
      oldNode = selection.$from.node();
    } else if (selectionType.isNodeSelection) {
      oldNode = (selection as NodeSelection).node;
    }

    // Check if old node exists and not already a wrapper node
    if (oldNode == null) return false;
    if (oldNode.type.name == "input" || oldNode.type.name == "collapsible")
      return false;

    // TODO Check for neighbouring input nodes
    let posStart;
    let posEnd;
    if (selectionType.isNodeSelection) {
      posStart = selection.from; // Get the position of the selection
      posEnd = selection.to;
    } else { // text selection
      posStart = selection.$from.depth ? selection.$from.before(selection.$from.depth) : 0; // Get the position of the parent node or 0 if it doesn't exist
      const textSel = selection as TextSelection;
      posEnd = selection.to + (selection.$from.parent.nodeSize - textSel.$from.parentOffset) - 1;
    }

    const doc = state.doc;
    console.log("doc: ", doc)
    const nodeBefore = doc.resolve(posStart).nodeBefore;
    const nodeAfter = doc.resolve(posEnd).nodeAfter;
    let oldNodes = [];
    if (nodeBefore && nodeBefore.type.name == "input" && nodeAfter && nodeAfter.type.name == "input") {
      // Node before and after are input nodes, merge them and add current node to the merged node
      nodeBefore.firstChild!.content.forEach((node) => {
        oldNodes.push(node);
      });
      oldNodes.push(oldNode);
      nodeAfter.firstChild!.content.forEach((node) => {
        oldNodes.push(node);
      });
      posStart = posStart - nodeBefore.nodeSize;
      posEnd = posEnd + nodeAfter.nodeSize;
    } else if (nodeAfter && nodeAfter.type.name == "input") {
      // Node after is an input node, add current node to that input node
      console.log("After");
      oldNodes.push(oldNode);
      nodeAfter.firstChild!.content.forEach((node) => {
        oldNodes.push(node);
      });
      posEnd = posEnd + nodeAfter.nodeSize;
    } else if (nodeBefore && nodeBefore.type.name == "input") {
      // Node before is an input node, add current node to that input node
      console.log("Before");
      nodeBefore.firstChild!.content.forEach((node) => {
        oldNodes.push(node);
      });
      console.log("nodeBefore: ", nodeBefore);
      console.log("nodeBefore.nodeSize: ", nodeBefore.nodeSize);
      console.log("oldNode: ", oldNode);
      console.log("oldNode.nodeSize: ", oldNode.nodeSize);
      console.log("start and end pos of old node: ", posStart, posEnd);
      oldNodes.push(oldNode);
      posStart = posStart - nodeBefore.nodeSize;
    } else {
      // No neighbouring input nodes, create a new input node
      console.log("No neighbours");
      oldNodes.push(oldNode);
    }

    let contentNode: Node = ProofFlowSchema.node(
      "input_content",
      { visible: true },
      oldNodes,
    );
    let inputNode: Node = ProofFlowSchema.node(
      "input",
      { id: getNextAreaId() },
      [contentNode],
    );
    let trans: Transaction = state.tr;

    console.log("newNode: ", inputNode);

    trans.replaceWith(posStart, posEnd, inputNode);

    // Dispatch the transaction if provided
    if (dispatch && trans) dispatch(trans);
    return true;
  };
}
