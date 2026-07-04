import { Injectable } from '@nestjs/common';
import { mockTokenTransactions, mockUsers } from '../../mock/mock-data';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AgentTokenTransactionService {
  constructor(private readonly prisma: PrismaService, private readonly auth: AuthService) {}

  async listForCurrentUser(_query: any = {}, authorization?: string) {
    const authorized = await this.auth.resolveUserFromAuthorization(authorization);

    if (this.prisma.isMockMode) {
      const user = (authorized as any) ?? mockUsers[0];
      return mockTokenTransactions.filter((item) => item.userId === user.id);
    }

    const demo = mockUsers[0];
    const user = authorized ?? await (this.prisma.db as any).user.findFirst({
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
      const filtered = mockTokenTransactions
        .filter((item) => !userId || item.userId === userId)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const page = Math.max(Number(query.page ?? 1), 1);
      const pageSize = Math.max(Number(query.pageSize ?? 10), 1);
      const start = (page - 1) * pageSize;
      return { items: filtered.slice(start, start + pageSize), total: filtered.length };
    }

    const page = Math.max(Number(query.page ?? 1), 1);
    const pageSize = Math.max(Number(query.pageSize ?? 10), 1);
    const [items, total] = await Promise.all([
      (this.prisma.db as any).agentTokenTransaction.findMany({
        where: userId ? { userId } : undefined,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (this.prisma.db as any).agentTokenTransaction.count({
        where: userId ? { userId } : undefined,
      }),
    ]);
    return { items: items.map((item: any) => this.serialize(item)), total };
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
