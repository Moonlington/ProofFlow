import { NodeType } from "prosemirror-model";
import {
  allowedToInsert,
  getContainingNode,
  InsertionFunction,
} from "./helpers";
import {
  Command,
  EditorState,
  NodeSelection,
  Transaction,
} from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { GetPos } from "../codemirror/types.ts";
import { CodeMirrorView } from "../codemirror";
import {
  collapsibleContentType,
  collapsibleNodeType,
  collapsibleTitleNodeType,
} from "../editor/nodetypes.ts";
import { ProofFlowSchema } from "../editor/proofflowschema.ts";

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
