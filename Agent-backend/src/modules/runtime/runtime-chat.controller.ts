import { Body, Controller, Post } from '@nestjs/common';
import { RuntimeService } from './runtime.service';
import { TextChatDto } from './dto/text-chat.dto';
import { VoiceChatDto } from './dto/voice-chat.dto';

@Controller()
export class RuntimeChatController {
  constructor(private readonly runtime: RuntimeService) {}

  @Post('chat')
  textChat(@Body() dto: TextChatDto) {
    return this.runtime.handleTextChat(dto);
  }

  @Post('voice')
  voiceChat(@Body() dto: VoiceChatDto) {
    return this.runtime.handleVoiceChat(dto);
  }
}
