import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  TEMP_AUDIO_STORAGE,
  TempAudioSaveInput,
  TempAudioStoragePort,
} from './temp-audio-storage.port';

@Injectable()
export class TempAudioService {
  constructor(
    @Inject(TEMP_AUDIO_STORAGE)
    private readonly storage: TempAudioStoragePort,
  ) {}

  save(input: TempAudioSaveInput) {
    return this.storage.save(input);
  }

  async readOrThrow(audioId: string) {
    const audio = await this.storage.read(audioId);
    if (!audio) {
      throw new NotFoundException('Temp audio not found or expired.');
    }
    return audio;
  }

  cleanupExpired() {
    return this.storage.cleanupExpired();
  }
}
