import { Body, Controller, Delete, Get, Patch } from '@nestjs/common';
import { ok } from '../../common/api-response';
import { TtsSettingsService } from '../../infrastructure/tts/tts-settings.service';
import { UpdateTtsSettingsDto } from './dto/update-tts-settings.dto';

@Controller('studio/tts/settings')
export class TtsSettingsController {
  constructor(private readonly ttsSettings: TtsSettingsService) {}

  @Get()
  get() {
    return ok(this.ttsSettings.getSettings());
  }

  @Patch()
  update(@Body() dto: UpdateTtsSettingsDto) {
    return ok(this.ttsSettings.updateSettings(dto.apiKey));
  }

  @Delete()
  delete() {
    return ok(this.ttsSettings.deleteSettings());
  }
}
