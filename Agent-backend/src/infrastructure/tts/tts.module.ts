import { Module } from '@nestjs/common';
import { TTS_PORT } from '../../common/tokens';
import { AppConfigModule } from '../../config/app-config.module';
import { AppConfigService } from '../../config/app-config.service';
import { ElevenLabsTTSAdapter } from './elevenlabs-tts.adapter';
import { MockTTSAdapter } from './mock-tts.adapter';

@Module({
  imports: [AppConfigModule],
  providers: [
    MockTTSAdapter,
    ElevenLabsTTSAdapter,
    {
      provide: TTS_PORT,
      inject: [AppConfigService, MockTTSAdapter, ElevenLabsTTSAdapter],
      useFactory: (config: AppConfigService, mock: MockTTSAdapter, elevenlabs: ElevenLabsTTSAdapter) => {
        return config.value.voice.ttsProvider === 'elevenlabs' ? elevenlabs : mock;
      },
    },
  ],
  exports: [TTS_PORT],
})
export class TTSModule {}
