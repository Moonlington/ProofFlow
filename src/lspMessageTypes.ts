export interface LinePos {
    line: number,
    character: number,
}

export interface Range {
    start: LinePos,
    end: LinePos,
}

export interface LSPDiagnostic {
    message: string,
    range: Range,
    severity: number;
}

export interface DiagnosticsMessageData {
    uri: string,
    version: number,
    diagnostics: Array<LSPDiagnostic>,
}

export interface DiagnosticsMessage {
    type: string;
    data: DiagnosticsMessageData; // Replace 'any' with a more specific type if you have one
}