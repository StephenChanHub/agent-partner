import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AgentSessionsService } from './agent-sessions.service';

@Controller('agent-sessions')
export class AgentSessionsController {
  constructor(private readonly service: AgentSessionsService) {}

  @Get('current')
  current() {
    return this.service.current();
  }

  @Post()
  createOrGet(@Body() dto: { agentSlug?: string }) {
    return this.service.createOrGet(dto.agentSlug ?? 'jarvis');
  }

  @Get(':sessionId/messages')
  messages(@Param('sessionId') sessionId: string) {
    return this.service.messages(sessionId);
  }
}
