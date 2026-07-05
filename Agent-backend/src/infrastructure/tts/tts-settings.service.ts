import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import { SecretCryptoService } from '../crypto/secret-crypto.service';

let runtimeElevenLabsApiKey = process.env.ELEVENLABS_API_KEY?.trim() ?? '';

@Injectable()
export class TtsSettingsService {
  constructor(
    private readonly config: AppConfigService,
    private readonly crypto: SecretCryptoService,
  ) {}

  getSettings() {
    const apiKey = this.resolveApiKey();
    return {
      provider: 'elevenlabs' as const,
      apiKeyConfigured: Boolean(apiKey),
      apiKeyMasked: apiKey ? this.crypto.maskSecret(apiKey) : '',
    };
  }

  updateSettings(apiKey: string) {
    runtimeElevenLabsApiKey = apiKey.trim();
    return this.getSettings();
  }

  deleteSettings() {
    runtimeElevenLabsApiKey = '';
    return this.getSettings();
  }

  resolveApiKey(): string {
    return runtimeElevenLabsApiKey || this.config.value.voice.elevenLabsApiKey || '';
  }
}
