import { Injectable } from '@nestjs/common';
import { ActionResult, IntentResult, RuntimeContext } from '../types/runtime-context.types';

@Injectable()
export class VoiceEngineService {
  async run(context: RuntimeContext, intent: IntentResult): Promise<ActionResult[]> {
    const text = context.input?.text ?? '';
    const audioId = `audio_${Date.now()}`;
    return [
      {
        type: 'VOICE_REPLY',
        status: 'COMPLETED',
        traceId: context.traceId,
        payload: {
          intent,
          transcript: text,
          text: `这是沙盒语音回复：我已经收到「${text}」。`,
          audio: { audioId, url: `/runtime/audio/temp/${audioId}`, ttlSeconds: 600 },
          usage: { sttSeconds: 3, ttsCharacters: 30, agentTokensCharged: 16 },
        },
      },
    ];
  }
}
