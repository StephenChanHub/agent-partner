import { Injectable } from '@nestjs/common';
import { IntentResult, RuntimeContext } from '../types/runtime-context.types';

@Injectable()
export class IntentEngineService {
  async analyze(context: RuntimeContext): Promise<IntentResult> {
    const text = context.input?.text ?? '';

    if (['前进', '后退', '左转', '右转', '停止'].some((word) => text.includes(word))) {
      return { type: 'ROBOT_COMMAND', confidence: 0.9 };
    }

    if (context.input?.mode === 'VOICE') return { type: 'VOICE_CHAT', confidence: 1 };
    return { type: 'CHAT', confidence: 1 };
  }
}
