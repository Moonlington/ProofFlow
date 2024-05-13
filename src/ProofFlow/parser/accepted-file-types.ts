// The file types that ProofFlow recognizes
export enum AcceptedFileTypes {
  Unknown = "",
  Coq = "v",
}

// Checks what file type a file is
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
