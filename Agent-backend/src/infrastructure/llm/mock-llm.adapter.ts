import { Injectable } from '@nestjs/common';
import { LLMGenerateInput, LLMGenerateResult, LLMPort, LLMStreamChunk } from './llm.port';

@Injectable()
export class MockLLMAdapter implements LLMPort {
  async generate(input: LLMGenerateInput): Promise<LLMGenerateResult> {
    return {
      content: `Mock response: ${input.userMessage}`,
      provider: 'mock',
      model: 'mock-llm',
      usage: { inputTokens: 1000, outputTokens: 200, totalTokens: 1200 },
    };
  }

  async *stream(input: LLMGenerateInput): AsyncIterable<LLMStreamChunk> {
    yield { delta: 'Mock ' };
    yield { delta: 'stream: ' };
    yield { delta: input.userMessage };
    yield { delta: '', done: true };
  }
}
