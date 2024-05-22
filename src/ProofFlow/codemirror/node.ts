/*---------------------------------------------------------
 *  Adapted from https://github.com/sibiraj-s/prosemirror-codemirror-6
 *--------------------------------------------------------*/

/**
 * Here we define custom node specs for the editor
 * that are not available in the default schema.
 */

import type { NodeSpec } from "prosemirror-model";

const codeMirrorNodeSpec: NodeSpec = {
  content: "text*",
  marks: "",
  group: "block",
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
};


export default codeMirrorNodeSpec;
