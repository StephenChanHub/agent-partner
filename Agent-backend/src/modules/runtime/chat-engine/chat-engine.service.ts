import { Injectable } from '@nestjs/common';
import { ActionResult, IntentResult, RuntimeContext } from '../types/runtime-context.types';

@Injectable()
export class ChatEngineService {
  async run(context: RuntimeContext, _intent?: IntentResult): Promise<ActionResult[]> {
    const systemPrompt = context.agent?.manifest?.config?.prompt ?? context.agent?.manifest?.prompt?.system ?? 'You are Jarvis.';
    const userMessage = context.input?.text ?? '';
    const content = `这是沙盒 Mock 回复：我已经收到你的消息「${userMessage}」。`;

    return [
      {
        type: 'CHAT_REPLY',
        status: 'COMPLETED',
        traceId: context.traceId,
        payload: {
          systemPrompt,
          content,
          message: { role: 'assistant', content },
          usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150, agentTokensCharged: 1 },
        },
      },
    ];
  }
}
