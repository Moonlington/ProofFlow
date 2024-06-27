/*---------------------------------------------------------
 *  Adapted from https://github.com/sibiraj-s/prosemirror-codemirror-6
 *--------------------------------------------------------*/

import { Selection, TextSelection } from "prosemirror-state";
import type { EditorView, NodeView } from "prosemirror-view";
import { Node as ProsemirrorNode } from "prosemirror-model";
import { exitCode } from "prosemirror-commands";
import {
  EditorState as CMState,
  Transaction as CMTransaction,
} from "@codemirror/state";
import { Command, EditorView as CMView, keymap } from "@codemirror/view";
import type { ComputeChange, CodeMirrorViewOptions } from "./types.ts";
import { proofFlow } from "../../main.ts";
import { UserMode } from "../UserMode/userMode.ts";
import { getContainingNode } from "../commands/helpers.ts";
import { Diagnostic, setDiagnostics } from "@codemirror/lint";
import { LSPDiagnostic } from "../lspClient/models.ts";
import { ProofFlow } from "../editor/ProofFlow.ts";
import { wordHover } from "./extensions/hovertooltip.ts";

type Severity = "hint" | "info" | "warning" | "error";

const computeChange = (
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

/**
 * A node view for codemirror nodes, used for implementing the codemirror editor
 */
export class CodeMirrorView implements NodeView {
  node: ProsemirrorNode;
  _outerView: EditorView;
  _innerView: EditorView | undefined;
  dom: HTMLElement;
  cm: CMView;
  getPos: () => number;
  updating = false;
  diagnostics: Diagnostic[] = new Array();
  isQEDError = false;
  isError = false;
  proofflow: ProofFlow;

  static instances: CodeMirrorView[] = [];
  static focused: CodeMirrorView | null = null;

  /**
   * Constructs a new instance of the CodeMirrorView class.
   * @param proofflow The ProofFlow instance.
   * @param options The options for configuring the CodeMirrorView.
   */
  constructor(proofflow: ProofFlow, options: CodeMirrorViewOptions) {
    this.proofflow = proofflow;
    // Store for later
    this.node = options.node;
    this._outerView = options.view;
    const cmExtensions = options.cmOptions?.extensions || [];

    this.getPos = options.getPos as () => number;

    const changeFilter = CMState.changeFilter.of((tr) => {
      if (!tr.docChanged && !this.updating) {
        this.forwardSelection();
      }
      return true;
    });

    // Create a codemirror instance
    this.cm = new CMView({
      dispatch: this.dispatch.bind(this),
    });

    // The editor's outer node is our DOM representation
    this.dom = this.cm.dom;

    this.dom.style.backgroundColor = "#00000002";

    // Keymaps for the codemirror editor
    const tabKeymap = keymap.of([
      {
        key: "Tab",
        run: () => {
          const state = this.cm.state;
          this.cm.dispatch(state.update(state.replaceSelection("\t")));
          return true;
        },
        preventDefault: true,
      },
    ]);

    const cmState = CMState.create({
      doc: this.node.textContent,

      // Defining keymaps for codemirror
      extensions: [
        changeFilter,
        keymap.of([
          {
            key: "ArrowUp",
            run: this.mayBeEscape("line", -1),
          },
          {
            key: "ArrowLeft",
            run: this.mayBeEscape("char", -1),
          },
          {
            key: "ArrowDown",
            run: this.mayBeEscape("line", 1),
          },
          {
            key: "ArrowRight",
            run: this.mayBeEscape("char", 1),
          },
          {
            key: "Ctrl-Enter",
            run: () => {
              if (exitCode(this._outerView.state, this._outerView.dispatch)) {
                this._outerView.focus();
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
        ]),
        cmExtensions,
        tabKeymap,
        // autocomplete(this),
        wordHover(this),
      ],
    });

    this.cm.setState(cmState);

    // Add the newest instance to the list of instances
    CodeMirrorView.instances.push(this);

    this.cm.contentDOM.addEventListener("blur", () => {
      // Clear the selection by setting the anchor and head to the same position,
      // then blur the contentDOM to prevent editing.
      this.cm.dispatch({
        selection: {
          anchor: this.cm.state.selection.main.head,
          head: this.cm.state.selection.main.head,
        },
      });
      this.cm.contentDOM.blur();
      CodeMirrorView.focused = null;
    });

    // Add a click event listener to the outer view to ensure the selection is synchronized
    // and we can blur the CodeMirror editor, making it non-editable.
    this._outerView.dom.addEventListener("click", (event: MouseEvent) => {
      const clickedInsideCodeMirror = this.cm.dom.contains(
        event.target as Node,
      );

      if (clickedInsideCodeMirror) {
        // If we clicked inside a locked CodeMirror editor, deselect all nodes to prevent editing.
        if (this.cm.contentDOM.contentEditable === "false") {
          proofFlow.deselectAll();
        }
        return;
      }

      // Synchronize the selection from ProseMirror to CodeMirror.
      this.forwardSelection();
    });
  }

  /**
   *  Method to find a CodeMirrorView instance by its position in the ProseMirror document
   */
  static findByPos(pos: number): CodeMirrorView | null {
    return (
      CodeMirrorView.instances.find((instance) => instance.getPos() === pos) ||
      null
    );
  }

  /**
   * Method to move the cursor to the ProseMirrocr editor
   */
  forwardSelection() {
    if (!this.cm.hasFocus) {
      return;
    }

    const { state } = this._outerView;
    const selection = this.asProseMirrorSelection(state.doc);

    if (!selection.eq(state.selection)) {
      this._outerView.dispatch(state.tr.setSelection(selection));
      this._outerView.dispatchEvent;
    }

    // Ensure only one cursor is active
    if (
      CodeMirrorView.focused instanceof CodeMirrorView &&
      CodeMirrorView.focused != this
    ) {
      CodeMirrorView.focused.blurInstance();
    }

    CodeMirrorView.focused = this;
  }

  /**
   * Method to move the cursor to the ProseMirrocr editor
   */
  forceforwardSelection() {
    this.cm.focus();
    this.forwardSelection();
  }

  /**
   * Method to blur the CodeMirror instance when other instances are focused
   */
  blurInstance() {
    this.setSelection(
      this.cm.state.selection.main.head,
      this.cm.state.selection.main.head,
    );
    CodeMirrorView.focused = null;
  }

  // Converts the codemirror selection to a ProseMirror selection
  asProseMirrorSelection(doc: ProsemirrorNode) {
    const offset = this.getPos() + 1;
    const { anchor, head } = this.cm.state.selection.main;
    return TextSelection.create(doc, anchor + offset, head + offset);
  }

  /**
   * Dispatch a transaction to the codemirror editor and update the ProseMirror editor
   * @param cmTr
   */
  dispatch(cmTr: CMTransaction) {
    this.cm.setState(cmTr.state);

    if (cmTr.docChanged && !this.updating) {
      const start = this.getPos() + 1;

      const cmValue = cmTr.state.doc.toString();
      const change = computeChange(this.node.textContent, cmValue);

      if (!change) {
        return;
      }

      const content = change.text
        ? this._outerView.state.schema.text(change.text)
        : null;

      const tr = this._outerView.state.tr.replaceWith(
        change.from + start,
        change.to + start,
        content as ProsemirrorNode,
      );
      this._outerView.dispatch(tr);
      this.forwardSelection();
    }
  }

  /**
   * Checks if the input leaving should be blocked in the specified direction.
   * @param dir - The direction to check. Can be -1 for left or 1 for right.
   * @returns True if the input leaving should be blocked, false otherwise.
   */
  disallowInputLeaving(dir: -1 | 1): boolean {
    const view = proofFlow.getEditorView();
    const { state } = view;
    const { selection } = state;
    const { $from } = selection;
    const userMode = proofFlow.getUserMode();
    const node = $from.node($from.depth);

    const inStudentMode = userMode === UserMode.Student;

    const containingNode = getContainingNode(selection);
    const inInput = containingNode?.type.name === "input_content";

    if (inStudentMode && inInput) {
      const isFirstChild = containingNode?.firstChild === node;
      if (dir === -1 && isFirstChild) {
        return true;
      }
      const isLastChild = containingNode?.lastChild === node;
      if (dir === 1 && isLastChild) {
        return true;
      }
    }

    return false;
  }

  /**
   * Escape the codemirror editor and move the cursor to the ProseMirror editor
   * Will return false if the movement will not escape the current view
   */
  mayBeEscape(unit: "char" | "line", dir: -1 | 1): Command {
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

      const disallowLeaving = this.disallowInputLeaving(dir);

      if (!disallowLeaving) {
        const targetPos = this.getPos() + (dir < 0 ? 0 : this.node.nodeSize);
        const pmSelection = Selection.near(
          this._outerView.state.doc.resolve(targetPos),
          dir,
        );
        this._outerView.dispatch(
          this._outerView.state.tr.setSelection(pmSelection).scrollIntoView(),
        );
        this._outerView.focus();
      }

      return disallowLeaving;
    };
  }

  /**
   * Update the node view if the node has changed
   * and update the codemirror editor if the content has changed
   */
  update(node: ProsemirrorNode) {
    if (node.type !== this.node.type) {
      return false;
    }

    this.node = node;
    const change = computeChange(
      this.cm.state.doc.toString(),
      node.textContent,
    );

    if (change) {
      this.updating = true;
      this.cm.dispatch({
        changes: { from: change.from, to: change.to, insert: change.text },
      });
      this.updating = false;
    }

    return true;
  }

  /**
   * Focus the codemirror editor and set the selection
   */
  setSelection(anchor: number, head: number): void {
    this.updating = true;
    this.cm.dispatch({ selection: { anchor, head } });
    this.updating = false;
  }

  focus() {
    this.cm.focus();
    this.forwardSelection();
    CodeMirrorView.focused = this;
  }

  selectNode() {
    this.focus();
  }

  stopEvent() {
    return true;
  }

  // Ensure to remove the instance on destroy
  destroy() {
    this.cm.destroy();
    CodeMirrorView.instances = CodeMirrorView.instances.filter(
      (instance) => instance !== this,
    );
  }

  static resetDiagnostics() {
    CodeMirrorView.instances.forEach((instance) => (instance.diagnostics = []));
    CodeMirrorView.instances.forEach((instance) => {
      instance.isQEDError = false;
      instance.isError = false;
      let tr = setDiagnostics(instance.cm.state, []);
      instance.cm.dispatch(tr);
    });
  }

  checkQEDError(start: number) {
    let endFirstLine = this.cm.state.doc.line(1).length;
    return start < endFirstLine;
  }

  handleDiagnostic(diag: LSPDiagnostic, start: number, end: number) {
    // If the diagnostics gets handled when the doc does not have any
    // characters at that position anymore, CodeMirror breaks
    end = Math.min(end, this.cm.state.doc.length);
    let severity: Severity;
    switch (diag.severity) {
      case 1:
        severity = "error";
        break;
      case 2:
        severity = "warning";
        break;
      case 3:
        severity = "info";
        break;
      case 4:
        severity = "hint";
        break;
      default:
        severity = "error";
        break;
    }
    let diagnostic: Diagnostic = {
      from: start,
      to: end,
      severity: severity,
      message: diag.message,
    };
    this.diagnostics.push(diagnostic);
    let tr = setDiagnostics(this.cm.state, this.diagnostics);

    if (severity == "error" && this.checkQEDError(start)) {
      this.isQEDError = true;
    }
    this.isError = true;
    this.cm.dispatch(tr);
  }
}

export default CodeMirrorView;
