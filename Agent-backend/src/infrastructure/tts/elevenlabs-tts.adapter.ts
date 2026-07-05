import { BadRequestException, Injectable } from '@nestjs/common';
import { ElevenLabsClient } from './elevenlabs.client';
import { TtsSettingsService } from './tts-settings.service';
import { TTSInput, TTSResult, TTSPort } from './tts.port';

@Injectable()
export class ElevenLabsTTSAdapter implements TTSPort {
  constructor(
    private readonly elevenLabs: ElevenLabsClient,
    private readonly ttsSettings: TtsSettingsService,
  ) {}

  async synthesize(input: TTSInput): Promise<TTSResult> {
    const apiKey = input.apiKey || this.ttsSettings.resolveApiKey();
    if (!apiKey) {
      throw new BadRequestException('ElevenLabs API key is not configured.');
    }

    const voiceId = input.voiceId?.trim();
    if (!voiceId) {
      throw new BadRequestException('Voice ID is required for ElevenLabs TTS.');
    }

    const result = await this.elevenLabs.synthesize({
      apiKey,
      voiceId,
      text: input.text,
      modelId: input.modelId || 'eleven_v3',
      outputFormat: input.outputFormat || 'mp3_44100_128',
      speed: input.speed,
      stability: input.stability,
      similarityBoost: input.similarityBoost,
    });

    return {
      audioBuffer: result.audioBuffer,
      mimeType: result.mimeType,
      provider: 'elevenlabs',
    };
  }
}
