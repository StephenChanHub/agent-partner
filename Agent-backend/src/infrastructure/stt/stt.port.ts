export interface STTInput {
  audioBuffer: Buffer;
  mimeType: string;
  language?: string;
  traceId?: string;
}

export interface STTResult {
  text: string;
  language?: string;
  confidence?: number;
  provider: string;
}

export interface STTPort {
  transcribe(input: STTInput): Promise<STTResult>;
}
