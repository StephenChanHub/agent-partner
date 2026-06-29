import { Controller, Get } from '@nestjs/common';
import { ok } from '../../common/api-response';
import { SystemService } from './system.service';

@Controller()
export class SystemController {
  constructor(private readonly service: SystemService) {}

  @Get('health')
  health() {
    return ok(this.service.health());
  }

  @Get('ready')
  ready() {
    return ok(this.service.readiness());
  }

  @Get('studio/health')
  studioHealth() {
    return ok({ ...this.service.health(), surface: 'Jarvis Studio' });
  }
}
