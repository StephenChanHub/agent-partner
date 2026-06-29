export class CreateModelProfileDto {
  provider!: 'GEMINI' | 'DEEPSEEK' | 'OPENAI' | 'CLAUDE' | 'CUSTOM';
  displayName!: string;
  modelName!: string;
  baseUrl?: string;
  apiKey?: string;
  defaultTemperature?: number;
  defaultMaxTokens?: number;
  defaultTimeoutMs?: number;
  isDefault?: boolean;
}
