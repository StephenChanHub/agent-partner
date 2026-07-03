import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ok, paginated } from '../../common/api-response';
import { VoiceProfilesService } from './voice-profiles.service';
import { CreateVoiceProfileDto } from './dto/create-voice-profile.dto';
import { UpdateVoiceProfileDto } from './dto/update-voice-profile.dto';
import { TestVoiceProfileDto } from './dto/test-voice-profile.dto';

@Controller('studio/voice-profiles')
export class VoiceProfilesController {
  constructor(private readonly service: VoiceProfilesService) {}

  @Get()
  async list(@Query('status') status?: string) {
    const items = await this.service.list({ status });
    return paginated(items, { total: items.length });
  }

  @Post()
  async create(@Body() dto: CreateVoiceProfileDto) { return ok(await this.service.create(dto)); }

  @Get(':id')
  async get(@Param('id') id: string) { return ok(await this.service.get(id)); }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateVoiceProfileDto) { return ok(await this.service.update(id, dto)); }

  @Post(':id/test')
  async test(@Param('id') id: string, @Body() dto: TestVoiceProfileDto) { return ok(await this.service.test(id, dto)); }

  @Post(':id/set-default')
  async setDefault(@Param('id') id: string) { return ok(await this.service.setDefault(id)); }

  @Post(':id/publish')
  async publish(@Param('id') id: string) { return ok(await this.service.publish(id)); }

  @Post(':id/disable')
  async disable(@Param('id') id: string) { return ok(await this.service.disable(id)); }

  @Post(':id/preview-audio')
  async previewAudioUploadReserved(@Param('id') id: string) { return ok(await this.service.previewAudioUploadReserved(id)); }

  @Delete(':id')
  async delete(@Param('id') id: string) { return ok(await this.service.delete(id)); }
}
