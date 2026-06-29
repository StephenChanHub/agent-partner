export interface TTSInput {
  text: string;
  voiceId?: string;
  language?: string;
  format?: 'mp3' | 'wav';
  traceId?: string;
}

export interface TTSResult {
  audioUrl?: string;
  audioBuffer?: Buffer;
  mimeType: string;
  provider: string;
}

export interface TTSPort {
  synthesize(input: TTSInput): Promise<TTSResult>;
}
