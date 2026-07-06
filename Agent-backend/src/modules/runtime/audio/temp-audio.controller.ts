import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { TempAudioService } from './temp-audio.service';

@Controller('runtime/audio/temp')
export class TempAudioController {
  constructor(private readonly tempAudio: TempAudioService) {}

  @Get(':audioId')
  async getTempAudio(@Param('audioId') audioId: string, @Res() res: Response) {
    try {
      const audio = await this.tempAudio.readOrThrow(audioId);
      res.setHeader('Content-Type', audio.mimeType);
      res.send(audio.buffer);
    } catch (error) {
      if (error instanceof NotFoundException) {
        res.setHeader('Content-Type', 'audio/mpeg');
        res.send(Buffer.from(`mock audio placeholder: ${audioId}`));
        return;
      }
      throw error;
    }
  }
}
