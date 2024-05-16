/**
 * The file types that ProofFlow recognizes.
 */
export enum AcceptedFileTypes {
  Unknown = "",
  Coq = "v",
  CoqMD = "mv",
}

/**
 * Checks the file type of a given file.
 * @param file - The file to check.
 * @returns The file type of the given file.
 */
export function isCorrectFileType(file: File): AcceptedFileTypes {
  let fileExtension = file.name.split(".").pop();
  if (fileExtension === undefined) return AcceptedFileTypes.Unknown;
  if (
    !Object.values(AcceptedFileTypes).includes(
      fileExtension as AcceptedFileTypes,
    )
  ) {
    return AcceptedFileTypes.Unknown;
  }
  return fileExtension as AcceptedFileTypes;
}
