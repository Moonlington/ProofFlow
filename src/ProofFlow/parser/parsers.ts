import { SimpleParser } from "./parser";

export { CoqParser, CoqMDParser, LeanParser, PureLeanParser };

const CoqParser = new SimpleParser({
  text: [/\(\*\*/, /\*\)/],
  math: [/\$\$/, /\$\$/],
  collapsible: [/<hint(?: title="(.*?)")?>\n/, /\n<\/hint>/],
  input: [/<input-area>\n/, /\n<\/input-area>/],
});

const CoqMDParser = new SimpleParser({
  code: [/\n```coq\n/, /\n```/],
  math: [/\$\$/, /\$\$/],
  collapsible: [/<hint(?: title="(.*?)")?>/, /\n<\/hint>/],
  input: [/<input-area>/, /\n<\/input-area>/],
});

const LeanParser = new SimpleParser({
  code: [/```lean\n/, /```\n/],
  math: [/:::math\n/, /:::\n/],
  collapsible: [/:::collapsible\n(?:# (.*?)\n)?/, /:::\n/],
  input: [/:::input\n/, /:::\n/],
});

const PureLeanParser = new SimpleParser({
  text: [/\n\/-\n/, /\n-\/\n/],
  math: [/\n\/-\$\$\n/, /\n-\/\$\$\n/],
  collapsible: [/\n-- <hint(?: title="(.*?)")?>\n?/, /\n-- <\/hint>\n/],
  input: [/\n-- <input-area>\n/, /\n-- <\/input-area>\n/],
});
