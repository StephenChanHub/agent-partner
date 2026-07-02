import { Injectable } from '@nestjs/common';
import { mockTokenTransactions, mockUsers } from '../../mock/mock-data';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class AgentTokenTransactionService {
  constructor(private readonly prisma: PrismaService) {}

  async listForCurrentUser(_query: any = {}) {
    if (this.prisma.isMockMode) {
      return mockTokenTransactions.filter((item) => item.userId === mockUsers[0].id);
    }

    const demo = mockUsers[0];
    const user = await (this.prisma.db as any).user.findFirst({
      where: { OR: [{ id: demo.id }, { email: demo.email }] },
    });
    if (!user) return [];

    const items = await (this.prisma.db as any).agentTokenTransaction.findMany({
      where: { userId: user.id },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    return items.map((item: any) => this.serialize(item));
  }

  async listAll(query: any = {}) {
    const userId = query.userId;
    if (this.prisma.isMockMode) {
      return mockTokenTransactions.filter((item) => !userId || item.userId === userId);
    }

    const items = await (this.prisma.db as any).agentTokenTransaction.findMany({
      where: userId ? { userId } : undefined,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    return items.map((item: any) => this.serialize(item));
  }

  private serialize(item: any) {
    return {
      id: item.id,
      userId: item.userId,
      userEmail: item.user?.email ?? item.userEmail ?? '',
      type: item.type,
      direction: item.direction,
      amountTokens: Number(item.amountTokens ?? 0),
      balanceBefore: Number(item.balanceBefore ?? 0),
      balanceAfter: Number(item.balanceAfter ?? 0),
      relatedOrderId: item.relatedOrderId ?? null,
      relatedUsageRecordId: item.relatedUsageRecordId ?? null,
      operatorAdminId: item.operatorAdminId ?? null,
      description: item.description ?? '',
      metadata: item.metadata ?? null,
      createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
    };
  }
}
