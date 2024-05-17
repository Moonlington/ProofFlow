import { Node, Schema } from "prosemirror-model";
import { node as codeMirrorNode } from "./CodeMirror";
/**
 * The cell types available in ProofFlow.
 * Can be markdown, math_display, or codecell.
 */
const cell = "(markdown | math_display | code_mirror)";

/**
 * The ProofFlow schema.
 */
export const ProofFlowSchema: Schema = new Schema({
  nodes: {
    /**
     * The document node.
     * Contains zero or more cell nodes.
     */
    doc: {
      content: `${cell}*`,
    },

    /**
     * The markdown node.
     * Represents a block of markdown text.
     */
    markdown: {
      block: true,
      content: "text*",
      parseDOM: [{ tag: "markdown", preserveWhitespace: "full" }],
      atom: false,
      toDOM(node) {
        return ["markdown", 0];
      },
    },

    code_mirror: codeMirrorNode,

    /**
     * The text node.
     * Represents inline text.
     */
    text: {
      group: "inline",
    },

    /**
     * The codecell node.
     * Represents a code cell.
     */
    codecell: {
      content: "text*",
      code: true,
      parseDOM: [{ tag: "codecell", preserveWhitespace: "full" }],
      toDOM(node) {
        return ["codecell", node.attrs, 0];
      },
    },

    /**
     * The math_display node.
     * Represents a block of math display.
     */
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
    /**
     * The em mark.
     * Represents emphasized text.
     */
    em: {
      parseDOM: [{ tag: "i" }, { tag: "em" }],
      toDOM() {
        return ["em"];
      },
    },

    /**
     * The strong mark.
     * Represents strong text.
     */
    strong: {
      parseDOM: [{ tag: "b" }, { tag: "strong" }],
      toDOM() {
        return ["strong"];
      },
    },

    /**
     * The link mark.
     * Represents a hyperlink.
     */
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

    /**
     * The code mark.
     * Represents inline code.
     */
    code: {
      parseDOM: [{ tag: "code" }],
      toDOM() {
        return ["code"];
      },
    },
  },
});
