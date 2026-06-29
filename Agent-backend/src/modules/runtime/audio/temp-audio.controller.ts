import { Controller, Get, Header, Param } from '@nestjs/common';

@Controller('runtime/audio/temp')
export class TempAudioController {
  @Get(':audioId')
  @Header('Content-Type', 'audio/mpeg')
  getTempAudio(@Param('audioId') audioId: string) {
    // v1.6 Mock: return a tiny placeholder buffer. Real temp audio storage is implemented later.
    return Buffer.from(`mock audio placeholder: ${audioId}`);
  }
}
