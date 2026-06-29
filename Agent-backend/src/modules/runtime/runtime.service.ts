import { Inject, Injectable } from '@nestjs/common';
import { CreateRuntimeEventDto } from './dto/create-runtime-event.dto';
import { RuntimeContextBuilder } from './context/runtime-context.builder';
import { IntentEngineService } from './intent-engine/intent-engine.service';
import { TaskDispatcherService } from './dispatcher/task-dispatcher.service';
import { TextChatDto } from './dto/text-chat.dto';
import { VoiceChatDto } from './dto/voice-chat.dto';
import { LLM_PORT, TTS_PORT } from '../../common/tokens';
import { LLMPort } from '../../infrastructure/llm/llm.port';
import { TTSPort } from '../../infrastructure/tts/tts.port';
import { UsageMeterService } from '../usage/usage-meter.service';

@Injectable()
export class RuntimeService {
  constructor(
    private readonly contextBuilder: RuntimeContextBuilder,
    private readonly intentEngine: IntentEngineService,
    private readonly dispatcher: TaskDispatcherService,
    private readonly usageMeter: UsageMeterService,
    @Inject(LLM_PORT) private readonly llm: LLMPort,
    @Inject(TTS_PORT) private readonly tts: TTSPort,
  ) {}

  async handleEvent(dto: CreateRuntimeEventDto) {
    const context = await this.contextBuilder.build(dto);
    const intent = await this.intentEngine.analyze(context);
    const actions = await this.dispatcher.dispatch(context, intent);
    return { intent, actions };
  }

  async handleTextChat(dto: TextChatDto) {
    const userText = dto.message;
    const llmResult = await this.llm.generate({
      systemPrompt: 'You are Jarvis. This is the v1.6 Runtime Stub.',
      messages: [],
      userMessage: userText,
      temperature: 0.7,
      maxOutputTokens: 512,
    });

    const usage = this.usageMeter.fromDeepSeekUsage(
      llmResult.usage?.inputTokens ?? 1000,
      llmResult.usage?.outputTokens ?? 200,
      0,
    );

    const now = Date.now();
    return {
      sessionId: dto.sessionId ?? 'session_mock_jarvis',
      userMessage: {
        id: `msg_user_${now}`,
        role: 'user',
        content: userText,
        inputMode: 'text',
      },
      assistantMessage: {
        id: `msg_assistant_${now}`,
        role: 'assistant',
        content: llmResult.content,
        responseMode: 'text',
      },
      usage: {
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        totalTokens: usage.totalTokens,
        costAgentTokens: usage.costTokens,
        provider: llmResult.provider,
        model: llmResult.model,
      },
      mode: 'mock-compatible',
    };
  }

  async handleVoiceChat(dto: VoiceChatDto) {
    const transcript = dto.mockText ?? 'Jarvis mock voice input';
    const textResult = await this.handleTextChat({
      agentSlug: dto.agentSlug,
      sessionId: dto.sessionId,
      message: transcript,
      client: dto.client,
    });

    const ttsResult = await this.tts.synthesize({
      text: textResult.assistantMessage.content,
      format: 'mp3',
    });

    const ttsUsage = this.usageMeter.fromTtsUsage(textResult.assistantMessage.content.length);
    const audioId = `mock-audio-${Date.now()}`;

    return {
      sessionId: textResult.sessionId,
      transcript,
      userMessage: { ...textResult.userMessage, inputMode: 'voice' },
      assistantMessage: { ...textResult.assistantMessage, responseMode: 'voice' },
      audio: {
        messageId: textResult.assistantMessage.id,
        tempUrl: ttsResult.audioUrl?.startsWith('mock://') ? `/runtime/audio/temp/${audioId}` : ttsResult.audioUrl,
        mimeType: ttsResult.mimeType,
        storagePolicy: dto.client === 'device' ? 'PLAY_AND_DISCARD' : 'CLIENT_CACHE_OPTIONAL',
        expiresIn: 600,
      },
      usage: {
        ...textResult.usage,
        ttsCharacters: ttsUsage.ttsCharacters,
        ttsCostAgentTokens: ttsUsage.costTokens,
        costAgentTokens: textResult.usage.costAgentTokens + ttsUsage.costTokens,
      },
      mode: 'mock-compatible',
    };
  }
}
