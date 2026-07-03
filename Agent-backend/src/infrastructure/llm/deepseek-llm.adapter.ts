import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import { LLMGenerateInput, LLMGenerateResult, LLMPort, LLMStreamChunk } from './llm.port';

@Injectable()
export class DeepSeekLLMAdapter implements LLMPort {
  constructor(private readonly config: AppConfigService) {}

  async generate(input: LLMGenerateInput): Promise<LLMGenerateResult> {
    const apiKey = input.apiKey || this.config.value.llm.deepSeekApiKey;
    const baseUrl = input.baseUrl || 'https://api.deepseek.com';
    const model = input.model || this.config.value.llm.deepSeekModel || 'deepseek-chat';

    if (!apiKey) {
      // v1.6 placeholder behavior: keep API usable until the real key is configured.
      return {
        content: `Mock DeepSeek response: ${input.userMessage}`,
        provider: 'mock-deepseek-placeholder',
        model,
        usage: { inputTokens: 1000, outputTokens: 200, totalTokens: 1200 },
      };
    }

    try {
      const messages: Array<{ role: string; content: string }> = [];

      if (input.systemPrompt) {
        messages.push({ role: 'system', content: input.systemPrompt });
      }

      for (const msg of input.messages) {
        if (msg.role === 'system' || msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: msg.content });
        }
      }

      messages.push({ role: 'user', content: input.userMessage });

      const url = `${baseUrl.replace(/\/+$/, '')}/v1/chat/completions`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: input.temperature ?? 0.7,
          max_tokens: input.maxOutputTokens ?? 512,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'unknown');
        throw new Error(`DeepSeek API error ${response.status}: ${errorText}`);
      }

      const data = await response.json() as any;
      const choice = data?.choices?.[0];
      const content = choice?.message?.content ?? '';
      const usage = data?.usage;

      return {
        content,
        provider: 'deepseek',
        model,
        usage: {
          inputTokens: usage?.prompt_tokens ?? 0,
          outputTokens: usage?.completion_tokens ?? 0,
          totalTokens: usage?.total_tokens ?? 0,
        },
      };
    } catch (error: any) {
      // Fallback to mock on network errors so the app doesn't crash in dev.
      console.error('[DeepSeekLLMAdapter] API call failed, falling back to mock:', error?.message ?? error);
      return {
        content: `[DeepSeek error: ${error?.message ?? 'unknown'}] Mock fallback: ${input.userMessage}`,
        provider: 'deepseek-fallback',
        model,
        usage: { inputTokens: 1000, outputTokens: 200, totalTokens: 1200 },
      };
    }
  }

  async *stream(input: LLMGenerateInput): AsyncIterable<LLMStreamChunk> {
    const result = await this.generate(input);
    yield { delta: result.content };
    yield { delta: '', done: true };
  }
}
