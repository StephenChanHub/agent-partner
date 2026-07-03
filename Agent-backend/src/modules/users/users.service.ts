import { Injectable, NotFoundException } from '@nestjs/common';
import { mockAdmin, mockRechargeOrders, mockTokenTransactions, mockUsageRecords, mockUsers } from '../../mock/mock-data';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  async me(authorization?: string) {
    const principal = this.auth.verifyAuthorization(authorization);
    if (principal?.role === 'ADMIN') return { ...mockAdmin, email: principal.email };

    const authorized = await this.auth.resolveUserFromAuthorization(authorization);
    if (authorized) return this.auth.serializeUser(authorized as any);

    return mockUsers[0];
  }

  async list(query: any = {}) {
    const keyword = (query.keyword ?? '').toString().toLowerCase();
    if (this.prisma.isMockMode) {
      return mockUsers.filter((user) => !keyword || user.email.toLowerCase().includes(keyword) || user.nickname.toLowerCase().includes(keyword));
    }
    const items = await (this.prisma.db as any).user.findMany({
      where: keyword ? {
        OR: [
          { email: { contains: keyword } },
          { nickname: { contains: keyword } },
        ],
      } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return items.map((item: any) => this.auth.serializeUser(item));
  }

  async get(id: string) {
    if (this.prisma.isMockMode) {
      const user = mockUsers.find((item) => item.id === id);
      if (!user) throw new NotFoundException('User not found');
      return user;
    }
    const user = await (this.prisma.db as any).user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.auth.serializeUser(user);
  }

  async getRechargeOrders(id: string) {
    await this.get(id);
    if (this.prisma.isMockMode) return mockRechargeOrders.filter((item) => item.userId === id);
    return (this.prisma.db as any).rechargeOrder.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' } });
  }

  async getTransactions(id: string) {
    await this.get(id);
    if (this.prisma.isMockMode) return mockTokenTransactions.filter((item) => item.userId === id);
    return (this.prisma.db as any).agentTokenTransaction.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' } });
  }

  async getUsageRecords(id: string) {
    await this.get(id);
    if (this.prisma.isMockMode) return mockUsageRecords.filter((item) => item.userId === id);
    return (this.prisma.db as any).usageRecord.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' } });
  }
}
