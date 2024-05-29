/*---------------------------------------------------------
 *  Adapted from https://github.com/sibiraj-s/prosemirror-codemirror-6
 *--------------------------------------------------------*/

import type { EditorView } from "prosemirror-view";
import type { Node as ProsemirrorNode } from "prosemirror-model";
import type { Extension } from "@codemirror/state";

/**
 *  values used for calculating the change in the codemirror editor
 *  to the ProseMirror editor
 */
export interface ComputeChange {
  from: number;
  to: number;
  text: string;
}

/**
 * Interface for extension options passed to the CodeMirrorView
 */
interface CMOptions {
  extensions: Extension;
}

export type GetPos = () => number | undefined;

/**
 * Interface for the all the options passed to the CodeMirrorView
 */
export interface CodeMirrorViewOptions {
  node: ProsemirrorNode;
  view: EditorView;
  getPos: GetPos;
  cmOptions?: CMOptions;
}
