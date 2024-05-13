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
import { defaultMarkdownParser } from "prosemirror-markdown";

// CSS

export class ProofFlow {
  private _schema: Schema;
  private _editorElem: HTMLElement;
  private _contentElem: HTMLElement;

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

    let editorState = EditorState.create(editorStateConfig);
    let directEditorProps: DirectEditorProps = {
      state: editorState,
      clipboardTextSerializer: (slice) => {
        return mathSerializer.serializeSlice(slice);
      },
      // Render text to markdown when a markdown cell is double clicked
      handleDoubleClickOn(view, pos, node, nodePos, event, direct) {
        if (node.type.name === "markdown" && direct) {
          let trans: Transaction = view.state.tr;
          const textblockNodeType = ProofFlowSchema.nodes["markdown"];
            let textNode: Node = textblockNodeType.create(null, defaultMarkdownParser.parse(node.textContent)!.content);
          trans = trans.replaceSelectionWith(textNode);

          view.state = view.state.apply(trans);
          view.updateState(view.state);
        } 
      },
    };


    this.editorView = new EditorView(this._editorElem, directEditorProps);

    const buttonBar = new ButtonBar(this._schema, this.editorView);
    buttonBar.render(this._editorElem);
  }

  private getState(): EditorState {
    return this.editorView.state;
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
    let trans: Transaction = this.getState().tr;
    let counter = this.getState().doc.content.size;
    const textblockNodeType = ProofFlowSchema.nodes["markdown"];
    let textNode: Node = textblockNodeType.create(null, [
      ProofFlowSchema.text(text),
    ]);
    trans = trans.setSelection(Selection.atEnd(this.getState().doc));
    trans = trans.insert(counter, textNode);
    console.log(trans);
    this.editorView.dispatch(trans);
  }

  public createCodeArea(text: string): void {
    let trans: Transaction = this.getState().tr;
    let counter = this.getState().doc.content.size;
    const codeblockNodeType = ProofFlowSchema.nodes["codecell"];
    let codeNode: Node = codeblockNodeType.create(null, [
      ProofFlowSchema.text(text),
    ]);
    trans = trans.setSelection(Selection.atEnd(this.getState().doc));
    trans = trans.insert(counter, codeNode);
    console.log(trans);
    this.editorView.dispatch(trans);
  }
}
