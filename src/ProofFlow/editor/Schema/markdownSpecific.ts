import { NodeSpec } from "prosemirror-model";

/**
 * The paragraph node.
 */
export const paragraph: NodeSpec = {
  content: "inline*",
  group: "block",
  parseDOM: [{ tag: "p" }],
  toDOM() {
    return ["p", 0];
  },
};

/**
 * The blockquote node.
 */
export const blockquote: NodeSpec = {
  content: "block+",
  group: "block",
  parseDOM: [{ tag: "blockquote" }],
  toDOM() {
    return ["blockquote", 0];
  },
};

/**
 * The horizontal rule node.
 */
export const horizontal_rule: NodeSpec = {
  group: "block",
  parseDOM: [{ tag: "hr" }],
  toDOM() {
    return ["div", ["hr"]];
  },
};

/**
 * The heading node.
 */
export const heading: NodeSpec = {
  attrs: { level: { default: 1 } },
  content: "(text | image)*",
  group: "block",
  defining: true,
  parseDOM: [
    // Parse the heading tags
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
};

/**
 * The code_block node.
 */
export const code_block: NodeSpec = {
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
};

/**
 * The ordered_list node.
 */
export const ordered_list: NodeSpec = {
  content: "list_item+",
  group: "block",
  attrs: { order: { default: 1 }, tight: { default: false } },
  parseDOM: [
    {
      tag: "ol",
      getAttrs(dom) {
        return {
          // Cast to HTMLElement to access the attributes
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
        // Cast to HTMLElement to access the attributes
        start: node.attrs.order == 1 ? null : node.attrs.order,
        "data-tight": node.attrs.tight ? "true" : null,
      },
      0,
    ];
  },
};

/**
 * The list_item node.
 */
export const bullet_list: NodeSpec = {
  content: "list_item+",
  group: "block",
  attrs: { tight: { default: false } },
  parseDOM: [
    {
      tag: "ul",
      getAttrs: (dom) => ({
        // Cast to HTMLElement to access the attributes
        tight: (dom as HTMLElement).hasAttribute("data-tight"),
      }),
    },
  ],
  toDOM(node) {
    return ["ul", { "data-tight": node.attrs.tight ? "true" : null }, 0];
  },
};

/**
 * The list_item node.
 */
export const list_item: NodeSpec = {
  content: "block+",
  defining: true,
  parseDOM: [{ tag: "li" }],
  toDOM() {
    return ["li", 0];
  },
};

/**
 * The table node.
 */
export const image: NodeSpec = {
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
        // Cast to HTMLElement to access the attributes
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
};

/**
 * Represents the NodeSpec for a hard break in Markdown.
 */
export const hard_break: NodeSpec = {
  inline: true,
  group: "inline",
  selectable: false,
  parseDOM: [{ tag: "br" }],
  toDOM() {
    return ["br"];
  },
};
