import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { AgentSessionsService } from './agent-sessions.service';

@Controller('agent-sessions')
export class AgentSessionsController {
  constructor(private readonly service: AgentSessionsService) {}

  @Get('current')
  current(@Headers('authorization') authorization?: string) {
    return this.service.current(authorization);
  }

  @Post()
  createOrGet(@Body() dto: { agentSlug?: string }, @Headers('authorization') authorization?: string) {
    return this.service.createOrGet(dto.agentSlug ?? 'jarvis', authorization);
  }

  @Get(':sessionId/messages')
  messages(@Param('sessionId') sessionId: string, @Headers('authorization') authorization?: string) {
    return this.service.messages(sessionId, authorization);
  }
}
