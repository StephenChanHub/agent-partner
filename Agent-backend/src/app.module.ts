import { Module } from '@nestjs/common';
import { ModelProfilesModule } from './modules/model-profiles/model-profiles.module';
import { VoiceProfilesModule } from './modules/voice-profiles/voice-profiles.module';
import { AppConfigModule } from './config/app-config.module';
import { CacheModule } from './infrastructure/cache/cache.module';
import { DeviceGatewayModule } from './infrastructure/device-gateway/device-gateway.module';
import { LLMModule } from './infrastructure/llm/llm.module';
import { LoggerModule } from './infrastructure/logger/logger.module';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { RobotTransportModule } from './infrastructure/robot-transport/robot-transport.module';
import { STTModule } from './infrastructure/stt/stt.module';
import { TTSModule } from './infrastructure/tts/tts.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AgentsModule } from './modules/agents/agents.module';
import { AgentSessionsModule } from './modules/agent-sessions/agent-sessions.module';
import { MessagesModule } from './modules/messages/messages.module';
import { RuntimeModule } from './modules/runtime/runtime.module';
import { DevicesModule } from './modules/devices/devices.module';
import { RobotModule } from './modules/robot/robot.module';
import { StudioModule } from './modules/studio/studio.module';
import { SystemModule } from './modules/system/system.module';
import { UsageModule } from './modules/usage/usage.module';
import { BillingModule } from './modules/billing/billing.module';

@Module({
  imports: [
    AppConfigModule,
    LoggerModule,
    PrismaModule,
    CacheModule,
    LLMModule,
    TTSModule,
    STTModule,
    DeviceGatewayModule,
    RobotTransportModule,
    AuthModule,
    UsersModule,
    AgentsModule,
    AgentSessionsModule,
    MessagesModule,
    RuntimeModule,
    DevicesModule,
    RobotModule,
    StudioModule,
    SystemModule,
    ModelProfilesModule,
    VoiceProfilesModule,
    UsageModule,
    BillingModule,
  ],
})
export class AppModule {}
