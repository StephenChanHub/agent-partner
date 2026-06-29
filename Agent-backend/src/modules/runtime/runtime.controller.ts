import { Body, Controller, Post } from '@nestjs/common';
import { RuntimeService } from './runtime.service';
import { CreateRuntimeEventDto } from './dto/create-runtime-event.dto';

@Controller('runtime')
export class RuntimeController {
  constructor(private readonly runtime: RuntimeService) {}

  @Post('events')
  handleEvent(@Body() dto: CreateRuntimeEventDto) {
    return this.runtime.handleEvent(dto);
  }
}
