import { Schema, DOMParser, Node } from "prosemirror-model";
import { CodeMirrorView } from "../codemirror";
import type { GetPos } from "../codemirror/types.ts";
import { ProofFlowSchema } from "./proofflowschema.ts";
import { Utils } from "./utils.ts";

import {
  EditorState,
  EditorStateConfig,
  Transaction,
  Selection,
  TextSelection,
  NodeSelection,
} from "prosemirror-state";
import { DirectEditorProps, EditorView } from "prosemirror-view";
import { createPlugins } from "../plugins/plugins.ts";
import { mathSerializer } from "@benrbray/prosemirror-math";
import { Area, AreaType } from "../parser/area.ts";
import {
  parseToAreasMV,
  parseToAreasV,
  parseToProofFlow,
  parseToAreasLean,
} from "../parser/parse-to-proofflow.ts";
import { ButtonBar } from "./ButtonBar.ts";
import { getContent } from "../outputparser/savefile.ts";

import { basicSetup } from "codemirror";
import { EditorView as CMView } from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import {
  defaultMarkdownParser,
  defaultMarkdownSerializer,
} from "prosemirror-markdown";
import { applyGlobalKeyBindings } from "../commands/shortcuts";
import { Wrapper, WrapperType } from "../parser/wrapper.ts";
import {
  mathblockNodeType,
  codeblockNodeType,
  collapsibleNodeType,
  markdownblockNodeType,
  collapsibleTitleNodeType,
  collapsibleContentType,
} from "./nodetypes.ts";
// CSS


export class ProofFlow {
  private _schema: Schema; // The schema for the editor
  private _editorElem: HTMLElement; // The HTML element that serves as the editor container
  private _contentElem: HTMLElement; // The HTML element that contains the initial content for the editor
  private _editorView: EditorView; // The view of the editor
  private _fileName: string = "file.txt";

  /**
   * Represents the ProofFlow class.
   * @constructor
   * @param {HTMLElement} editorElem - The HTML element that serves as the editor container.
   * @param {HTMLElement} contentElement - The HTML element that contains the initial content for the editor.
   */
  constructor(editorElem: HTMLElement, contentElement: HTMLElement) {
    this._schema = ProofFlowSchema; // Set the schema for the editor
    this._editorElem = editorElem; // Set the editor element
    this._contentElem = contentElement; // Set the content element

    // Create the editor state
    let editorStateConfig: EditorStateConfig = {
      schema: ProofFlowSchema,
      doc: DOMParser.fromSchema(ProofFlowSchema).parse(this._contentElem),
      plugins: createPlugins(ProofFlowSchema),
    };
    const editorState = EditorState.create(editorStateConfig);

    // Create the editor view
    let directEditorProps: DirectEditorProps = {
      state: editorState,
      clipboardTextSerializer: (slice) => {
        return mathSerializer.serializeSlice(slice);
      },
      handleClickOn(view, pos, node, nodePos, event, direct) {
        if (node.type.name === undefined || !direct) return;

        let trans = view.state.tr;

        let cursorOffset = pos;
        let thisPos = nodePos;
        let correctPos = 0;
        let offsetToClicked = 0;
        let newNodes = Array<Node>();

        view.state.doc.descendants((node, pos) => {
          if (
            !(
              node.type.name === "markdown_rendered" ||
              node.type.name === "collapsible" ||
              node.type.name === "markdown" ||
              node.type.name === "code_mirror" ||
              node.type.name === "math_display"
            )
          )
            return false;

          // Check if the clicked node is the same as the current node
          let isClickedNode: Boolean =
            pos <= thisPos && thisPos <= pos + node.nodeSize - 1;
          let newNode: Node = node;

          if (!isClickedNode && node.type.name === "markdown") {
            const parsedContent = defaultMarkdownParser.parse(node.textContent);

            if (parsedContent) {
              const markdownRenderedNodeType =
                ProofFlowSchema.nodes["markdown_rendered"];
              newNode = markdownRenderedNodeType.create(
                null,
                parsedContent.content,
              );
            }
          }

          // Check if this node position is the same as the clicked node position
          else if (isClickedNode && node.type.name === "markdown_rendered") {
            const serializedContent = defaultMarkdownSerializer.serialize(node);

            // Create a new markdown node with the serialized content (a.k.a the raw text)
            // Make sure the text is not empty, since creating an empty text cell is not allowed
            let text = serializedContent == "" ? " " : serializedContent;
            const markdownNodeType = ProofFlowSchema.nodes["markdown"];
            newNode = markdownNodeType.create(null, [
              ProofFlowSchema.text(text),
            ]);
          }

          if (isClickedNode) {
            offsetToClicked += cursorOffset - thisPos;
            correctPos = offsetToClicked;
          }

          offsetToClicked += newNode.nodeSize;
          newNodes.push(newNode);
        });

        trans.replaceWith(0, view.state.doc.content.size, newNodes);
        trans.setSelection(
          TextSelection.near(trans.doc.resolve(correctPos), -1),
        );
        view.dispatch(trans);
      },

      // Define a node view for the custom code mirror node as a prop
      nodeViews: {
        code_mirror: (node: Node, view: EditorView, getPos: GetPos) =>
          new CodeMirrorView({
            node,
            view,
            getPos,
            cmOptions: {
              extensions: [
                // will be changed, and later code from basic setup will be added to the codebase
                basicSetup,
                javascript(),
              ],
            },
          }),
      },
    };
    this._editorView = new EditorView(this._editorElem, directEditorProps);

    // Create the button bar and render it
    const buttonBar = new ButtonBar(this._schema, this._editorView);
    buttonBar.render(this._editorElem);

    // Synchronize ProseMirror selection changes with codemirror
    this._editorView.dom.addEventListener("focus", () => {
      Utils.syncProseMirrorToCodeMirror(this);
    });

    // Apply global key bindings
    applyGlobalKeyBindings(this._editorView);
  }


  /**
   * getter and setters for the ProofFlow class
   * for future usage probably
   * add more according to needs
   */



  get schema(): Schema {
    return this._schema;
  }

  get editorElem(): HTMLElement {
    return this._editorElem;
  }

  get contentElem(): HTMLElement {
    return this._contentElem;
  }

  get editorView(): EditorView {
    return this._editorView;
  }

  get fileName(): string {
    return this._fileName;
  }

  set fileName(value: string) {
    this._fileName = value;
  }
}
