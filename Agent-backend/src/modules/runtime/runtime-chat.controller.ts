import { Body, Controller, Headers, Post } from '@nestjs/common';
import { RuntimeService } from './runtime.service';
import { TextChatDto } from './dto/text-chat.dto';
import { VoiceChatDto } from './dto/voice-chat.dto';

@Controller()
export class RuntimeChatController {
  constructor(private readonly runtime: RuntimeService) {}

  @Post('chat')
  textChat(@Body() dto: TextChatDto, @Headers('authorization') authorization?: string) {
    return this.runtime.handleTextChat(dto, authorization);
  }

  @Post('voice')
  voiceChat(@Body() dto: VoiceChatDto, @Headers('authorization') authorization?: string) {
    return this.runtime.handleVoiceChat(dto, authorization);
  }
}
