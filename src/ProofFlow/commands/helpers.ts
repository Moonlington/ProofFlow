import { NodeType, Node } from "prosemirror-model";
import {
  EditorState,
  NodeSelection,
  TextSelection,
  Selection,
  Transaction,
} from "prosemirror-state";

export enum InsertionPlace {
  Above,
  Underneath,
}

export type InsertionFunction = (
  state: EditorState,
  trans: Transaction,
  ...nodeType: NodeType[]
) => Transaction;

export function selectionType(sel: Selection) {
  console.log(sel);
  return {
    isTextSelection: sel instanceof TextSelection,
    isNodeSelection: sel instanceof NodeSelection,
  };
}

export function insertAbove(
  state: EditorState,
  tr: Transaction,
  ...nodeType: NodeType[]
): Transaction {
  const sel = state.selection;
  const { isTextSelection, isNodeSelection } = selectionType(sel);
  let trans: Transaction = tr;

  if (isNodeSelection) {
    // To and from point directly to beginning and end of node.
    const pos = sel.from;
    let counter = pos;
    nodeType.forEach((type) => {
      trans = trans.insert(counter, type.create());
      counter++;
    });
  } else if (isTextSelection) {
    const textSel = sel as TextSelection;
    const from = sel.from - textSel.$from.parentOffset;
    let counter = from;
    nodeType.forEach((type) => {
      trans = trans.insert(counter, type.create());
      counter++;
    });
  }

  return trans;
}

export function insertUnder(
  state: EditorState,
  tr: Transaction,
  ...nodeType: NodeType[]
): Transaction {
  const sel = state.selection;
  const { isTextSelection, isNodeSelection } = selectionType(sel);

  let trans: Transaction = tr;

  if (isNodeSelection) {
    // To and from point directly to beginning and end of node.
    const pos = sel.to;
    let counter = pos;
    nodeType.forEach((type) => {
      trans = trans.insert(counter, type.create());
      counter++;
    });
  } else if (isTextSelection) {
    const textSel = sel as TextSelection;
    const to =
      sel.to + (sel.$from.parent.nodeSize - textSel.$from.parentOffset) - 1;

    if (to > state.doc.nodeSize) {
      console.log("This is no bueno");
      return trans;
    }
    let counter = to;
    nodeType.forEach((type) => {
      trans = trans.insert(counter, type.create());
      counter++;
    });
  }

  return trans;
}

export function getContainingNode(sel: Selection): Node | undefined {
  const { isTextSelection, isNodeSelection } = selectionType(sel);
  if (isTextSelection) {
    return sel.$from.node(sel.$from.depth - 1);
  } else if (isNodeSelection) {
    return sel.$from.parent;
  } else {
    return undefined;
  }
}

export function allowedToInsert(_state: EditorState): boolean {
  return true;
}
