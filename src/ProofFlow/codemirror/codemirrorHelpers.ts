import { Command, EditorView as CMView, keymap } from "@codemirror/view";
import { ComputeChange } from "./types";
import { EditorView } from "prosemirror-view";
import { exitCode } from "prosemirror-commands";
import { ProofFlow } from "../editor/ProofFlow";
import { getContainingNode } from "../commands/helpers";
import { Node as ProsemirrorNode } from "prosemirror-model";
import { Selection, TextSelection } from "prosemirror-state";

// File to keep the helper functions for codemirror
// Allows to keep codemirrorviews to be modular and maintainabl

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
  if (oldVal === newVal) {
    return null;
  }

  let start = 0;
  let oldEnd = oldVal.length;
  let newEnd = newVal.length;

  while (
    start < oldEnd &&
    oldVal.charCodeAt(start) === newVal.charCodeAt(start)
  ) {
    start += 1;
  }

  while (
    oldEnd > start &&
    newEnd > start &&
    oldVal.charCodeAt(oldEnd - 1) === newVal.charCodeAt(newEnd - 1)
  ) {
    oldEnd -= 1;
    newEnd -= 1;
  }

  return { from: start, to: oldEnd, text: newVal.slice(start, newEnd) };
};

export function getTabKeyMap(cm: CMView) {
  return keymap.of([
    {
      key: "Tab",
      run: () => {
        const state = cm.state;
        cm.dispatch(state.update(state.replaceSelection("\t")));
        return true;
      },
      preventDefault: true,
    },
  ]);
}

export function getOtherKeyMaps(
  outerView: EditorView,
) {
  return keymap.of([
    {
      key: "ArrowUp",
      run: mayBeEscape("line", -1),
    },
    {
      key: "ArrowLeft",
      run: mayBeEscape("char", -1),
    },
    {
      key: "ArrowDown",
      run: mayBeEscape("line", 1),
    },
    {
      key: "ArrowRight",
      run: mayBeEscape("char", 1),
    },
    {
      key: "Ctrl-Enter",
      run: () => {
        if (exitCode(outerView.state, outerView.dispatch)) {
          outerView.focus();
          return true;
        }
        return false;
      },
    },
    {
      key: "Ctrl-Shift-m", // Stop linter from calling next diagnostics
      run: () => {
        return true;
      },
    },
  ]);
}

/**
 * Escape the codemirror editor and move the cursor to the ProseMirror editor
 * Will return false if the movement will not escape the current view
 */
export function mayBeEscape(
  unit: "char" | "line",
  dir: -1 | 1,
): Command {
  return (view) => {
    const { state } = view;
    const { selection } = state;

    const offsetToPos = () => {
      const offset = selection.main.from;
      const line = state.doc.lineAt(offset);
      return { line: line.number, ch: offset - line.from };
    };

    const pos = offsetToPos();
    const hasSelection = state.selection.ranges.some((r) => !r.empty);

    const firstLine = 1;
    const lastLine = state.doc.lineAt(state.doc.length).number;

    if (
      hasSelection ||
      pos.line !== (dir < 0 ? firstLine : lastLine) ||
      (unit === "char" &&
        pos.ch !== (dir < 0 ? 0 : state.doc.line(pos.line).length))
    ) {
      return false;
    }

    return true;
  };
}
