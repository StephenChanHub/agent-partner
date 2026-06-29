import { Injectable } from '@nestjs/common';
import { LLMGenerateInput, LLMGenerateResult, LLMPort, LLMStreamChunk } from './llm.port';

@Injectable()
export class GeminiLLMAdapter implements LLMPort {
  async generate(input: LLMGenerateInput): Promise<LLMGenerateResult> {
    // v1.5 skeleton: wire Google Gemini SDK in implementation phase.
    return {
      content: `Gemini adapter placeholder: ${input.userMessage}`,
      provider: 'gemini',
      model: 'configured-gemini-model',
    };
  }

  async *stream(input: LLMGenerateInput): AsyncIterable<LLMStreamChunk> {
    yield { delta: `Gemini stream placeholder: ${input.userMessage}` };
    yield { delta: '', done: true };
  }
}
