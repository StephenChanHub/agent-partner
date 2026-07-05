export class UpdateVoiceProfileDto {
  provider?: 'ELEVENLABS';
  displayName?: string;
  voiceId?: string;
  modelId?: string;
  outputFormat?: string;
  description?: string;
  previewAudioUrl?: string;
  /** Legacy alias during migration from v1.7.1. */
  previewUrl?: string;
  defaultSpeed?: number;
  defaultStability?: number;
  defaultSimilarityBoost?: number;
  status?: 'ACTIVE' | 'PUBLISHED' | 'DISABLED' | 'ARCHIVED';
  isDefault?: boolean;
}
