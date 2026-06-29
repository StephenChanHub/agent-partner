import { Injectable } from '@nestjs/common';
import { TTSInput, TTSResult, TTSPort } from './tts.port';

@Injectable()
export class MockTTSAdapter implements TTSPort {
  async synthesize(_input: TTSInput): Promise<TTSResult> {
    return {
      audioUrl: 'mock://audio/mock-response.mp3',
      mimeType: 'audio/mpeg',
      provider: 'mock',
    };
  }
}
