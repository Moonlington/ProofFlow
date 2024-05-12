import { Node, Schema } from "prosemirror-model";

const cell = "(markdown | math_display | codecell)";

export const ProofFlowSchema: Schema = new Schema({
  nodes: {
    doc: {
      content: `${cell}*`,
    },

    markdown: {
      block: true,
      content: "text*",
      parseDOM: [{ tag: "markdown", preserveWhitespace: "full" }],
      atom: true,
      toDOM(node) {
        return ["markdown", 0];
      },
    },

    text: {
      group: "inline",
    },

    codecell: {
      content: "text*",
      code: true,
      parseDOM: [{ tag: "codecell", preserveWhitespace: "full" }],
      toDOM(node) {
        return ["codecell", node.attrs, 0];
      },
    },

    math_display: {
      group: "block math",
      content: "text*",
      atom: true,
      code: true,
      toDOM: () => ["math-display", { class: "math-node" }, 0],
      parseDOM: [
        {
          tag: "math-display",
        },
      ],
    },
  },
  marks: {
    em: {
      parseDOM: [{ tag: "i" }, { tag: "em" }],
      toDOM() {
        return ["em"];
      },
    },

    strong: {
      parseDOM: [{ tag: "b" }, { tag: "strong" }],
      toDOM() {
        return ["strong"];
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
          tag: "a[href]",
          getAttrs(dom) {
            return {
              href: (dom as HTMLElement).getAttribute("href"),
              title: (dom as HTMLElement).getAttribute("title"),
            };
          },
        },
      ],
      toDOM(node) {
        return ["a", node.attrs];
      },
    },

    code: {
      parseDOM: [{ tag: "code" }],
      toDOM() {
        return ["code"];
      },
    },
  },
});
