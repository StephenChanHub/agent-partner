import { Controller, Get } from '@nestjs/common';
import { ok } from '../../common/api-response';
import { StudioService } from './studio.service';

@Controller('studio')
export class StudioController {
  constructor(private readonly service: StudioService) {}

  @Get('dashboard')
  dashboard() {
    return ok(this.service.dashboard());
  }
}
