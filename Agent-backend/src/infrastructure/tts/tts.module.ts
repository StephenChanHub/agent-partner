import { Module } from '@nestjs/common';
import { TTS_PORT } from '../../common/tokens';
import { AppConfigModule } from '../../config/app-config.module';
import { AppConfigService } from '../../config/app-config.service';
import { CryptoModule } from '../crypto/crypto.module';
import { ElevenLabsClient } from './elevenlabs.client';
import { ElevenLabsTTSAdapter } from './elevenlabs-tts.adapter';
import { MockTTSAdapter } from './mock-tts.adapter';
import { TtsSettingsService } from './tts-settings.service';

@Module({
  imports: [AppConfigModule, CryptoModule],
  providers: [
    MockTTSAdapter,
    ElevenLabsClient,
    TtsSettingsService,
    ElevenLabsTTSAdapter,
    {
      provide: TTS_PORT,
      inject: [AppConfigService, MockTTSAdapter, ElevenLabsTTSAdapter],
      useFactory: (config: AppConfigService, mock: MockTTSAdapter, elevenlabs: ElevenLabsTTSAdapter) => {
        return config.value.voice.ttsProvider === 'elevenlabs' ? elevenlabs : mock;
      },
    },
  ],
  exports: [TTS_PORT, TtsSettingsService, ElevenLabsClient, ElevenLabsTTSAdapter],
})
export class TTSModule {}
