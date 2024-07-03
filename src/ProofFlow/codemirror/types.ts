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
 * Computes the change between two strings.
 *
 * @param oldVal - The old string value.
 * @param newVal - The new string value.
 *
 * @returns The computed change object or null if there is no change.
 */
export const computeChange = (
    oldVal: string,
    newVal: string,
): ComputeChange | null => {
  // If the old and new values are the same, return null
  if (oldVal === newVal) {
    return null;
  }

  // Find the start and end positions of the change
  let start = 0;
  let oldEnd = oldVal.length;
  let newEnd = newVal.length;

  // Find the start position of the change
  while (
      start < oldEnd &&
      oldVal.charCodeAt(start) === newVal.charCodeAt(start)
      ) {
    start += 1;
  }

  // Find the end position of the change
  while (
      oldEnd > start &&
      newEnd > start &&
      oldVal.charCodeAt(oldEnd - 1) === newVal.charCodeAt(newEnd - 1)
      ) {
    oldEnd -= 1;
    newEnd -= 1;
  }

  // Return the change object
  return { from: start, to: oldEnd, text: newVal.slice(start, newEnd) };
};



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
