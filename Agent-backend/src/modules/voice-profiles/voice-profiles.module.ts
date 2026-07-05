import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { TTSModule } from '../../infrastructure/tts/tts.module';
import { MediaModule } from '../media/media.module';
import { VoiceProfilesController } from './voice-profiles.controller';
import { VoiceProfilesService } from './voice-profiles.service';
import { VoiceProfileRepository } from './repositories/voice-profile.repository';
import { TtsSettingsController } from './tts-settings.controller';

@Module({
  imports: [PrismaModule, TTSModule, MediaModule],
  controllers: [VoiceProfilesController, TtsSettingsController],
  providers: [VoiceProfilesService, VoiceProfileRepository],
  exports: [VoiceProfilesService],
})
export class VoiceProfilesModule {}
