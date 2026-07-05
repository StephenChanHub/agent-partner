import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
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
import { BillingGuardService } from '../usage/billing-guard.service';
import { AuthService } from '../auth/auth.service';
import { ModelProfilesService } from '../model-profiles/model-profiles.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import {
  mockAgentSessions,
  mockAgents,
  mockMessages,
  mockTokenTransactions,
  mockUsageRecords,
  mockUsers,
} from '../../mock/mock-data';

@Injectable()
export class RuntimeService {
  constructor(
    private readonly contextBuilder: RuntimeContextBuilder,
    private readonly intentEngine: IntentEngineService,
    private readonly dispatcher: TaskDispatcherService,
    private readonly usageMeter: UsageMeterService,
    private readonly billingGuard: BillingGuardService,
    private readonly auth: AuthService,
    private readonly modelProfiles: ModelProfilesService,
    private readonly prisma: PrismaService,
    @Inject(LLM_PORT) private readonly llm: LLMPort,
    @Inject(TTS_PORT) private readonly tts: TTSPort,
  ) {}

  async handleEvent(dto: CreateRuntimeEventDto) {
    const context = await this.contextBuilder.build(dto);
    const intent = await this.intentEngine.analyze(context);
    const actions = await this.dispatcher.dispatch(context, intent);
    return { intent, actions };
  }

  async handleTextChat(dto: TextChatDto, authorization?: string) {
    // 1. Authenticate user
    const user = await this.auth.resolveUserFromAuthorization(authorization);
    if (!user) {
      throw new UnauthorizedException('请先登录后再发送消息。');
    }
    const userId = user.id;
    const currentBalance = Number(user.balanceTokens ?? 0);

    // 2. Resolve agent
    const agentSlug = dto.agentSlug || 'jarvis';
    let agent: any;
    if (this.prisma.isMockMode) {
      agent = mockAgents.find((a: any) => a.slug === agentSlug) || mockAgents[0];
    } else {
      agent = await (this.prisma.db as any).agent.findUnique({
        where: { slug: agentSlug },
        include: { publishedVersion: true },
      });
    }
    if (!agent) {
      // Fallback to mock agent for sandbox resilience
      agent = mockAgents[0];
    }

    // Extract config prompt from agent manifest (user never sees this)
    const manifest = agent.manifest ?? agent.publishedVersion?.manifest ?? {};
    const configPrompt: string =
      manifest?.config?.prompt ||
      manifest?.prompt?.system ||
      '你是 Jarvis，一个冷静、直接、可靠的私人 AI 助手。回答时先给结论，再给步骤。';

    // 3. Resolve default model profile
    const modelProfile = await this.modelProfiles.getDefault();
    const apiKey = modelProfile?.apiKey ?? '';
    const modelName = modelProfile?.modelName || 'deepseek-chat';
    const baseUrl =
      modelProfile?.baseUrl?.trim() ||
      (/^gemini-/i.test(modelName)
        ? 'https://generativelanguage.googleapis.com'
        : 'https://api.deepseek.com');
    const temperature = modelProfile?.defaultTemperature ?? 0.7;
    const maxTokens = modelProfile?.defaultMaxTokens ?? 512;

    // 4. Check balance
    await this.billingGuard.assertCanStartTextChat(currentBalance);

    // 5. Get/create agent session
    let session: any;
    if (this.prisma.isMockMode) {
      session = mockAgentSessions.find(
        (s: any) => s.userId === userId && s.agentSlug === agentSlug,
      );
      if (!session) {
        session = {
          id: `session_${Date.now()}`,
          userId,
          agentId: agent.id || 'agent_jarvis',
          agentSlug,
          title: agent.manifest?.identity?.name ?? agentSlug,
          summary: '',
          messageCount: 0,
          lastMessageAt: null,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        mockAgentSessions.push(session);
      }
    } else {
      session = await (this.prisma.db as any).agentSession.upsert({
        where: { userId_agentId: { userId, agentId: agent.id } },
        create: {
          userId,
          agentId: agent.id,
          title: manifest?.identity?.name ?? agentSlug,
          status: 'ACTIVE',
        },
        update: {},
      });
    }

    // 6. Build message history from DB
    const historyMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    if (this.prisma.isMockMode) {
      const sessionMsgs = mockMessages
        .filter((m: any) => m.agentSessionId === session.id)
        .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      for (const m of sessionMsgs) {
        if (m.role === 'USER' || m.role === 'user') {
          historyMessages.push({ role: 'user', content: m.content });
        } else if (m.role === 'ASSISTANT' || m.role === 'assistant') {
          historyMessages.push({ role: 'assistant', content: m.content });
        }
      }
    } else {
      const dbMessages = await (this.prisma.db as any).message.findMany({
        where: { agentSessionId: session.id },
        orderBy: { createdAt: 'asc' },
        take: 20,
      });
      for (const m of dbMessages) {
        if (m.role === 'USER') {
          historyMessages.push({ role: 'user', content: m.content });
        } else if (m.role === 'ASSISTANT') {
          historyMessages.push({ role: 'assistant', content: m.content });
        }
      }
    }

    // 7. Call LLM
    const llmResult = await this.llm.generate({
      systemPrompt: configPrompt,
      messages: historyMessages,
      userMessage: dto.message,
      temperature,
      maxOutputTokens: maxTokens,
      apiKey,
      baseUrl,
      model: modelName,
    });

    // 8. Calculate usage with tiered pricing + real cost tracking
    const inputTokens = llmResult.usage?.inputTokens ?? 0;
    const outputTokens = llmResult.usage?.outputTokens ?? 0;
    const usage = await this.usageMeter.fromDetailedLLM(inputTokens, outputTokens, 0);
    const costTokens = usage.costTokens;

    // 9. Atomic deduction
    const newBalance = Math.max(currentBalance - costTokens, 0);
    const newUsedTokens = Number(user.usedTokens ?? 0) + costTokens;

    if (this.prisma.isMockMode) {
      const mockUser = mockUsers.find((u: any) => u.id === userId);
      if (mockUser) {
        mockUser.balanceTokens = newBalance;
        mockUser.usedTokens = newUsedTokens;
      }

      const usageRecord = {
        id: `usage_${Date.now()}`,
        userId,
        userEmail: user.email ?? '',
        agentId: agent.id ?? 'agent_jarvis',
        agentSlug,
        mode: 'TEXT',
        provider: llmResult.provider,
        model: llmResult.model,
        inputTokens,
        outputTokens,
        totalTokens: usage.totalTokens,
        ttsCharacters: 0,
        costTokens,
        rawCostCny: usage.rawCostCny,
        profitRatio: usage.profitRatio,
        isLoss: usage.isLoss,
        createdAt: new Date().toISOString(),
      };
      mockUsageRecords.push(usageRecord);

      const txn = {
        id: `txn_usage_${Date.now()}`,
        userId,
        userEmail: user.email ?? '',
        type: 'USAGE',
        direction: 'DEBIT',
        amountTokens: costTokens,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        relatedOrderId: null,
        relatedUsageRecordId: usageRecord.id,
        operatorAdminId: null,
        description: `Chat with ${agentSlug}`,
        createdAt: new Date().toISOString(),
      };
      mockTokenTransactions.push(txn);
    } else {
      await (this.prisma.db as any).$transaction(async (tx: any) => {
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            balanceTokens: { decrement: costTokens },
            usedTokens: { increment: costTokens },
          },
        });

        const usageRecord = await tx.usageRecord.create({
          data: {
            userId,
            agentId: agent.id,
            agentSessionId: session.id,
            modelProfileId: modelProfile?.id ?? null,
            type: 'LLM_USAGE',
            inputTokens,
            outputTokens,
            totalTokens: inputTokens + outputTokens,
            costTokens,
            rawCostCny: usage.rawCostCny ?? 0,
            billingMultiplier: usage.profitRatio ?? 1.5,
            pricingSnapshot: { tier: usage.tier, tierSize: usage.tierSize, isLoss: usage.isLoss },
          },
        });

        await tx.agentTokenTransaction.create({
          data: {
            userId,
            type: 'USAGE',
            direction: 'DEBIT',
            amountTokens: BigInt(costTokens),
            balanceBefore: BigInt(currentBalance),
            balanceAfter: BigInt(updatedUser.balanceTokens),
            relatedUsageRecordId: usageRecord.id,
            description: `Chat with ${agentSlug}`,
          },
        });
      });
    }

    // 10. Save messages
    const now = Date.now();
    const userMsgId = `msg_user_${now}`;
    const assistantMsgId = `msg_assistant_${now}`;

    if (this.prisma.isMockMode) {
      mockMessages.push({
        id: userMsgId,
        agentSessionId: session.id,
        role: 'USER',
        content: dto.message,
        metadata: {},
        createdAt: new Date().toISOString(),
      });
      mockMessages.push({
        id: assistantMsgId,
        agentSessionId: session.id,
        role: 'ASSISTANT',
        content: llmResult.content,
        metadata: { usage: { inputTokens, outputTokens, costTokens } },
        createdAt: new Date().toISOString(),
      });
    } else {
      await (this.prisma.db as any).message.createMany({
        data: [
          {
            id: userMsgId,
            agentSessionId: session.id,
            role: 'USER',
            content: dto.message,
            metadata: {},
          },
          {
            id: assistantMsgId,
            agentSessionId: session.id,
            role: 'ASSISTANT',
            content: llmResult.content,
            metadata: { usage: { inputTokens, outputTokens, costTokens } },
          },
        ],
      });
    }

    // 11. Update session
    if (this.prisma.isMockMode) {
      session.messageCount = (session.messageCount ?? 0) + 2;
      session.lastMessageAt = new Date().toISOString();
      session.updatedAt = new Date().toISOString();
    } else {
      await (this.prisma.db as any).agentSession.update({
        where: { id: session.id },
        data: {
          messageCount: { increment: 2 },
          lastMessageAt: new Date(),
        },
      });
    }

    // 12. Return response
    return {
      sessionId: session.id,
      userMessage: {
        id: userMsgId,
        role: 'user',
        content: dto.message,
        inputMode: 'text',
      },
      assistantMessage: {
        id: assistantMsgId,
        role: 'assistant',
        content: llmResult.content,
        responseMode: 'text',
      },
      ...(llmResult.errorCode ? { llmError: { code: llmResult.errorCode } } : {}),
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        costAgentTokens: costTokens,
        tier: usage.tier,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        provider: llmResult.provider,
        model: llmResult.model,
        // Profit tracking (backend only — not shown to users)
        profit: {
          rawCostCny: usage.rawCostCny,
          profitRatio: usage.profitRatio,
          isLoss: usage.isLoss,
        },
      },
      mode: llmResult.provider === 'deepseek' ? 'live' : 'mock',
    };
  }

  async handleVoiceChat(dto: VoiceChatDto, authorization?: string) {
    const transcript = dto.mockText ?? 'Jarvis mock voice input';
    const textResult = await this.handleTextChat(
      {
        agentSlug: dto.agentSlug,
        sessionId: dto.sessionId,
        message: transcript,
        client: dto.client,
      },
      authorization,
    );

    const ttsResult = await this.tts.synthesize({
      text: textResult.assistantMessage.content,
      format: 'mp3',
    });

    const ttsUsage = await this.usageMeter.fromTtsUsage(textResult.assistantMessage.content.length);
    const audioId = `mock-audio-${Date.now()}`;

    return {
      sessionId: textResult.sessionId,
      transcript,
      userMessage: { ...textResult.userMessage, inputMode: 'voice' },
      assistantMessage: { ...textResult.assistantMessage, responseMode: 'voice' },
      audio: {
        messageId: textResult.assistantMessage.id,
        tempUrl: ttsResult.audioUrl?.startsWith('mock://')
          ? `/runtime/audio/temp/${audioId}`
          : ttsResult.audioUrl,
        mimeType: ttsResult.mimeType,
        storagePolicy:
          dto.client === 'device' ? 'PLAY_AND_DISCARD' : 'CLIENT_CACHE_OPTIONAL',
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
