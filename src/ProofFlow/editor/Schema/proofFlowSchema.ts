import { Node, Schema } from "prosemirror-model";
import * as marks from "./mark";
import * as markdownSpecificNodes from "./markdownSpecific";

/**
 * The cell types available in ProofFlow.
 * Can be markdown, math_display, or codecell.
 */
export enum ProofStatus {
  Correct,
  Incorrect,
  Unattempted,
}

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
      content: `(area | container)*`,
    },

    /**
     * The area node.
     * Represents a block of content.
     */
    input: {
      attrs: {
        id: {},
        proof: { default: ProofStatus.Unattempted },
      },
      group: "container",
      content: `input_content`,
      parseDOM: [{ tag: "input" }],
      toDOM(node: Node) {
        const proofValue = node.attrs.proof;
        let proofClass = "";

        switch (proofValue) {
          case ProofStatus.Correct:
            proofClass = "input-correct";
            break;
          case ProofStatus.Incorrect:
            proofClass = "input-incorrect";
            break;
          case ProofStatus.Unattempted:
            proofClass = "input-unattempted";
        }

        return ["div", { class: `input ${proofClass}` }, 0];
      },
    },

    /**
     * The input_content node.
     */
    input_content: {
      content: `area+`,
      parseDOM: [
        {
          tag: "input_content",
        },
      ],
      toDOM(_node: Node) {
        return ["div", { class: "input_content unlocked", visible: true }, 0];
      },
    },

    /**
     * The area node.
     * Represents a block of content.
     */
    collapsible: {
      attrs: {
        id: {},
      },
      group: "container",
      content: `(collapsible_title)(collapsible_content)`,
      parseDOM: [{ tag: "collapsible" }],
      toDOM(_node: Node) {
        return ["div", { class: "collapsible" }, 0];
      },
    },

    /**
     * Node for the title of a collapsible area.
     */
    collapsible_title: {
      content: "text*",
      parseDOM: [
        { tag: "collapsible_title unlocked", preserveWhitespace: "full" },
      ],
      code: false,
      toDOM(_node) {
        return ["collapsible_title", { class: "unlocked" }, 0];
      },
    },

    /**
     * Node for the content of a collapsible area.
     */
    collapsible_content: {
      content: `area+`,
      attrs: {
        visible: { default: false },
      },
      parseDOM: [
        {
          tag: "collapsible_content",
          getAttrs(dom) {
            return {
              title:
                (dom as HTMLElement).getAttribute("title") ?? "Collapsible",
            };
          },
        },
      ],
      toDOM(node: Node) {
        return [
          "div",
          { class: "collapsible_content", visible: node.attrs.visible },
          0,
        ];
      },
    },

    /**
     * The markdown node.
     * Represents a block of markdown text.
     */
    markdown: {
      attrs: {
        id: {},
      },
      group: "area",
      content: "inline*", // aka text and math_inline
      code: true,
      toDOM(_node) {
        return ["markdown", { class: "markdown" }, 0];
      },
    },

    /**
     * The markdown_rendered node.
     * Represents a block of markdown text that has been rendered.
     */
    markdown_rendered: {
      attrs: {
        id: {},
        original_text: { default: "" },
      },
      content: "block*",
      group: "area",
      parseDOM: [{ tag: "markdown-rendered", preserveWhitespace: true }],
      atom: true,
      toDOM(_node) {
        return ["markdown-rendered", { class: "markdown unlocked" }, 0];
      },
    },

    /**
     * Markdown rendered child node
     * Represents the actual markdown in a markdown_rendered node
     * Can be used next to math_inline_block to show latex in a rendered markdown node
     */
    markdown_rendered_child: {
      content: "block*",
      group: "block",
      parseDOM: [{ tag: "markdown-rendered-child", preserveWhitespace: true }],
      atom: true,
      toDOM(_node) {
        return [
          "markdown-rendered-child",
          { class: "markdown-rendered-child" },
          0,
        ];
      },
    },

    /**
     * The code_mirror node.
     * Represents a block of code.
     */
    code_mirror: {
      attrs: {
        id: { default: null },
      },
      content: "text*",
      marks: "",
      group: "area",
      code: true,
      defining: true,
      isolating: true,
      parseDOM: [
        {
          tag: "pre",
          preserveWhitespace: "full",
        },
      ],
      toDOM() {
        return ["pre", ["code", 0]];
      },
    },

    /**
     * The text node.
     * Represents inline text.
     */
    text: {
      group: "inline",
    },

    /**
     * The math_display node.
     * Represents a block of math display.
     */
    math_display: {
      attrs: {
        id: {},
      },
      group: "area",
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

    /**
     * The math_inline node.
     * Represents inline math.
     */
    math_inline: {
      group: "inline",
      content: "text*",
      inline: true,
      atom: true,
      toDOM: () => ["math-inline", { class: "math-node" }, 0],
      parseDOM: [
        {
          tag: "math-inline",
        },
      ],
    },

    /**
     * A wrapper node to be able to insert inline math into a markdown_rendered node which only accepts block content
     */
    math_inline_block: {
      group: "block",
      content: "math_inline*",
      parseDOM: [{ tag: "math-inline-block" }],
      toDOM(_node) {
        return ["math-inline-block", { class: "math-inline-block" }, 0];
      },
    },

    // Add the markdown specific nodes
    ...markdownSpecificNodes,
  },
  marks: {
    ...marks,
  },
});
