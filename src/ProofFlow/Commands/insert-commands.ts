import { NodeType, Node as ProseMirrorNode } from "prosemirror-model";

import { allowedToInsert, InsertionFunction } from "./helpers";

import { Command, EditorState, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { GetPos } from "../CodeMirror/types.ts";
import { CodeMirrorView } from "../CodeMirror";

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

    return true;
  };
}