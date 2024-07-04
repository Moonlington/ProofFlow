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
  Selection,
} from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { ProofFlowSchema } from "../editor/Schema/proofFlowSchema.ts";
import { getNextAreaId } from "../editor/ProofFlowArea.ts";
import { ProofFlow } from "../editor/ProofFlow.ts";

/**
 * Returns a command function for inserting a node of the specified type.
 * @param insertionFunction - The function responsible for inserting the node.
 * @param nodeType - The node type to be inserted.
 * @returns The command function.
 */
function getInsertCommand(
  proofFlow: ProofFlow,
  insertionFunction: InsertionFunction,
  nodeType: NodeType,
): Command {
  return (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
    _view?: EditorView,
  ): boolean => {
    if (!allowedToInsert(proofFlow)) return false;

    const trans = insertionFunction(state, state.tr, nodeType);
    if (dispatch && trans) dispatch(trans);
    return true;
  };
}

export const getMdInsertCommand = (
  proofFlow: ProofFlow,
  insertionFunction: InsertionFunction,
  nodeType: NodeType,
) => getInsertCommand(proofFlow, insertionFunction, nodeType);

export const getMathInsertCommand = (
  proofFlow: ProofFlow,
  insertionFunction: InsertionFunction,
  nodeType: NodeType,
) => getInsertCommand(proofFlow, insertionFunction, nodeType);

export const getCodeInsertCommand = (
  proofFlow: ProofFlow,
  insertionFunction: InsertionFunction,
  nodeType: NodeType,
) => getInsertCommand(proofFlow, insertionFunction, nodeType);

/**
 * Combines some common operations for inserting wrapper nodes.
 *
 * @param state - The editor state to be wrapped.
 * @returns An array containing the result of the wrapping operation.
 *          The first element indicates whether the wrapping was successful.
 *          The second element is the old node.
 *          The third element is the selection.
 *          The fourth element is the selection type.
 */
function wrapperCombined(proofFlow: ProofFlow): [boolean, Node?, any?, any?] {
  if (!allowedToInsert(proofFlow)) return [false];

  const selection = proofFlow.getEditorView().state.selection;
  const parent = getContainingNode(selection);
  if (parent == undefined || parent.type.name != "doc") return [false];

  const selectionType = getSelectionType(selection);
  const oldNode = selectionType.isTextSelection
    ? selection.$from.node()
    : (selection as NodeSelection).node;

  if (oldNode == null || ["input", "collapsible"].includes(oldNode.type.name))
    return [false];

  return [true, oldNode, selection, selectionType];
}

/**
 * Returns a command function that inserts a collapsible node at the current selection.
 * @returns A command function that takes EditorState, dispatch, and view as parameters and returns a boolean.
 */
export function getCollapsibleInsertCommand(proofFlow: ProofFlow): Command {
  return (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
    _view?: EditorView,
  ): boolean => {
    const [allowedToGo, oldNode, selection, selectionType] =
      wrapperCombined(proofFlow);
    if (!allowedToGo || !oldNode || !selection || !selectionType) return false;

    const textNode: Node = ProofFlowSchema.node("collapsible_title", null, [
      ProofFlowSchema.text("Collapsible: "),
    ]);
    const contentNode: Node = ProofFlowSchema.node(
      "collapsible_content",
      { visible: true },
      [oldNode],
    );
    const collapsibleNode: Node = ProofFlowSchema.node(
      "collapsible",
      { id: getNextAreaId() },
      [textNode, contentNode],
    );

    let { posStart, posEnd } = getSelectionPositions(selection);

    // Replace the old node with the new collapsible node
    dispatchNode(posStart, posEnd, collapsibleNode, state, dispatch);

    return true;
  };
}

/**
 * Returns a command function that inserts an input command at the current selection.
 *
 * @returns A command function that inserts an input command.
 */
export function getInputInsertCommand(proofFlow: ProofFlow): Command {
  return (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
    _view?: EditorView,
  ): boolean => {
    const [allowedToGo, oldNode, selection, selectionType] =
      wrapperCombined(proofFlow);
    if (!allowedToGo || !oldNode || !selection || !selectionType) return false;

    let { posStart, posEnd } = getSelectionPositions(selection);

    const doc = state.doc;
    let oldNodes = [];

    const nodeBefore = doc.resolve(posStart).nodeBefore;
    const nodeAfter = doc.resolve(posEnd).nodeAfter;

    if (nodeBefore && nodeBefore.type.name == "input") {
      nodeBefore.firstChild!.content.forEach((node) => oldNodes.push(node));
      posStart -= nodeBefore.nodeSize;
    }

    oldNodes.push(oldNode);

    if (nodeAfter && nodeAfter.type.name == "input") {
      nodeAfter.firstChild!.content.forEach((node) => oldNodes.push(node));
      posEnd += nodeAfter.nodeSize;
    }

    const contentNode: Node = ProofFlowSchema.node(
      "input_content",
      { visible: true },
      oldNodes,
    );
    const inputNode: Node = ProofFlowSchema.node(
      "input",
      { id: getNextAreaId() },
      [contentNode],
    );

    // Replace the old nodes with the new input node
    dispatchNode(posStart, posEnd, inputNode, state, dispatch);

    return true;
  };
}

/**
 * Replaces a range of nodes in the editor state with a new node and dispatches the transaction.
 *
 * @param postStart - The position to start replacing the nodes.
 * @param posEnd - The position to end replacing the nodes.
 * @param newNode - The new node to replace the existing nodes.
 * @param state - The current editor state.
 * @param dispatch - An optional function to dispatch the transaction.
 */
function dispatchNode(
  postStart: number,
  posEnd: number,
  newNode: Node,
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
) {
  const trans: Transaction = state.tr.replaceWith(postStart, posEnd, newNode);
  if (dispatch && trans) dispatch(trans);
}

/**
 * Helper function to get the start and end positions of the selection.
 * @param selection - The current selection.
 *
 * @returns The start and end positions.
 */
function getSelectionPositions(selection: Selection) {
  let posStart: number, posEnd: number;
  const selectionType = getSelectionType(selection);

  if (selectionType.isNodeSelection) {
    posStart = selection.from; // Get the position of the selection
    posEnd = selection.to;
  } else {
    // text selection
    posStart = selection.$from.depth
      ? selection.$from.before(selection.$from.depth)
      : 0;
    const textSel = selection as TextSelection;
    posEnd =
      selection.to +
      (selection.$from.parent.nodeSize - textSel.$from.parentOffset) -
      1;
  }

  return { posStart, posEnd };
}
