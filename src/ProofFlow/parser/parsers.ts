import { OutputConfig } from "../editor/ProofFlowDocument";
import { SimpleParser } from "./parser";

export {
  CoqParser,
  CoqMDParser,
  LeanParser,
  CoqOutput,
  CoqMDOutput,
  LeanOutput,
};

const CoqParser = new SimpleParser({
  text: [/\(\*\*/, /\*\)/],
  math: [/\$\$/, /\$\$/],
  collapsible: [/<hint(?: title="(.*?)")?>\n/, /\n<\/hint>/],
  input: [/<input-area>\n/, /\n<\/input-area>/],
});

const CoqMDParser = new SimpleParser({
  code: [/```coq\n/, /\n```/],
  math: [/\$\$/, /\$\$/],
  collapsible: [/<hint(?: title="(.*?)")?>\n/, /\n<\/hint>/],
  input: [/<input-area>\n/, /\n<\/input-area>/],
});

const LeanParser = new SimpleParser({
  code: [/```lean\n/, /```\n/],
  math: [/:::math\n/, /:::\n/],
  collapsible: [/:::collapsible\n(?:# (.*?)\n)?/, /:::\n/],
  input: [/:::input\n/, /:::\n/],
});

const CoqOutput: OutputConfig = {
  text: ["(**", "*)"],
  code: ["", ""],
  math: ["$$", "$$"],
  collapsible: ["<hint>", "</hint>"],
  collapsibletitle: ['<hint title="TITLE">\n', "\n</hint>"],
  input: ["<input-area>\n", "\n</input-area>"],
};

const CoqMDOutput: OutputConfig = {
  text: ["", ""],
  code: ["```coq\n", "\n```"],
  math: ["$$", "$$"],
  collapsible: ["<hint>\n", "\n</hint>"],
  collapsibletitle: ['<hint title="TITLE">\n', "\n</hint>"],
  input: ["<input-area>\n", "\n</input-area>"],
};

const LeanOutput: OutputConfig = {
  text: ["", ""],
  code: ["```lean\n", "```\n"],
  math: [":::math\n", ":::\n"],
  collapsible: [":::collapsible\n", ":::\n"],
  collapsibletitle: [":::collapsible\n# TITLE\n", ":::\n"],
  input: [":::input\n", ":::\n"],
};
