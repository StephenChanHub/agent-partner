export interface LLMGenerateInput {
  systemPrompt: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  userMessage: string;
  temperature?: number;
  maxOutputTokens?: number;
  traceId?: string;
  /** Admin-configured model profile overrides (from DB or mock). */
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export type LLMErrorCode = 'NETWORK_ERROR' | 'QUOTA_EXCEEDED' | 'NO_RESPONSE';

export interface LLMGenerateResult {
  content: string;
  provider: string;
  model: string;
  errorCode?: LLMErrorCode;
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
