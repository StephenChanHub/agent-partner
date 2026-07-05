export interface TTSInput {
  text: string;
  voiceId?: string;
  modelId?: string;
  outputFormat?: string;
  speed?: number;
  stability?: number;
  similarityBoost?: number;
  format?: 'mp3' | 'wav';
  traceId?: string;
  apiKey?: string;
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
