/**
 * The file types that ProofFlow recognizes.
 */
export enum AcceptedFileType {
  Unknown = "",
  Coq = "v",
  CoqMD = "mv",
  Lean = "lean",
}

/**
 * Checks the file type of a given file.
 * @param file - The file to check.
 * @returns The file type of the given file.
 */
export function isCorrectFileType(file: File): AcceptedFileType {
  let fileExtension = file.name.split(".").pop();
  if (fileExtension === undefined) return AcceptedFileType.Unknown;
  if (
    !Object.values(AcceptedFileType).includes(fileExtension as AcceptedFileType)
  ) {
    return AcceptedFileType.Unknown;
  }
  return fileExtension as AcceptedFileType;
}
