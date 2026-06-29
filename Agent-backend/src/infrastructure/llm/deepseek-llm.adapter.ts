import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import { LLMGenerateInput, LLMGenerateResult, LLMPort, LLMStreamChunk } from './llm.port';

@Injectable()
export class DeepSeekLLMAdapter implements LLMPort {
  constructor(private readonly config: AppConfigService) {}

  async generate(input: LLMGenerateInput): Promise<LLMGenerateResult> {
    const { deepSeekApiKey, deepSeekModel } = this.config.value.llm;

    if (!deepSeekApiKey) {
      // v1.6 placeholder behavior: keep API usable until the real key is configured.
      return {
        content: `Mock DeepSeek response: ${input.userMessage}`,
        provider: 'mock-deepseek-placeholder',
        model: deepSeekModel,
        usage: { inputTokens: 1000, outputTokens: 200, totalTokens: 1200 },
      };
    }

    // TODO(v1.7): call DeepSeek API here.
    // The adapter boundary is ready; Runtime must never call DeepSeek SDK/HTTP directly.
    return {
      content: `DeepSeek adapter placeholder: ${input.userMessage}`,
      provider: 'deepseek',
      model: deepSeekModel,
      usage: { inputTokens: 1000, outputTokens: 200, totalTokens: 1200 },
    };
  }

  async *stream(input: LLMGenerateInput): AsyncIterable<LLMStreamChunk> {
    const result = await this.generate(input);
    yield { delta: result.content };
    yield { delta: '', done: true };
  }
}
