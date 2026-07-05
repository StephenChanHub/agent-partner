import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import { LLMGenerateInput, LLMGenerateResult, LLMPort, LLMStreamChunk } from './llm.port';
import { classifyLlmHttpError } from './llm-error.util';

/** Regex to detect Gemini models by name. */
const GEMINI_MODEL_RE = /^gemini-/;

function llmFailure(
  errorCode: LLMGenerateResult['errorCode'],
  provider: string,
  model: string,
): LLMGenerateResult {
  return {
    content: '',
    provider,
    model,
    errorCode,
    usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
  };
}

@Injectable()
export class DeepSeekLLMAdapter implements LLMPort {
  constructor(private readonly config: AppConfigService) {}

  async generate(input: LLMGenerateInput): Promise<LLMGenerateResult> {
    const model = input.model || this.config.value.llm.deepSeekModel || 'deepseek-chat';

    // Detect provider from model name — supports Gemini & OpenAI-compatible.
    if (GEMINI_MODEL_RE.test(model)) {
      return this.generateGemini(input, model);
    }
    return this.generateOpenAICompatible(input, model);
  }

  /** Call Gemini API (models/{model}:generateContent). */
  private async generateGemini(input: LLMGenerateInput, model: string): Promise<LLMGenerateResult> {
    const apiKey = input.apiKey || this.config.value.llm.geminiApiKey || '';

    if (!apiKey) {
      console.error('[DeepSeekLLMAdapter] Gemini API key not configured');
      return llmFailure('NO_RESPONSE', 'gemini', model);
    }

    try {
      const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

      // Gemini doesn't have a separate "system" role — prepend as user if needed
      if (input.systemPrompt) {
        contents.push({ role: 'user', parts: [{ text: `[System instruction]\n${input.systemPrompt}` }] });
      }

      for (const msg of input.messages) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          contents.push({ role: msg.role === 'assistant' ? 'model' : 'user', parts: [{ text: msg.content }] });
        }
      }

      contents.push({ role: 'user', parts: [{ text: input.userMessage }] });

      const baseUrl = (input.baseUrl || 'https://generativelanguage.googleapis.com').replace(/\/+$/, '');
      const url = `${baseUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: input.temperature ?? 0.7,
            maxOutputTokens: input.maxOutputTokens ?? 512,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'unknown');
        console.error(`[DeepSeekLLMAdapter] Gemini API error ${response.status}: ${errorText}`);
        return llmFailure(classifyLlmHttpError(response.status, errorText), 'gemini', model);
      }

      const data = await response.json() as any;
      const candidate = data?.candidates?.[0];
      const content = candidate?.content?.parts?.map((p: any) => p.text).join('') ?? '';
      const usage = data?.usageMetadata;

      if (!content) {
        console.error('[DeepSeekLLMAdapter] Empty response from Gemini API');
        return llmFailure('NO_RESPONSE', 'gemini', model);
      }

      return {
        content,
        provider: 'gemini',
        model,
        usage: {
          inputTokens: usage?.promptTokenCount ?? 0,
          outputTokens: usage?.candidatesTokenCount ?? 0,
          totalTokens: (usage?.promptTokenCount ?? 0) + (usage?.candidatesTokenCount ?? 0),
        },
      };
    } catch (error: any) {
      console.error('[DeepSeekLLMAdapter] Gemini connection failed:', error?.message ?? error);
      return llmFailure('NETWORK_ERROR', 'gemini', model);
    }
  }

  /** Call OpenAI-compatible API (Chat Completions). */
  private async generateOpenAICompatible(input: LLMGenerateInput, model: string): Promise<LLMGenerateResult> {
    const apiKey = input.apiKey || this.config.value.llm.deepSeekApiKey;
    const baseUrl = (input.baseUrl || 'https://api.deepseek.com').replace(/\/+$/, '');

    if (!apiKey) {
      return llmFailure('NO_RESPONSE', 'deepseek', model);
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

      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
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
        console.error(`[DeepSeekLLMAdapter] API error ${response.status}: ${errorText}`);
        return llmFailure(classifyLlmHttpError(response.status, errorText), 'deepseek', model);
      }

      const data = await response.json() as any;
      const choice = data?.choices?.[0];
      const content = choice?.message?.content ?? '';

      if (!content) {
        console.error('[DeepSeekLLMAdapter] Empty response from API');
        return llmFailure('NO_RESPONSE', 'deepseek', model);
      }

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
      console.error('[DeepSeekLLMAdapter] Connection failed:', error?.message ?? error);
      return llmFailure('NETWORK_ERROR', 'deepseek', model);
    }
  }

  async *stream(input: LLMGenerateInput): AsyncIterable<LLMStreamChunk> {
    const result = await this.generate(input);
    yield { delta: result.content };
    yield { delta: '', done: true };
  }
}
