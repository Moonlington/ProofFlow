import { NodeType, Node, Schema } from "prosemirror-model";
import {
  EditorState,
  NodeSelection,
  TextSelection,
  Selection,
  Transaction,
} from "prosemirror-state";
import { closeHistory } from "prosemirror-history";
import { defaultMarkdownParser } from "prosemirror-markdown";
import { proofFlow } from "../../main";
import { UserMode } from "../UserMode/userMode";
import { ProofStatus } from "../editor/proofFlowSchema";
import { getNextAreaId } from "../editor/ProofFlowDocument";
//import { mathSerializer } from "@benrbray/prosemirror-math";
import { vscode } from "../extension/vscode";
/**
 * Represents the possible places where an insertion can occur.
 */
export enum InsertionPlace {
  Above, // Insert above the current selection
  Underneath, // Insert underneath the current selection
}

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

    nodeType.forEach((type) => {
      trans = trans.insert(counter, type.create({ id: getNextAreaId() }));
      counter++;
    });
  } else if (isTextSelection) {
    // If the selection is a text selection, insert above the parent node
    const parentPos = sel.$from.depth ? sel.$from.before(sel.$from.depth) : 0; // Get the position of the parent node or 0 if it doesn't exist
    let counter = parentPos;

    nodeType.forEach((type) => {
      trans = trans.insert(counter, type.create({ id: getNextAreaId() }));
      counter++;
    });
  } else {
    // If the selection is invalid, add a node at the end of the document
    const pos = state.doc.content.size;
    let counter = pos;

    nodeType.forEach((type) => {
      trans = trans.insert(counter, type.create({ id: getNextAreaId() }));
      counter++;
    });
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

    nodeType.forEach((type) => {
      trans = trans.insert(counter, type.create({ id: getNextAreaId() }));
      counter++;
    });
  } else if (isTextSelection) {
    // If the selection is a text selection, insert the specified node types under the current selection
    const textSel = sel as TextSelection;
    const to =
      sel.to + (sel.$from.parent.nodeSize - textSel.$from.parentOffset) - 1;
    // Check if the to point is valid
    if (to > state.doc.nodeSize) {
      console.log("Invalid insertion point");
      return trans;
    }
    let counter = to;

    nodeType.forEach((type) => {
      trans = trans.insert(counter, type.create({ id: getNextAreaId() }));
      counter++;
    });
  } else {
    // If the selection is invalid, add a node at the end of the document
    const pos = state.doc.content.size;
    let counter = pos;
    nodeType.forEach((type) => {
      trans = trans.insert(counter, type.create({ id: getNextAreaId() }));
      counter++;
    });
  }

  // Close the history event to prevent further steps from being appended to it
  trans = closeHistory(trans);

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
export function allowedToInsert(state: EditorState): boolean {
  let selection = state.selection;
  let selectionType = getSelectionType(selection);
  console.log(selection);
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

export function isClickedNode(node: Node, nodePos: number, clickedPos: number) {
  return nodePos <= clickedPos && clickedPos <= nodePos + node.nodeSize - 1;
}

/**
 * Turns a markdown node into a rendered markdown node.
 * @param node The node to transform.
 * @param schema The schema that the node belongs to.
 * @returns The transformed node.
 */
export function markdownToRendered(node: Node, schema: Schema) {
  const parsedContent = defaultMarkdownParser.parse(node.textContent);
  const mathInlineBlockNodeType = schema.nodes["math_inline_block"];
  const mathInlineNodeType = schema.nodes["math_inline"];
  const markdownRenderedNodeType = schema.nodes["markdown_rendered"];
  const markdownRenderedChildNodeType = schema.nodes["markdown_rendered_child"];

  let renderedNode: Node = node; // Default to the original node if parsing fails
  let parsedParts: Node[] = Array<Node>();

  const regex = /\$(.*?)\$/g; // The regex string for getting the math content
  const result = node.textContent.split(regex);
  for (let i = 0; i < result.length; i++) {
    // Since the regex is capturing the math content, the odd indexes will contain the math content
    if (i % 2 == 1) {
      // Make a math_inline node with the math content
      let mathNode = mathInlineNodeType.create(null, schema.text(result[i]));
      let wrappedMathNode = mathInlineBlockNodeType.create(null, mathNode);
      parsedParts.push(wrappedMathNode);
    } else {
      // Make a markdown child node with the text content
      if (result[i] == "") continue; // If the content is empty, skip it (the last element of result[] is always empty)
      let parsedChildContent = defaultMarkdownParser.parse(result[i]);
      if (parsedChildContent)
        parsedParts.push(
          markdownRenderedChildNodeType.create(
            null,
            parsedChildContent.content,
          ),
        );
    }
  }

  if (parsedContent) {
    renderedNode = markdownRenderedNodeType.create(
      { id: node.attrs.id, original_text: node.textContent },
      // If the content was splittable into parts, used the parsed parts, otherwise use the original content
      parsedParts.length != 0 ? parsedParts : parsedContent.content,
    );
  }

  return renderedNode;
}

/**
 * Turns a rendered markdown node into a markdown (plain text) node.
 * @param node The node to transform.
 * @param schema The schema that the node belongs to.
 * @returns The transformed node.
 */
export function renderedToMarkdown(node: Node, schema: Schema) {
  // const serializedContent = defaultMarkdownSerializer.serialize(node);

  // Create a new markdown node with the serialized content (a.k.a the raw text)
  // Make sure the text is not empty, since creating an empty text cell is not allowed

  let text =
    node.attrs.original_text == ""
      ? undefined
      : schema.text(node.attrs.original_text);
  let markdownNode: Node = schema.node("markdown", { id: node.attrs.id }, text);

  return markdownNode;
}

export function inputProof(
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
 * Function to check if the current environment is a VSCode extension.
 * @returns A boolean indicating whether the current environment is a VSCode extension.
 */
export function isVSCodeEnvironment(): boolean {
  return vscode.isVSCodeEnvironment();
}
