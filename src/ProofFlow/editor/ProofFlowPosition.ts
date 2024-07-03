export type Position = {
    line: number;
    character: number;
};

/**
 * Function to convert an index to a position in the document
 * @param {number} index - Index of the character in the document
 * @param {string} str - String representation of the document
 * @returns - Position of the character in the document
 */
export function indexToPosition(index: number, str: string): Position {
    let lineNumber = str.substring(0, index).split("\n").length - 1;
    let characterNumber =
        index - str.split("\n").slice(0, lineNumber).toString().length;
    return { line: lineNumber, character: characterNumber };
}




