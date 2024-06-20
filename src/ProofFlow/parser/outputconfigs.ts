import { OutputConfig } from "../editor/ProofFlowDocument";

export { CoqOutput, CoqMDOutput, LeanOutput };

const CoqOutput: OutputConfig = {
  text: ["(**", "*)"],
  code: ["", ""],
  math: ["$$", "$$"],
  collapsible: ["\n<hint>\n", "\n</hint>\n"],
  collapsibletitle: ['\n<hint title="TITLE">\n', "\n</hint>\n"],
  input: ["\n<input-area>\n", "\n</input-area>\n"],
};

const CoqMDOutput: OutputConfig = {
  text: ["", ""],
  code: ["\n```coq\n", "\n```\n"],
  math: ["$$", "$$"],
  collapsible: ["<hint>", "</hint>"],
  collapsibletitle: ['<hint title="TITLE">', "</hint>"],
  input: ["<input-area>", "</input-area>"],
};

const LeanOutput: OutputConfig = {
  text: ["", ""],
  code: ["```lean\n", "```\n"],
  math: [":::math\n", ":::\n"],
  collapsible: [":::collapsible\n", ":::\n"],
  collapsibletitle: [":::collapsible\n# TITLE\n", ":::\n"],
  input: [":::input\n", ":::\n"],
};
