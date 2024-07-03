import { MarkSpec } from "prosemirror-model";

/**
 * The em mark.
 * Represents emphasized text.
 */

export const em: MarkSpec = {
  parseDOM: [{ tag: "i" }, { tag: "em" }],
  toDOM() {
    return ["em"];
  },
};

/**
 * The strong mark.
 * Represents strong text.
 */
export const strong: MarkSpec = {
  parseDOM: [{ tag: "b" }, { tag: "strong" }],
  toDOM() {
    return ["strong"];
  },
};

/**
 * The link mark.
 * Represents a hyperlink.
 */
export const link: MarkSpec = {
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
};

/**
 * The code mark.
 * Represents inline code.
 */
export const code: MarkSpec = {
  group: "area",
  parseDOM: [{ tag: "code" }],
  toDOM() {
    return ["code"];
  },
};
