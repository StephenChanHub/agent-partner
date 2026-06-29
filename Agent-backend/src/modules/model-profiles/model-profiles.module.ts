import { Module } from '@nestjs/common';
import { ModelProfilesController } from './model-profiles.controller';
import { ModelProfilesService } from './model-profiles.service';
import { ModelProfileRepository } from './repositories/model-profile.repository';

@Module({
  controllers: [ModelProfilesController],
  providers: [ModelProfilesService, ModelProfileRepository],
  exports: [ModelProfilesService],
})
export class ModelProfilesModule {}
