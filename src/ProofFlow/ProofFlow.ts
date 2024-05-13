import {
  Schema,
  DOMParser,
  NodeType,
  Node as ProsemirrorNode,
} from "prosemirror-model";
import { CodeMirrorView } from "./CodeMirror";
import type { GetPos } from "./CodeMirror/types";
import { Proofflowschema } from "./proofflowschema.ts";
import { schema } from "prosemirror-schema-basic";
import { MenuItem } from "prosemirror-menu";
import { setBlockType } from "prosemirror-commands";
import { buildMenuItems, exampleSetup } from "prosemirror-example-setup";
import {
  EditorState,
  EditorStateConfig,
  NodeSelection,
} from "prosemirror-state";
import { DirectEditorProps, EditorView } from "prosemirror-view";
import { createPlugins } from "./plugins.ts";
import { mathSerializer } from "@benrbray/prosemirror-math";
import { minimalSetup } from "codemirror";
import { javascript } from "@codemirror/lang-javascript";

// CSS

export class ProofFlow {
  private _schema: Schema;
  private _editorElem: HTMLElement;
  private _contentElem: HTMLElement;

  constructor(editorElem: HTMLElement, contentElement: HTMLElement) {
    this._schema = Proofflowschema;
    this._editorElem = editorElem;
    this._contentElem = contentElement;

    // let editorStateConfig: EditorStateConfig = {
    //   schema: Proofflowschema,
    //   doc: DOMParser.fromSchema(Proofflowschema).parse(this._contentElem),
    //   plugins: createPlugins(this._schema),
    // };

    let editorState = EditorState.create({
      doc: DOMParser.fromSchema(Proofflowschema).parse(this._contentElem),
      plugins: createPlugins(this._schema),
    });

    let directEditorProps: DirectEditorProps = {
      state: editorState,
      clipboardTextSerializer: (slice) => {
        return mathSerializer.serializeSlice(slice);
      },
      nodeViews: {
        code_mirror: (
          node: ProsemirrorNode,
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

    let editorView = new EditorView(this._editorElem, directEditorProps);
  }
}
