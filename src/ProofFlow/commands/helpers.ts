import { NodeType, Node } from "prosemirror-model";
import {
  EditorState,
  NodeSelection,
  TextSelection,
  Selection,
  Transaction,
} from "prosemirror-state";
import { closeHistory } from "prosemirror-history";
import { UserMode } from "../UserMode/userMode";
import { ProofStatus } from "../editor/Schema/proofFlowSchema.ts";
import { getNextAreaId } from "../editor/ProofFlowArea.ts";
import { ProofFlow } from "../editor/ProofFlow.ts";
//import { mathSerializer } from "@benrbray/prosemirror-math";

/**
 * Represents the possible places where an insertion can occur.
 */
export enum InsertionPlace {
  Above, // Insert above the current selection
  Underneath, // Insert underneath the current selection
}

/**
 * Array of high-level cells.
 * These cells represent different types of content in ProofFlow.
 */
export const highLevelCells: string[] = new Array(
  "code_mirror",
  "math_display",
  "markdown",
  "markdown_rendered",
  "collapsible",
  "input",
);

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
export function getSelectionType(sel: Selection) {
  return {
    isTextSelection: sel instanceof TextSelection, // True if the selection is a text selection
    isNodeSelection: sel instanceof NodeSelection, // True if the selection is a node selection
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
  const sel = state.selection;
  const { isTextSelection, isNodeSelection } = getSelectionType(sel);

  let trans: Transaction = tr;

  if (isNodeSelection) {
    // If the selection is a node selection, insert above that node
    const pos = sel.from; // Get the position of the selection
    let counter = pos;

    trans = insertionTrans(trans, nodeType, counter);
  } else if (isTextSelection) {
    // If the selection is a text selection, insert above the parent node
    const parentPos = sel.$from.depth ? sel.$from.before(sel.$from.depth) : 0; // Get the position of the parent node or 0 if it doesn't exist
    let counter = parentPos;

    trans = insertionTrans(trans, nodeType, counter);
  } else {
    trans = invalidSelectionTrans(state, trans, nodeType);
  }

  // Close the history event to prevent further steps from being appended to it
  trans = closeHistory(trans);

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
  const { isTextSelection, isNodeSelection } = getSelectionType(sel);

  // Initialize the transaction object
  let trans: Transaction = tr;

  if (isNodeSelection) {
    // If the selection is a node selection, insert the specified node types under the current selection
    const pos = sel.to;
    let counter = pos;

    trans = insertionTrans(trans, nodeType, counter);
  } else if (isTextSelection) {
    // If the selection is a text selection, insert the specified node types under the current selection
    const textSel = sel as TextSelection;
    const to = textSel.$from.end();

    // Check if the to point is valid
    if (to > state.doc.nodeSize) {
      console.log("Invalid insertion point");
      return trans;
    }
    let counter = to;

    trans = insertionTrans(trans, nodeType, counter);
  } else {
    trans = invalidSelectionTrans(state, trans, nodeType);
  }

  // Close the history event to prevent further steps from being appended to it
  trans = closeHistory(trans);

  return trans;
}

/**
 * Inserts nodes of specified types into a transaction at a given position.
 *
 * @param trans - The transaction to insert nodes into.
 * @param nodeType - An array of node types to insert.
 * @param counter - The starting position for insertion.
 * @returns The updated transaction after insertion.
 */
function insertionTrans(
  trans: Transaction,
  nodeType: NodeType[],
  counter: number,
): Transaction {
  nodeType.forEach((type) => {
    trans = trans.insert(counter, type.create({ id: getNextAreaId() }));
    counter++;
  });
  return trans;
}

/**
 * Adds a node at the end of the document if the selection is invalid.
 * 
 * @param state - The current editor state.
 * @param trans - The transaction to modify.
 * @param nodeType - An array of node types.
 * @returns The modified transaction.
 */
function invalidSelectionTrans(state: EditorState, trans: Transaction, nodeType: NodeType[]): Transaction {
    // If the selection is invalid, add a node at the end of the document
    const pos = state.doc.content.size;
    let counter = pos;

    trans = insertionTrans(trans, nodeType, counter);

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
  const { isTextSelection, isNodeSelection } = getSelectionType(sel);

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
export function allowedToInsert(proofFlow: ProofFlow): boolean {
  let selection = proofFlow.getEditorView().state.selection;
  let selectionType = getSelectionType(selection);
  let parent = getContainingNode(selection);
  let parentType = parent?.type.name;
  if (
    proofFlow.getUserMode() === UserMode.Student &&
    !(parentType == "input_content")
  )
    return false;
  if (selectionType.isTextSelection) {
    let node = selection.$from.node();
    if (node == null) return true;
    if (node.type.name == "collapsible_title") return false;
  } else if (selectionType.isNodeSelection) {
    let node = (selection as NodeSelection).node;
    if (node.type.name == "collapsible_content") return false;
    if (node.type.name == "collapsible_title") return false;
    if (node.type.name == "input_content") return false;
  }
  return true;
}

/**
 * Checks if a position is within the range of a node.
 * @param node - The node to check.
 * @param nodePos - The starting position of the node.
 * @param clickedPos - The position to check.
 * @returns True if the position is within the range of the node, false otherwise.
 */
export function isClickedNode(node: Node, nodePos: number, clickedPos: number) {
  return nodePos <= clickedPos && clickedPos <= nodePos + node.nodeSize - 1;
}

/**
 * Updates the proof status of an input node in the editor.
 *
 * @param inputNode - The input node to update.
 * @param newProof - The new proof status to set.
 * @param pos - The position of the input node in the document.
 */
export function inputProof(
  proofFlow: ProofFlow,
  inputNode: Node,
  newProof: ProofStatus,
  pos: number,
) {
  if (inputNode.type.name !== "input") return;
  let view = proofFlow.getEditorView();
  const { state, dispatch } = view;

  // Create a transaction to update the node's attributes
  const transaction = state.tr.setNodeMarkup(pos, null, {
    ...inputNode.attrs,
    proof: newProof,
  });
  transaction.setMeta("addToHistory", false);

  dispatch(transaction);
}

let visibleLine = true;
let indexLine = -1;

/**
 * Toggles the visibility of line numbers in the editor.
 */
export function toggleLineNumbers() {
  let sheet = (document.getElementById("dynamic-styles") as HTMLStyleElement)
    .sheet;
  if (sheet == null) return;
  if (indexLine != -1) {
    sheet.deleteRule(indexLine);
  }

  if (visibleLine) {
    indexLine = sheet.insertRule(".cm-gutters { display: none !important; }");
  } else {
    indexLine = -1;
  }
  visibleLine = !visibleLine;
}

/**
 * Requests a confirmation from the user.
 *
 * @param question - The question to ask the user.
 * @returns A promise that resolves to a boolean indicating whether the user confirmed the action.
 */
export function requestConfirm(question: string): Promise<boolean> {
  return new Promise((resolve, _) => {
    // Button container showing below settings buttons, overlay over the editor
    // When clicking outside or on no, do not reset, if clicking on yes, reset
    const overlay = document.createElement("div");
    overlay.className = "overlay";

    const container = document.createElement("div");
    container.className = "reset-confirm-container";
    const message = document.createElement("p");
    message.textContent = question;
    container.appendChild(message);
    const buttons = document.createElement("div");
    buttons.className = "reset-confirm-buttons";
    const yes = document.createElement("button");
    yes.textContent = "Yes";
    yes.onclick = () => {
      overlay.remove();
      resolve(true);
    };
    const no = document.createElement("button");
    no.textContent = "No";
    no.onclick = () => {
      overlay.remove();
      resolve(false);
    };
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        overlay.remove();
        resolve(false);
      }
    };
    buttons.appendChild(yes);
    buttons.appendChild(no);
    container.appendChild(buttons);
    overlay.appendChild(container);
    document.getElementById("container")!.appendChild(overlay);
  });
}
