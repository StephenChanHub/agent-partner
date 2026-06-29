import { Module } from '@nestjs/common';
import { AgentSessionsController } from './agent-sessions.controller';
import { AgentSessionsService } from './agent-sessions.service';

@Module({
  controllers: [AgentSessionsController],
  providers: [AgentSessionsService],
  exports: [AgentSessionsService],
})
export class AgentSessionsModule {}
