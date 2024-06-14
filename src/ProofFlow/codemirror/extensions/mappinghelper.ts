import CodeMirrorView from "../codemirrorview";
import { Text } from '@codemirror/state';

/**
 * Converts a CodeMirror position inside an instance to a line and character number
 * @param instance Relevant CodeMirror instance
 * @param doc Text inside the instance
 * @param offset CodeMirror position
 * @returns 
 */
export function offsetToPos(instance: CodeMirrorView, doc: Text, offset: number) {
    const line = doc.lineAt(offset);
    const lineNumber = instance.lineStart + doc.lineAt(offset).number - 1;
    const character = offset - line.from;
    console.log('Line:', line, 'Character:', character);
  
    console.log('Line: ', lineNumber, 'Character: ', character);
    return {line: lineNumber, character: character};
  }