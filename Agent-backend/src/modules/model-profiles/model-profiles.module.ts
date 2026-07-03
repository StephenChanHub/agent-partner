import { Module } from '@nestjs/common';
import { ModelProfilesController } from './model-profiles.controller';
import { ModelProfilesService } from './model-profiles.service';
import { ModelProfileRepository } from './repositories/model-profile.repository';
import { CryptoModule } from '../../infrastructure/crypto/crypto.module';
import { PrismaModule } from '../../infrastructure/database/prisma.module';

@Module({
  imports: [CryptoModule, PrismaModule],
  controllers: [ModelProfilesController],
  providers: [ModelProfilesService, ModelProfileRepository],
  exports: [ModelProfilesService],
})
export class ModelProfilesModule {}
