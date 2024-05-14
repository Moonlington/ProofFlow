import { Schema, DOMParser, Fragment } from "prosemirror-model";
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
import { getContent } from "./outputparser/savefile";

// CSS

export class ProofFlow {
  private _schema: Schema;
  private _editorElem: HTMLElement;
  private _contentElem: HTMLElement;

  private editorState: EditorState;
  private editorView: EditorView;

  private fileName: string = "file.txt";

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
    this.editorState = this.editorState.apply(trans);
    this.editorView.updateState(this.editorState);
  }

  public setFileName(fileName: string) {
    this.fileName = fileName;
  }

  public saveFile() {
    const content = this.editorState.doc;
    const result = getContent(content);
    const blob = new Blob([result], { type: "text" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = this.fileName;
    document.body.appendChild(a);
    a.click();

    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}
