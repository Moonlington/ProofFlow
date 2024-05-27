import { NodeType } from "prosemirror-model";
import { allowedToInsert, InsertionFunction } from "./helpers";
import { Command, EditorState, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { GetPos } from "../codemirror/types.ts";
import { CodeMirrorView } from "../codemirror";
import { collapsibleContentType, collapsibleNodeType, collapsibleTitleNodeType } from "../nodetypes.ts";
import { ProofFlowSchema } from "../proofflowschema.ts";

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
    view?: EditorView,
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
    view?: EditorView,
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
    view?: EditorView,
  ): boolean => {
    if (!allowedToInsert(state)) return false;
    let trans: Transaction | undefined;
    trans = insertionFunction(state, state.tr, codeblockNodeType);
    if (dispatch && trans) dispatch(trans);

    return true;
  };
}

export function getCollapsibleInsertCommand(): Command {
  return (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
    view?: EditorView,
  ): boolean => {
    if (!allowedToInsert(state)) return false;
    let selection = state.selection;
    let parent = getContainingNode(selection);
    if (parent == undefined || parent.type.name != "doc") return false;
    let oldNode = null;
    let selectionType = getSelectionType(selection);
    if (selectionType.isTextSelection) {
      oldNode = selection.$from.node();
    } else if (selectionType.isNodeSelection) {
      oldNode = (selection as NodeSelection).node;
    }
    if (oldNode == null) return false;

    let textNode: Node = collapsibleTitleNodeType.create(null, [
      ProofFlowSchema.text("Collapsible: "),
    ]);
    let contentNode: Node = collapsibleContentType.create(
      { visible: true },
      [oldNode],
    )
    let collapsibleNode: Node = collapsibleNodeType.create({}, [textNode, contentNode]);
    let trans: Transaction = state.tr;
    if (selectionType.isTextSelection) {
      let resolved = selection.$from;
      console.log(resolved.start(), resolved.end());
      trans.replaceWith(resolved.start() - 1, resolved.end(), collapsibleNode);
    } else if (selectionType.isNodeSelection) {
      trans.replaceSelectionWith(collapsibleNode);
    }
    if (dispatch && trans) dispatch(trans);
    return true;
  };
}

