import { Area, AreaType } from './Area';

// Parses text into an HTML div to then be rendered by ProseMirror
export function domFromText(text: string): HTMLDivElement {
  const dom = document.createElement("div");
  text.split(/(?:\r\n?|\n){2,}/).forEach(block => {
      let p = dom.appendChild(document.createElement("p"));
      if (block) {
          block.split(/(?:\r\n?|\n)/).forEach(line => {
              console.log(line);
              if (line) {
                  line = line.replace(/ /g, '\u00A0') // Replaces space with special character, otherwise it is removed
                  if (p.hasChildNodes()) p.appendChild(document.createElement('br'));
                  p.appendChild(document.createTextNode(line));
              }
          });
      }
      dom.appendChild(p);
  });
  return dom;
};

// Parses the text into areas and converts coqdoc into markdown
export function parseToProofFlow(text: string): Area[] {
  let areas = parseToAreas(text);
  for (let area of areas) {
    console.log(area.text);
    if (area.areaType != AreaType.Markdown) continue;
    // TODO: Convert the file from Coqdoc to Markdown
  }

  return areas;
}

// Converts a default Coq file into different areas for easier conversion to the Prosemirror format
function parseToAreas(text: string): Area[] {
  let areas: Area[] = new Array();
  const regCoqdoc = /^\s*\(\*((.|\n)*?)\*\)\s*/;
  const reqCoqdocNoUse = /^\s*\(\**\)\s*/;
  const regCode = /\s*(.|\n)*?(?=\(\*)\s*/;
  while (text.length > 0) {
    let area = new Area();
    let Coqdoc = text.match(regCoqdoc);
    if (Coqdoc != null) {
      // For Coqdoc sections
      text = text.replace(regCoqdoc, '');

      // Coqdoc sometimes contains (******) but this does not have any use?
      if (Coqdoc[0].match(reqCoqdocNoUse)) continue;

      area.areaType = AreaType.Markdown;
      area.text = Coqdoc[0];

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
