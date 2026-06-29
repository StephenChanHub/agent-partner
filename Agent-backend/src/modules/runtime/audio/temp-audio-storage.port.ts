export type TempAudioSaveInput = {
  messageId: string;
  buffer: Buffer;
  mimeType: string;
  extension: 'mp3' | 'wav' | 'webm';
  ttlSeconds?: number;
};

export type TempAudioSaveResult = {
  audioId: string;
  tempUrl: string;
  mimeType: string;
  expiresAt: Date;
  expiresIn: number;
};

export interface TempAudioStoragePort {
  save(input: TempAudioSaveInput): Promise<TempAudioSaveResult>;
  read(audioId: string): Promise<{ buffer: Buffer; mimeType: string } | null>;
  delete(audioId: string): Promise<void>;
  cleanupExpired(): Promise<number>;
}

export const TEMP_AUDIO_STORAGE = Symbol('TEMP_AUDIO_STORAGE');
