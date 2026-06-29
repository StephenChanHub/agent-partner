export class CreateVoiceProfileDto {
  provider!: 'MOCK' | 'ELEVENLABS' | 'OPENAI' | 'AZURE' | 'LOCAL' | 'CUSTOM';
  displayName!: string;
  voiceId!: string;
  modelId?: string;
  outputFormat?: string;
  language?: string;
  description?: string;
  previewAudioUrl?: string;
  /** Legacy alias during migration from v1.7.1. */
  previewUrl?: string;
  defaultSpeed?: number;
  defaultStability?: number;
  defaultSimilarityBoost?: number;
  isDefault?: boolean;
}
