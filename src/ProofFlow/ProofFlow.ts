import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema, DOMParser } from 'prosemirror-model';
import { schema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { exampleSetup } from 'prosemirror-example-setup';
import { parseToProofFlow, domFromText } from './Parser/CoqToProofFlow';
import { defaultMarkdownParser, defaultMarkdownSerializer } from "prosemirror-markdown";
import { Area, AreaType } from './Parser/Area';

declare global {
  interface Window {
    view?: EditorView;
  }
}

class MarkdownView {
  private view: EditorView;
  private index: number;

  constructor(public target: HTMLElement, content: string, index : number) {
    this.index = index;
    this.view = new EditorView(target, {
      state: EditorState.create({
        doc: defaultMarkdownParser.parse(content)!,
        plugins: exampleSetup({ schema }) //(adds the plugin bar when uncommented, not needed)
      })
    });
  }
}

// Mix the nodes from prosemirror-schema-list into the basic schema to
// create a schema with list support.
const mySchema = new Schema({
  nodes: addListNodes(schema.spec.nodes, 'paragraph block*', 'block'),
  marks: schema.spec.marks,
});

// Creates new text block at the bottom of the page
let count = 0;

export function createTextBlock(initialText: string) {
  let editor = document.createElement('div');
  editor.id = 'editor' + count.toString();
  editor.className = 'editor';
  document.body.appendChild(editor);

  let view = new EditorView(editor, {
    state: EditorState.create({
      doc: defaultMarkdownParser.parse(initialText)!,
      plugins: exampleSetup({ schema }) //(adds the plugin bar when uncommented, not needed)
    })
  });
  views.push(view);
  count++;
}

export function createCodeBlock(initialText: string) {
  let editor = document.createElement('div');
  editor.id = 'editor' + count.toString();
  editor.className = 'editor';
  document.body.appendChild(editor);
  let content = domFromText(initialText);
  content.id = 'content' + count.toString();
  content.className = 'content';

  let view = new EditorView(editor, {
    state: EditorState.create({
      doc: DOMParser.fromSchema(mySchema).parse(content!),
      plugins: exampleSetup({ schema: mySchema }),
    }),
  });
  views.push(view);
  count++;
}

// Parses an original Coq file and creates a block for each area
export function openOriginalCoqFile(text: string) {
  let areas: Area[] = parseToProofFlow(text);
  for (let area of areas) {
    if (area.areaType == AreaType.Markdown) {
      createTextBlock(area.text);
    } else if (area.areaType == AreaType.Code) {
      createCodeBlock(area.text);
    }
  }
}

let views : EditorView[] = new Array();
