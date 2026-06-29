export class UpdateModelProfileDto {
  displayName?: string;
  modelName?: string;
  baseUrl?: string;
  apiKey?: string;
  defaultTemperature?: number;
  defaultMaxTokens?: number;
  defaultTimeoutMs?: number;
  status?: 'ACTIVE' | 'DISABLED' | 'ARCHIVED';
  isDefault?: boolean;
}
