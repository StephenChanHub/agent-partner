import { BadRequestException, Injectable } from '@nestjs/common';

export type ElevenLabsSynthesizeInput = {
  apiKey: string;
  voiceId: string;
  text: string;
  modelId: string;
  outputFormat: string;
  speed?: number;
  stability?: number;
  similarityBoost?: number;
};

export type ElevenLabsSynthesizeResult = {
  audioBuffer: Buffer;
  mimeType: string;
};

@Injectable()
export class ElevenLabsClient {
  async synthesize(input: ElevenLabsSynthesizeInput): Promise<ElevenLabsSynthesizeResult> {
    const apiKey = input.apiKey.trim();
    if (!apiKey) {
      throw new BadRequestException('ElevenLabs API key is not configured.');
    }

    const voiceId = input.voiceId.trim();
    if (!voiceId) {
      throw new BadRequestException('Voice ID is required.');
    }

    const query = new URLSearchParams({ output_format: input.outputFormat });
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?${query.toString()}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: input.text,
        model_id: input.modelId,
        voice_settings: {
          stability: input.stability ?? 0.5,
          similarity_boost: input.similarityBoost ?? 0.75,
          speed: input.speed ?? 1,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'unknown');
      throw new BadRequestException(`ElevenLabs TTS failed (${response.status}): ${errorText}`);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    if (!audioBuffer.length) {
      throw new BadRequestException('ElevenLabs returned empty audio.');
    }

    return {
      audioBuffer,
      mimeType: this.mimeTypeForFormat(input.outputFormat),
    };
  }

  private mimeTypeForFormat(outputFormat: string) {
    if (outputFormat.startsWith('mp3')) return 'audio/mpeg';
    if (outputFormat.startsWith('pcm')) return 'audio/wav';
    if (outputFormat.startsWith('opus')) return 'audio/opus';
    return 'audio/mpeg';
  }
}
