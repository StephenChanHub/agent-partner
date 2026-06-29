import { Injectable } from '@nestjs/common';
import { RuntimeContext } from '../types/runtime-context.types';

@Injectable()
export class RuntimeContextBuilder {
  async build(input: any): Promise<RuntimeContext> {
    const payload = input?.payload ?? input ?? {};
    const text = input?.text ?? payload?.text ?? payload?.message ?? '';
    const mode = input?.mode ?? payload?.mode ?? payload?.inputMode ?? 'TEXT';
    const agentSessionId = input?.agentSessionId ?? payload?.agentSessionId ?? payload?.sessionId ?? 'sandbox_session_001';
    const prompt = '你是 Jarvis，一个专业、简洁、可靠的 AI 助手。';

    return {
      traceId: input?.traceId ?? `trace_${Date.now()}`,
      event: {
        id: input?.id ?? `event_${Date.now()}`,
        type: input?.type ?? 'USER_MESSAGE',
        source: input?.source ?? 'SANDBOX',
      },
      payload,
      agentSessionId,
      input: {
        text,
        mode,
        sourceClient: payload?.sourceClient ?? 'WEB',
      },
      agent: {
        id: 'agent_jarvis',
        slug: 'jarvis',
        configPrompt: prompt,
        manifest: {
          identity: { name: 'Jarvis', description: 'Sandbox Jarvis Agent' },
          config: { prompt },
          prompt: { system: prompt },
        },
      },
      session: {
        id: agentSessionId,
        summary: 'Sandbox session summary.',
        recentMessages: [],
      },
      recentMessages: [],
    };
  }
}
