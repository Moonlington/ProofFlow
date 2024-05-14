import { NodeType, Node } from "prosemirror-model";
import {
  EditorState,
  NodeSelection,
  TextSelection,
  Selection,
  Transaction,
} from "prosemirror-state";

/**
 * Represents the possible places where an insertion can occur.
 */
export enum InsertionPlace {
  Above,
  Underneath,
}

/**
 * Represents a function that performs an insertion operation in the editor.
 * @param state - The current editor state.
 * @param trans - The transaction object used to perform the insertion.
 * @param nodeType - The node type(s) to be inserted.
 * @returns The updated transaction object after the insertion.
 */
export type InsertionFunction = (
  state: EditorState,
  trans: Transaction,
  ...nodeType: NodeType[]
) => Transaction;

/**
 * Determines the type of the given selection.
 * @param sel - The selection to determine the type of.
 * @returns An object with properties indicating the type of the selection.
 */
export function selectionType(sel: Selection) {
  console.log(sel);
  return {
    isTextSelection: sel instanceof TextSelection,
    isNodeSelection: sel instanceof NodeSelection,
  };
}

/**
 * Inserts nodes of specified types above the current selection in the editor state.
 * 
 * @param state - The current editor state.
 * @param tr - The transaction to apply the changes to.
 * @param nodeType - The types of nodes to insert.
 * @returns The updated transaction.
 */
export function insertAbove(
  state: EditorState,
  tr: Transaction,
  ...nodeType: NodeType[]
): Transaction {
  // Determine the type of the selection and the insertion point
  const sel = state.selection;
  const { isTextSelection, isNodeSelection } = selectionType(sel);

  // Initialize the transaction object
  let trans: Transaction = tr;

  if (isNodeSelection) {
    // To and from point directly to beginning and end of node.
    const pos = sel.from;
    let counter = pos;

    // Insert the specified node types above the current selection
    nodeType.forEach((type) => {
      trans = trans.insert(counter, type.create());
      counter++;
    });
  } else if (isTextSelection) {
    // To and from point directly to beginning and end of node.
    const textSel = sel as TextSelection;
    const from = textSel.from - 1;
    let counter = from;

    // Insert the specified node types above the current selection
    nodeType.forEach((type) => {
      trans = trans.insert(counter, type.create());
      counter++;
    });
  } else {
    // If the selection is invalid, add a node at the end of the document
    const pos = state.doc.content.size;
    let counter = pos;

    nodeType.forEach((type) => {
      trans = trans.insert(counter, type.create());
      counter++;
    });
  }

  return trans;
}

/**
 * Inserts nodes under the current selection in the editor state.
 * 
 * @param state - The current editor state.
 * @param tr - The transaction to apply the changes to.
 * @param nodeType - The node types to insert.
 * @returns The updated transaction.
 */
export function insertUnder(
  state: EditorState,
  tr: Transaction,
  ...nodeType: NodeType[]
): Transaction {
  // Determine the type of the selection and the insertion point
  const sel = state.selection;
  const { isTextSelection, isNodeSelection } = selectionType(sel);

  // Initialize the transaction object
  let trans: Transaction = tr;

  if (isNodeSelection) {
    // To and from point directly to beginning and end of node.
    const pos = sel.to;
    let counter = pos;

    // Insert the specified node types under the current selection
    nodeType.forEach((type) => {
      trans = trans.insert(counter, type.create());
      counter++;
    });
  } else if (isTextSelection) {
    // To and from point directly to beginning and end of node.
    const textSel = sel as TextSelection;
    const to =
      sel.to + (sel.$from.parent.nodeSize - textSel.$from.parentOffset) - 1;
    // Check if the to point is valid
    if (to > state.doc.nodeSize) {
      console.log("This is no bueno");
      return trans;
    }
    let counter = to;

    // Insert the specified node types under the current selection
    nodeType.forEach((type) => {
      trans = trans.insert(counter, type.create());
      counter++;
    });
  } else {
      // If the selection is invalid, add a node at the end of the document
      const pos = state.doc.content.size;
      let counter = pos;
  
      nodeType.forEach((type) => {
        trans = trans.insert(counter, type.create());
        counter++;
      });
  }

  return trans;
}

/**
 * Retrieves the containing node of the given selection.
 * 
 * @param sel - The selection object.
 * @returns The containing node of the selection, or undefined if the selection is not valid.
 */
export function getContainingNode(sel: Selection): Node | undefined {
  // Determine the type of the selection
  const { isTextSelection, isNodeSelection } = selectionType(sel);

  // If the selection is a text or node selection, return the parent node of the selection
  // Otherwise, return undefined
  if (isTextSelection) {
    return sel.$from.node(sel.$from.depth - 1);
  } else if (isNodeSelection) {
    return sel.$from.parent;
  } else {
    return undefined;
  }
}

/**
 * Checks if the current state allows for insertion.
 * @param state The editor state.
 * @returns A boolean indicating whether insertion is allowed.
 */
export function allowedToInsert(state: EditorState): boolean {
  return true;
}
