import { Node, Schema } from 'prosemirror-model';

const cell = '(mathcell | markdown | codecell)';

export const ProofFlowSchema: Schema = new Schema({
  nodes: {
    doc: {
      content: `${cell}*`,
    },

    markdown: {
      block: true,
      content: 'text*',
      parseDOM: [{ tag: 'markdown', preserveWhitespace: 'full' }],
      atom: true,
      toDOM(node) {
        return ['markdown', 0];
      },
    },

    text: {
      group: 'inline',
    },

    codecell: {
      content: 'text*',
      code: true,
      parseDOM: [{ tag: 'codecell', preserveWhitespace: 'full' }],
      toDOM(node) {
        return ['codecell', node.attrs, 0];
      },
    },

    mathcell: {
      group: "math",
      content: "text*",
      toDOM(node) { return ["mathcell", {...{ class: "math-node" }, ...node.attrs}, 0] },
      parseDOM: [{tag: "mathcell", preserveWhitespace: "full"}]
    }
  },
  marks: {
    em: {
      parseDOM: [{ tag: 'i' }, { tag: 'em' }],
      toDOM() {
        return ['em'];
      },
    },

    strong: {
      parseDOM: [{ tag: 'b' }, { tag: 'strong' }],
      toDOM() {
        return ['strong'];
      },
    },

    link: {
      attrs: {
        href: {},
        title: { default: null },
      },
      inclusive: false,
      parseDOM: [
        {
          tag: 'a[href]',
          getAttrs(dom) {
            return {
              href: (dom as HTMLElement).getAttribute('href'),
              title: (dom as HTMLElement).getAttribute('title'),
            };
          },
        },
      ],
      toDOM(node) {
        return ['a', node.attrs];
      },
    },

    code: {
      parseDOM: [{ tag: 'code' }],
      toDOM() {
        return ['code'];
      },
    },
  },
});
