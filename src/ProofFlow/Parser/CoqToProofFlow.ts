import { Area, AreaType } from './Area';

// Parses text into an HTML div to then be rendered by ProseMirror
export function domFromText(text: string): HTMLDivElement {
  const dom = document.createElement('div');
  text.split(/(?:\r\n?|\n){2,}/).forEach((block) => {
    let p = dom.appendChild(document.createElement('p'));
    if (block) {
      block.split(/(?:\r\n?|\n)/).forEach((line) => {
        if (line) {
          line = line.replace(/ /g, '\u00A0'); // Replaces space with special character, otherwise it is removed
          if (p.hasChildNodes()) p.appendChild(document.createElement('br'));
          p.appendChild(document.createTextNode(line));
        }
      });
    }
    dom.appendChild(p);
  });
  return dom;
}

// Parses the text into areas and converts coqdoc into markdown
export function parseToProofFlow(text: string): Area[] {
  let areas = parseToAreas(text);
  return areas;
}

function getNestedCount (list : string) {
  let count = 0;
  for (let i = 0; i < list.length; i++) {
    if (list[i] === '-') count++;
    else break;
  }
  return count;
}

function coqdocToMarkDown(text: string): string {
  let result = '';
  let index = text.lastIndexOf('*)');
  const regHead1 = /^\s*\*/;
  const regHead2 = /^\s*\*\*/;
  const regHead3 = /^\s*\*\*\*/;
  const regHead4 = /^\s*\*\*\*\*/;
  const regHead5 = /^\s*\*\*\*\*\*+/;

  const regList = /^\s*-/;

  text = text.substring(4, index);
  text.split(/(?:\r\n?|\n){2,}/).forEach((block) => {
    if (block) {
      block.split(/(?:\r\n?|\n)/).forEach((line) => {
        line = line.trimStart();
        if (line.match(regHead1)) {
          if (line.match(regHead5)) {
            line = line.replace(regHead5, '#####');
          } else if (line.match(regHead4)) {
            line = line.replace(regHead4, '####');
          } else if (line.match(regHead3)) {
            line = line.replace(regHead3, '###');
          } else if (line.match(regHead2)) {
            line = line.replace(regHead2, '##');
          } else {
            line = line.replace(regHead1, '#');
          }
        } else if (line.match(regList)) {
          let nested = getNestedCount(line);
          line = "  ".repeat(nested - 1) + '-' + line.substring(nested);
        }
        result += line + '\n';
      });
    }
  });
  return result;
}

// Converts a default Coq file into different areas for easier conversion to the Prosemirror format
function parseToAreas(text: string): Area[] {
  let areas: Area[] = new Array();
  const regCoqdoc = /^\s*\(\*((.|\n)*?)\*\)\s*/;
  const reqCoqdocNoUse = /^\s*\(\**\)\s*/;
  const regCode = /^\s*(.|\n)*?(?=\(\*)\s*/;
  while (text.length > 0) {
    let area = new Area();
    let coqdoc = text.match(regCoqdoc);
    if (coqdoc != null) {
      // For Coqdoc sections
      text = text.replace(regCoqdoc, '');

      // Coqdoc sometimes contains (******) but this does not have any use?
      if (coqdoc[0].match(reqCoqdocNoUse)) continue;

      area.areaType = AreaType.Markdown;
      area.text = coqdocToMarkDown(coqdoc[0]);

      areas.push(area);
      continue;
    }
    let code = text.match(regCode);
    if (code != null) {
      //For code sections
      text = text.replace(regCode, '');

      area.areaType = AreaType.Code;
      area.text = code[0];

      areas.push(area);
      continue;
    }

    // Either this is the last code section or something went wrong
    area.areaType = AreaType.Code;
    area.text = text;
    areas.push(area);
    break;
  }

  return areas;
}
