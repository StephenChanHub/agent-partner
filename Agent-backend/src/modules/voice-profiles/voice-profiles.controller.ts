import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ok, paginated } from '../../common/api-response';
import { VoiceProfilesService } from './voice-profiles.service';
import { CreateVoiceProfileDto } from './dto/create-voice-profile.dto';
import { UpdateVoiceProfileDto } from './dto/update-voice-profile.dto';
import { TestVoiceProfileDto } from './dto/test-voice-profile.dto';

@Controller('studio/voice-profiles')
export class VoiceProfilesController {
  constructor(private readonly service: VoiceProfilesService) {}

  @Get()
  list(@Query('status') status?: string) {
    const items = this.service.list({ status });
    return paginated(items, { total: items.length });
  }

  @Post()
  create(@Body() dto: CreateVoiceProfileDto) { return ok(this.service.create(dto)); }

  @Get(':id')
  get(@Param('id') id: string) { return ok(this.service.get(id)); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVoiceProfileDto) { return ok(this.service.update(id, dto)); }

  @Post(':id/test')
  test(@Param('id') id: string, @Body() dto: TestVoiceProfileDto) { return ok(this.service.test(id, dto)); }

  @Post(':id/set-default')
  setDefault(@Param('id') id: string) { return ok(this.service.setDefault(id)); }

  @Post(':id/publish')
  publish(@Param('id') id: string) { return ok(this.service.publish(id)); }

  @Post(':id/disable')
  disable(@Param('id') id: string) { return ok(this.service.disable(id)); }

  @Post(':id/preview-audio')
  previewAudioUploadReserved(@Param('id') id: string) { return ok(this.service.previewAudioUploadReserved(id)); }
}
