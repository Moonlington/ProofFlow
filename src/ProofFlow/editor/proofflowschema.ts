import { Node, Schema } from "prosemirror-model";

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
      content: "text*",
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

    paragraph: {
      content: "inline*",
      group: "block",
      parseDOM: [{ tag: "p" }],
      toDOM() {
        return ["p", 0];
      },
    },

    blockquote: {
      content: "block+",
      group: "block",
      parseDOM: [{ tag: "blockquote" }],
      toDOM() {
        return ["blockquote", 0];
      },
    },

    horizontal_rule: {
      group: "block",
      parseDOM: [{ tag: "hr" }],
      toDOM() {
        return ["div", ["hr"]];
      },
    },

    heading: {
      attrs: { level: { default: 1 } },
      content: "(text | image)*",
      group: "block",
      defining: true,
      parseDOM: [
        { tag: "h1", attrs: { level: 1 } },
        { tag: "h2", attrs: { level: 2 } },
        { tag: "h3", attrs: { level: 3 } },
        { tag: "h4", attrs: { level: 4 } },
        { tag: "h5", attrs: { level: 5 } },
        { tag: "h6", attrs: { level: 6 } },
      ],
      toDOM(node) {
        return ["h" + node.attrs.level, 0];
      },
    },

    code_block: {
      content: "text*",
      group: "block",
      code: true,
      defining: true,
      marks: "",
      attrs: {
        id: {},
        params: { default: "" },
      },
      parseDOM: [
        {
          tag: "pre",
          preserveWhitespace: "full",
          getAttrs: (node) => ({
            params: (node as HTMLElement).getAttribute("data-params") || "",
          }),
        },
      ],
      toDOM(node) {
        return [
          "pre",
          node.attrs.params ? { "data-params": node.attrs.params } : {},
          ["code", 0],
        ];
      },
    },

    ordered_list: {
      content: "list_item+",
      group: "block",
      attrs: { order: { default: 1 }, tight: { default: false } },
      parseDOM: [
        {
          tag: "ol",
          getAttrs(dom) {
            return {
              order: (dom as HTMLElement).hasAttribute("start")
                ? +(dom as HTMLElement).getAttribute("start")!
                : 1,
              tight: (dom as HTMLElement).hasAttribute("data-tight"),
            };
          },
        },
      ],
      toDOM(node) {
        return [
          "ol",
          {
            start: node.attrs.order == 1 ? null : node.attrs.order,
            "data-tight": node.attrs.tight ? "true" : null,
          },
          0,
        ];
      },
    },

    bullet_list: {
      content: "list_item+",
      group: "block",
      attrs: { tight: { default: false } },
      parseDOM: [
        {
          tag: "ul",
          getAttrs: (dom) => ({
            tight: (dom as HTMLElement).hasAttribute("data-tight"),
          }),
        },
      ],
      toDOM(node) {
        return ["ul", { "data-tight": node.attrs.tight ? "true" : null }, 0];
      },
    },

    list_item: {
      content: "block+",
      defining: true,
      parseDOM: [{ tag: "li" }],
      toDOM() {
        return ["li", 0];
      },
    },

    image: {
      inline: true,
      attrs: {
        src: {},
        alt: { default: null },
        title: { default: null },
      },
      group: "inline",
      draggable: true,
      parseDOM: [
        {
          tag: "img[src]",
          getAttrs(dom) {
            return {
              src: (dom as HTMLElement).getAttribute("src"),
              title: (dom as HTMLElement).getAttribute("title"),
              alt: (dom as HTMLElement).getAttribute("alt"),
            };
          },
        },
      ],
      toDOM(node) {
        return ["img", node.attrs];
      },
    },

    hard_break: {
      inline: true,
      group: "inline",
      selectable: false,
      parseDOM: [{ tag: "br" }],
      toDOM() {
        return ["br"];
      },
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
      group: "area",
      parseDOM: [{ tag: "code" }],
      toDOM() {
        return ["code"];
      },
    },
  },
});
