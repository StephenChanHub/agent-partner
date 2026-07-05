import { LLMErrorCode } from './llm.port';

export function classifyLlmHttpError(status: number, errorText: string): LLMErrorCode {
  const lower = errorText.toLowerCase();

  if (
    status === 429 ||
    status === 402 ||
    lower.includes('quota') ||
    lower.includes('rate limit') ||
    lower.includes('rate_limit') ||
    lower.includes('insufficient_quota') ||
    lower.includes('billing') ||
    lower.includes('exceeded')
  ) {
    return 'QUOTA_EXCEEDED';
  }

  if (status >= 500 || status === 408 || status === 502 || status === 503 || status === 504) {
    return 'NETWORK_ERROR';
  }

  return 'NO_RESPONSE';
}
