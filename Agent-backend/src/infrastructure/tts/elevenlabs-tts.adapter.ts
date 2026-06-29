import { Injectable } from '@nestjs/common';
import { TTSInput, TTSResult, TTSPort } from './tts.port';

@Injectable()
export class ElevenLabsTTSAdapter implements TTSPort {
  async synthesize(input: TTSInput): Promise<TTSResult> {
    // v1.5 skeleton: wire ElevenLabs API in implementation phase.
    return {
      audioUrl: `elevenlabs://placeholder/${encodeURIComponent(input.text.slice(0, 16))}`,
      mimeType: input.format === 'wav' ? 'audio/wav' : 'audio/mpeg',
      provider: 'elevenlabs',
    };
  }
}
