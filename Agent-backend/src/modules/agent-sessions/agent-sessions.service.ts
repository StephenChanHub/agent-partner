import { Injectable } from '@nestjs/common';
import { mockAgentSessions, mockMessages, mockSession, mockUsers } from '../../mock/mock-data';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AgentSessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  async current(authorization?: string) {
    const user = await this.auth.resolveUserFromAuthorization(authorization);
    if (!user) return mockSession;

    if (this.prisma.isMockMode) {
      const session = mockAgentSessions.find((s: any) => s.userId === user.id);
      return session ?? mockSession;
    }

    const session = await (this.prisma.db as any).agentSession.findFirst({
      where: { userId: user.id, status: 'ACTIVE' },
      orderBy: { updatedAt: 'desc' },
    });
    return session ?? mockSession;
  }

  async createOrGet(agentSlug: string, authorization?: string) {
    const user = await this.auth.resolveUserFromAuthorization(authorization);
    const slug = agentSlug || 'jarvis';

    if (this.prisma.isMockMode) {
      const existing = mockAgentSessions.find(
        (s: any) => s.userId === user?.id && s.agentSlug === slug,
      );
      if (existing) return existing;
      const session = {
        id: `session_${Date.now()}`,
        userId: user?.id ?? 'user_mock_001',
        agentId: 'agent_jarvis',
        agentSlug: slug,
        title: slug,
        messageCount: 0,
        lastMessageAt: null,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockAgentSessions.push(session);
      return session;
    }

    if (!user) return { ...mockSession, agentSlug: slug };

    const agent = await (this.prisma.db as any).agent.findUnique({ where: { slug } });
    if (!agent) return { ...mockSession, agentSlug: slug };

    return (this.prisma.db as any).agentSession.upsert({
      where: { userId_agentId: { userId: user.id, agentId: agent.id } },
      create: { userId: user.id, agentId: agent.id, title: slug, status: 'ACTIVE' },
      update: {},
    });
  }

  async messages(sessionId: string, authorization?: string) {
    if (this.prisma.isMockMode) {
      const items = mockMessages
        .filter((m: any) => m.agentSessionId === sessionId)
        .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .map((m: any) => ({
          id: m.id,
          role: m.role === 'USER' ? 'user' : 'assistant',
          content: m.content,
          inputMode: m.role === 'USER' ? 'text' : undefined,
          responseMode: m.role === 'ASSISTANT' ? 'text' : undefined,
          createdAt: m.createdAt,
        }));
      return { sessionId, items };
    }

    const dbMessages = await (this.prisma.db as any).message.findMany({
      where: { agentSessionId: sessionId },
      orderBy: { createdAt: 'asc' },
    });
    return {
      sessionId,
      items: dbMessages.map((m: any) => ({
        id: m.id,
        role: m.role === 'USER' ? 'user' : 'assistant',
        content: m.content,
        inputMode: m.role === 'USER' ? 'text' : undefined,
        responseMode: m.role === 'ASSISTANT' ? 'text' : undefined,
        createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
      })),
    };
  }
}
