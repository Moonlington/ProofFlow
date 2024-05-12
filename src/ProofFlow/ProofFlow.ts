import { Schema, DOMParser } from "prosemirror-model";
import { ProofFlowSchema } from "./ProofFlowSchema";
import { EditorState, EditorStateConfig } from "prosemirror-state";
import { DirectEditorProps, EditorView } from "prosemirror-view";
import { createPlugins } from "./Plugins";


// CSS

export class ProofFlow {
  private _schema : Schema;
  private _editorElem : HTMLElement;
  private _contentElem : HTMLElement;

  constructor(editorElem : HTMLElement, contentElement : HTMLElement) {
    this._schema = ProofFlowSchema;
    this._editorElem = editorElem;
    this._contentElem = contentElement;
    
    let editorStateConfig : EditorStateConfig = {
      schema: ProofFlowSchema,
      doc: DOMParser.fromSchema(ProofFlowSchema).parse(this._contentElem),
      plugins: createPlugins(this._schema),
    }

    let editorState = EditorState.create(editorStateConfig);
    let directEditorProps : DirectEditorProps = {
      state: editorState,
    }

    let editorView = new EditorView(this._editorElem, directEditorProps);
  }
}