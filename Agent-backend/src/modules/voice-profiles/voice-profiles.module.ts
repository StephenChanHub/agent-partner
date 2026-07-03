import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { VoiceProfilesController } from './voice-profiles.controller';
import { VoiceProfilesService } from './voice-profiles.service';
import { VoiceProfileRepository } from './repositories/voice-profile.repository';

@Module({
  imports: [PrismaModule],
  controllers: [VoiceProfilesController],
  providers: [VoiceProfilesService, VoiceProfileRepository],
  exports: [VoiceProfilesService],
})
export class VoiceProfilesModule {}
