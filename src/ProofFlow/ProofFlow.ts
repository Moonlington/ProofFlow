import {
  Schema,
  DOMParser,
  NodeType,
  Node,
} from "prosemirror-model";
import { CodeMirrorView } from "./CodeMirror";
import type { GetPos } from "./CodeMirror/types";
import { ProofFlowSchema } from "./proofflowschema.ts";
import {
  EditorState,
  EditorStateConfig,
    Transaction,
    Selection,
  NodeSelection,
} from "prosemirror-state";
import { DirectEditorProps, EditorView } from "prosemirror-view";
import { createPlugins } from "./plugins.ts";
import { mathSerializer } from "@benrbray/prosemirror-math";
import { Area, AreaType } from "./parser/area";
import { parseToProofFlow } from "./parser/coq-to-proofflow";
import { ButtonBar } from "./ButtonBar";

import { minimalSetup } from "codemirror";
import { javascript } from "@codemirror/lang-javascript";

// CSS

export class ProofFlow {
  private _schema: Schema;
  private _editorElem: HTMLElement;
  private _contentElem: HTMLElement;

  private editorState: EditorState;
  private editorView: EditorView;

  constructor(editorElem: HTMLElement, contentElement: HTMLElement) {
    this._schema = ProofFlowSchema;
    this._editorElem = editorElem;
    this._contentElem = contentElement;

    let editorStateConfig: EditorStateConfig = {
      schema: ProofFlowSchema,
      doc: DOMParser.fromSchema(ProofFlowSchema).parse(this._contentElem),
      plugins: createPlugins(this._schema),
    };

    this.editorState = EditorState.create(editorStateConfig);
    let directEditorProps: DirectEditorProps = {
      state: this.editorState,
      clipboardTextSerializer: (slice) => {
        return mathSerializer.serializeSlice(slice);
      },

      // Define a node view for the custom code mirror node as a prop
      nodeViews: {
        code_mirror: (
          node: Node,
          view: EditorView,
          getPos: GetPos,
        ) =>
          new CodeMirrorView({
            node,
            view,
            getPos,
            cmOptions: {
              extensions: [minimalSetup, javascript()],
            },
          }),
      },
    };


    this.editorView = new EditorView(this._editorElem, directEditorProps);

    const buttonBar = new ButtonBar(this._schema, this.editorView);
    buttonBar.render(this._editorElem);
  }

  // Parses an original Coq file and creates a block for each area
  public openOriginalCoqFile(text: string): void {
    let areas: Area[] = parseToProofFlow(text);
    for (let area of areas) {
      if (area.areaType == AreaType.Markdown) {
        this.createTextArea(area.text);
      } else if (area.areaType == AreaType.Code) {
        this.createCodeArea(area.text);
      }
    }
  }

  public createTextArea(text: string): void {
    let trans: Transaction = this.editorState.tr;
    let counter = this.editorState.doc.content.size;
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
