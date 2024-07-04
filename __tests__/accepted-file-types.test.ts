import { isCorrectFileType, AcceptedFileType } from '../src/ProofFlow/parser/accepted-file-types';

describe('isCorrectFileType', () => {
  it('should return the correct file type for coq', () => {
    const mockFile = new File([""], "example.v", { type: "text/plain" });
    expect(isCorrectFileType(mockFile)).toBe(AcceptedFileType.Coq);
  });

  it('should return the correct file type for lean', () => {
    const mockFile = new File([""], "example.lean", { type: "text/plain" });
    expect(isCorrectFileType(mockFile)).toBe(AcceptedFileType.Lean);
  });

  it('should return the correct file type for CoqMD', () => {
    const mockFile = new File([""], "example.mv", { type: "text/plain" });
    expect(isCorrectFileType(mockFile)).toBe(AcceptedFileType.CoqMD);
  });

  it('should return Unknown for an unknown extension', () => {
    const mockFile = new File([""], "example.unknown", { type: "application/octet-stream" });
    expect(isCorrectFileType(mockFile)).toBe(AcceptedFileType.Unknown);
  });

  it('should return Unknown for a file without an extension', () => {
    const mockFile = new File([""], "example", { type: "application/octet-stream" });
    expect(isCorrectFileType(mockFile)).toBe(AcceptedFileType.Unknown);
  });

  it('should return Unknown for a file with a name that includes periods but no extension', () => {
    const mockFile = new File([""], "example.file.with.no.extension", { type: "application/octet-stream" });
    expect(isCorrectFileType(mockFile)).toBe(AcceptedFileType.Unknown);
  });
});
