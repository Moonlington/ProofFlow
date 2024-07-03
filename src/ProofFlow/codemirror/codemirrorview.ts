/*---------------------------------------------------------
 *  Adapted from https://github.com/sibiraj-s/prosemirror-codemirror-6
 *--------------------------------------------------------*/

import { TextSelection } from "prosemirror-state";
import type { EditorView, NodeView } from "prosemirror-view";
import { Node as ProsemirrorNode } from "prosemirror-model";
import {
  EditorState as CMState,
  Transaction as CMTransaction,
} from "@codemirror/state";
import { EditorView as CMView } from "@codemirror/view";
import type { CodeMirrorViewOptions, ComputeChange } from "./types.ts";
import { proofFlow } from "../../main.ts";
import { Diagnostic, setDiagnostics } from "@codemirror/lint";
import { LSPDiagnostic } from "../lspClient/models.ts";
import { ProofFlow } from "../editor/ProofFlow.ts";
import { wordHover } from "./extensions/hovertooltip.ts";
import { getOtherKeyMaps, getTabKeyMap } from "./extensions/keyMapping.ts";

type Severity = "hint" | "info" | "warning" | "error";

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
    const tabKeymap = getTabKeyMap(this.cm);
    const otherKeymaps = getOtherKeyMaps(this._outerView);

    const cmState = CMState.create({
      doc: this.node.textContent,

      // Defining keymaps for codemirror
      extensions: [
        changeFilter,
        cmExtensions,
        tabKeymap,
        otherKeymaps,
        // autocomplete(this),
        wordHover(this),
      ],
    });

    this.cm.setState(cmState);

    // Add the newest instance to the list of instances
    CodeMirrorView.instances.push(this);

    // Add a blur event listener to the contentDOM to prevent editing
    this.cm.contentDOM.addEventListener("blur", () => {
      // Clear the selection by setting the anchor and head to the same position,
      // then blur the contentDOM to prevent editing.
      this.deselectNode();
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

      // Clear the selection by setting the anchor and head to the same position,
      // then blur the contentDOM to prevent editing.
      this.deselectNode();
    });
  }

  /**
   * Finds a CodeMirrorView instance by position.
   * @param pos The position to search for.
   * @returns The CodeMirrorView instance found, or null if not found.
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
   * Clear the selection by setting the anchor and head to the same position,
   * then blur the contentDOM to prevent editing.
   */
  deselectNode() {
    this.cm.dispatch({
      selection: {
        anchor: this.cm.state.selection.main.head,
        head: this.cm.state.selection.main.head,
      },
    });
    this.cm.contentDOM.blur();
    CodeMirrorView.focused = null;
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

  /**
   * Converts the current CodeMirror selection to a ProseMirror selection.
   * @param doc - The ProseMirror document.
   * @returns The ProseMirror selection.
   */
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

    // If the document has changed, update the ProseMirror editor
    if (cmTr.docChanged && !this.updating) {
      const start = this.getPos() + 1;

      const cmValue = cmTr.state.doc.toString();
      const change = computeChange(this.node.textContent, cmValue);

      // If there is no change, return
      if (!change) {
        return;
      }

      // Create a new content node with the new text
      const content = change.text
        ? this._outerView.state.schema.text(change.text)
        : null;

      // Replace the old node with the new content
      // and dispatch the transaction
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
   * Updates the Codemirror view with the provided Prosemirror node.
   *
   * @param node - The Prosemirror node to update the view with.
   * @returns Returns `true` if the update was successful, `false` otherwise.
   */
  update(node: ProsemirrorNode) {
    // If the node type is different, return false
    if (node.type !== this.node.type) {
      return false;
    }

    // Store the new node
    this.node = node;
    const change = computeChange(
      this.cm.state.doc.toString(),
      node.textContent,
    );

    // If there is a change between the old and new text, update the editor
    if (change) {
      this.updating = true;
      this.cm.dispatch({
        changes: { from: change.from, to: change.to, insert: change.text },
      });
      this.updating = false;
    }

    // Return true to indicate the update was successful
    return true;
  }

  /**
   * Sets the selection in the CodeMirror editor.
   *
   * @param anchor - The position of the anchor of the selection.
   * @param head - The position of the head of the selection.
   */
  setSelection(anchor: number, head: number): void {
    this.updating = true;
    this.cm.dispatch({ selection: { anchor, head } });
    this.updating = false;
  }

  /**
   * Sets the focus on the CodeMirrorView instance.
   * Moves the cursor to the editor and updates the focused instance.
   */
  focus() {
    this.cm.focus();
    this.forwardSelection();
    CodeMirrorView.focused = this;
  }

  /**
   * Destroys the CodeMirrorView instance.
   * This method destroys the underlying CodeMirror instance and removes the current instance from the list of instances.
   */
  destroy() {
    this.cm.destroy();
    CodeMirrorView.instances = CodeMirrorView.instances.filter(
      (instance) => instance !== this,
    );
  }

  /**
   * Resets the diagnostics for all instances of CodeMirrorView.
   * Clears the diagnostics array, resets error flags, and dispatches a transaction to update the CodeMirror state.
   */
  static resetDiagnostics() {
    // Clear the diagnostics for all instances
    CodeMirrorView.instances.forEach((instance) => (instance.diagnostics = []));
    CodeMirrorView.instances.forEach((instance) => {
      instance.isQEDError = false; // Reset the QEDError flag
      instance.isError = false; // Reset the Error flag
      let tr = setDiagnostics(instance.cm.state, []); // Clear the diagnostics
      instance.cm.dispatch(tr); // Dispatch the transaction
    });
  }

  /**
   * Checks if there is a QEDError at the specified start position.
   *
   * @param start - The start position to check.
   * @returns True if there is a QEDError at the specified start position, false otherwise.
   */
  checkQEDError(start: number) {
    let endFirstLine = this.cm.state.doc.line(1).length;
    return start < endFirstLine;
  }

  /**
   * Handles a diagnostic message and updates the CodeMirror editor accordingly.
   *
   * @param diag - The diagnostic message to handle.
   * @param start - The start position of the diagnostic range.
   * @param end - The end position of the diagnostic range.
   */
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

    // Create a new diagnostic object
    let diagnostic: Diagnostic = {
      from: start,
      to: end,
      severity: severity,
      message: diag.message,
    };
    this.diagnostics.push(diagnostic);
    let tr = setDiagnostics(this.cm.state, this.diagnostics);

    // If the severity is an error and the error is a QEDError, set the QEDError flag
    if (severity == "error" && this.checkQEDError(start)) {
      this.isQEDError = true;
    }
    this.isError = true;

    // Dispatch the transaction
    this.cm.dispatch(tr);
  }
}

/**
 * Computes the change between two strings.
 *
 * @param oldVal - The old string value.
 * @param newVal - The new string value.
 *
 * @returns The computed change object or null if there is no change.
 */
const computeChange = (
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

export default CodeMirrorView;
