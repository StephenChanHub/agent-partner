import { Module } from '@nestjs/common';
import { AgentSessionsController } from './agent-sessions.controller';
import { AgentSessionsService } from './agent-sessions.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../infrastructure/database/prisma.module';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [AgentSessionsController],
  providers: [AgentSessionsService],
  exports: [AgentSessionsService],
})
export class AgentSessionsModule {}
