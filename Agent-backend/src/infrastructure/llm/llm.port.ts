export interface LLMGenerateInput {
  systemPrompt: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  userMessage: string;
  temperature?: number;
  maxOutputTokens?: number;
  traceId?: string;
}

export interface LLMGenerateResult {
  content: string;
  provider: string;
  model: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
}

export interface LLMStreamChunk {
  delta: string;
  done?: boolean;
}

export interface LLMPort {
  generate(input: LLMGenerateInput): Promise<LLMGenerateResult>;
  stream(input: LLMGenerateInput): AsyncIterable<LLMStreamChunk>;
}
