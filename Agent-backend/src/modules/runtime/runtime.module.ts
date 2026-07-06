import { Module } from '@nestjs/common';
import { RuntimeController } from './runtime.controller';
import { RuntimeChatController } from './runtime-chat.controller';
import { TempAudioController } from './audio/temp-audio.controller';
import { RuntimeService } from './runtime.service';
import { IntentEngineService } from './intent-engine/intent-engine.service';
import { TaskDispatcherService } from './dispatcher/task-dispatcher.service';
import { ChatEngineService } from './chat-engine/chat-engine.service';
import { RobotEngineService } from './robot-engine/robot-engine.service';
import { SystemEngineService } from './system-engine/system-engine.service';
import { VoiceEngineService } from './voice-engine/voice-engine.service';
import { SkillEngineService } from './skill-engine/skill-engine.service';
import { RuntimeContextBuilder } from './context/runtime-context.builder';
import { PromptAssemblerService } from './prompt/prompt-assembler.service';
import { SessionSummaryService } from './memory/session-summary.service';
import { SkillInjectionService } from './skills/skill-injection.service';
import { BehaviorPolicyRuntimeService } from './policy/behavior-policy-runtime.service';
import { TempAudioService } from './audio/temp-audio.service';
import { LocalTempAudioStorageAdapter } from './audio/local-temp-audio-storage.adapter';
import { TEMP_AUDIO_STORAGE } from './audio/temp-audio-storage.port';
import { UsageModule } from '../usage/usage.module';
import { LLMModule } from '../../infrastructure/llm/llm.module';
import { TTSModule } from '../../infrastructure/tts/tts.module';
import { ModelProfilesModule } from '../model-profiles/model-profiles.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { AppConfigModule } from '../../config/app-config.module';

@Module({
  imports: [UsageModule, LLMModule, TTSModule, ModelProfilesModule, AuthModule, PrismaModule, AppConfigModule],
  controllers: [RuntimeController, RuntimeChatController, TempAudioController],
  providers: [
    RuntimeService,
    IntentEngineService,
    TaskDispatcherService,
    ChatEngineService,
    RobotEngineService,
    SystemEngineService,
    VoiceEngineService,
    SkillEngineService,
    RuntimeContextBuilder,
    PromptAssemblerService,
    SessionSummaryService,
    SkillInjectionService,
    BehaviorPolicyRuntimeService,
    TempAudioService,
    LocalTempAudioStorageAdapter,
    { provide: TEMP_AUDIO_STORAGE, useExisting: LocalTempAudioStorageAdapter },
  ],
  exports: [RuntimeService],
})
export class RuntimeModule {}
