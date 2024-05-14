import { Schema, DOMParser } from "prosemirror-model";
import { NodeType, Node } from "prosemirror-model";
import { ProofFlowSchema } from "./ProofFlowSchema";
import {
  EditorState,
  EditorStateConfig,
  Transaction,
  Selection,
} from "prosemirror-state";
import { DirectEditorProps, EditorView } from "prosemirror-view";
import { createPlugins } from "./Plugins";
import { mathSerializer } from "@benrbray/prosemirror-math";
import { Area, AreaType } from "./parser/area";
import { parseToProofFlow } from "./parser/coq-to-proofflow";
import { ButtonBar } from "./ButtonBar";

// CSS

export class ProofFlow {
  // Private fields
  private _schema: Schema;
  private _editorElem: HTMLElement;
  private _contentElem: HTMLElement;

  private editorState: EditorState;
  private editorView: EditorView;

  /**
   * Represents the ProofFlow class.
   * @constructor
   * @param {HTMLElement} editorElem - The HTML element that serves as the editor container.
   * @param {HTMLElement} contentElement - The HTML element that contains the initial content for the editor.
   */
  constructor(editorElem: HTMLElement, contentElement: HTMLElement) {
    // Set the schema, editor element, and content element
    this._schema = ProofFlowSchema;
    this._editorElem = editorElem;
    this._contentElem = contentElement;

    // Create the editor
    let editorStateConfig: EditorStateConfig = {
      schema: ProofFlowSchema,
      doc: DOMParser.fromSchema(ProofFlowSchema).parse(this._contentElem),
      plugins: createPlugins(this._schema),
    };

    // Create the editor state
    this.editorState = EditorState.create(editorStateConfig);
    let directEditorProps: DirectEditorProps = {
      state: this.editorState,
      clipboardTextSerializer: (slice) => {
        return mathSerializer.serializeSlice(slice);
      },
    };

    // Create the editor view
    this.editorView = new EditorView(this._editorElem, directEditorProps);

    // Create the button bar and render it
    const buttonBar = new ButtonBar(this._schema, this.editorView);
    buttonBar.render(this._editorElem);
  }

  // Parses an original Coq file and creates a block for each area
  /**
   * Opens the original Coq file and creates text or code areas based on the parsed content.
   *
   * @param text - The content of the Coq file.
   */
  public openOriginalCoqFile(text: string): void {
    // Parse the text to create the proof flow
    let areas: Area[] = parseToProofFlow(text);

    // Create text or code areas based on the parsed content
    for (let area of areas) {
      if (area.areaType == AreaType.Markdown) {
        this.createTextArea(area.text);
      } else if (area.areaType == AreaType.Code) {
        this.createCodeArea(area.text);
      }
    }
  }

  /**
   * Creates a new text area in the editor and inserts the specified text.
   *
   * @param text - The text to be inserted in the text area.
   */
  public createTextArea(text: string): void {
    // Create a new transaction and get the counter
    let trans: Transaction = this.editorState.tr;
    let counter = this.editorState.doc.content.size;

    // Create a new text node and insert it at the end of the document
    const textblockNodeType = ProofFlowSchema.nodes["markdown"];
    let textNode: Node = textblockNodeType.create(null, [
      ProofFlowSchema.text(text),
    ]);
    trans = trans.setSelection(Selection.atEnd(this.editorState.doc));
    trans = trans.insert(counter, textNode);
    console.log(trans);
    this.editorState = this.editorState.apply(trans);
    this.editorView.updateState(this.editorState);
  }

  // TODO Add custom areas + documentation
  public createCodeArea(text: string): void {
    let trans: Transaction = this.editorState.tr;
    let counter = this.editorState.doc.content.size;
    const codeblockNodeType = ProofFlowSchema.nodes["codecell"];
    let codeNode: Node = codeblockNodeType.create(null, [
      ProofFlowSchema.text(text),
    ]);
    trans = trans.setSelection(Selection.atEnd(this.editorState.doc));
    trans = trans.insert(counter, codeNode);
    console.log(trans);
    this.editorState = this.editorState.apply(trans);
    this.editorView.updateState(this.editorState);
  }
}
