import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import {
  TempAudioSaveInput,
  TempAudioSaveResult,
  TempAudioStoragePort,
} from './temp-audio-storage.port';

@Injectable()
export class LocalTempAudioStorageAdapter implements TempAudioStoragePort {
  private readonly dir: string;
  private readonly defaultTtlSeconds: number;

  constructor(private readonly config: ConfigService) {
    this.dir = this.config.get('TEMP_AUDIO_DIR') ?? '/tmp/jarvis/audio';
    this.defaultTtlSeconds = Number(this.config.get('TEMP_AUDIO_TTL_SECONDS') ?? 600);
  }

  async save(input: TempAudioSaveInput): Promise<TempAudioSaveResult> {
    await mkdir(this.dir, { recursive: true });

    const audioId = `aud_${randomUUID()}`;
    const ttl = input.ttlSeconds ?? this.defaultTtlSeconds;
    const expiresAt = new Date(Date.now() + ttl * 1000);
    const filename = `${audioId}.${input.extension}`;
    const filepath = join(this.dir, filename);

    await writeFile(filepath, input.buffer);

    return {
      audioId,
      tempUrl: `/runtime/audio/temp/${audioId}`,
      mimeType: input.mimeType,
      expiresAt,
      expiresIn: ttl,
    };
  }

  async read(audioId: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
    // Skeleton only: real implementation should resolve metadata from Redis/memory.
    const filepath = join(this.dir, `${audioId}.mp3`);
    try {
      return { buffer: await readFile(filepath), mimeType: 'audio/mpeg' };
    } catch {
      return null;
    }
  }

  async delete(audioId: string): Promise<void> {
    await rm(join(this.dir, `${audioId}.mp3`), { force: true });
  }

  async cleanupExpired(): Promise<number> {
    // Skeleton only. Real implementation should track expiresAt metadata.
    return 0;
  }
}
