import { Injectable } from '@nestjs/common';
import { mockRechargePackages, mockUsageRecords, mockUsers } from '../../mock/mock-data';
import { AdjustBalanceDto } from './dto/adjust-balance.dto';
import { PricingService } from './pricing.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class UsageService {
  constructor(
    private readonly pricingService: PricingService,
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  async getMyUsage(authorization?: string) {
    const authorized = await this.auth.resolveUserFromAuthorization(authorization);
    const demo = (authorized as any) ?? mockUsers[0];
    const pricing = await this.pricingService.getPricing();

    if (this.prisma.isMockMode) {
      return {
        balanceAgentTokens: demo.balanceTokens,
        usedAgentTokens: demo.usedTokens,
        billingMode: process.env.BILLING_MODE ?? 'TRACK_ONLY',
        minimumTextBalance: pricing.minimumTextBalance,
        minimumVoiceBalance: pricing.minimumVoiceBalance,
        canUseTextChat: demo.balanceTokens >= pricing.minimumTextBalance,
        canUseVoiceChat: demo.balanceTokens >= pricing.minimumVoiceBalance,
      };
    }

    const user = await (this.prisma.db as any).user.findFirst({
      where: { OR: [{ id: demo.id }, { email: demo.email }] },
    });
    const balanceAgentTokens = Number(user?.balanceTokens ?? 0);
    const usedAgentTokens = Number(user?.usedTokens ?? 0);
    return {
      balanceAgentTokens,
      usedAgentTokens,
      billingMode: process.env.BILLING_MODE ?? 'TRACK_ONLY',
      minimumTextBalance: pricing.minimumTextBalance,
      minimumVoiceBalance: pricing.minimumVoiceBalance,
      canUseTextChat: balanceAgentTokens >= pricing.minimumTextBalance,
      canUseVoiceChat: balanceAgentTokens >= pricing.minimumVoiceBalance,
    };
  }

  async getPricing() { return this.pricingService.getPricing(); }

  getRechargePackages() { return { packages: mockRechargePackages }; }

  async getMyUsageRecords(authorization?: string) {
    const authorized = await this.auth.resolveUserFromAuthorization(authorization);
    const user = (authorized as any) ?? mockUsers[0];
    return { items: mockUsageRecords.filter((record) => record.userId === user.id), page: 1, pageSize: 20, total: 1 };
  }

  getAllUsageRecords(query: any = {}) {
    const userId = query.userId;
    const page = Math.max(Number(query.page ?? 1), 1);
    const pageSize = Math.max(Number(query.pageSize ?? 10), 1);

    if (this.prisma.isMockMode) {
      const filtered = mockUsageRecords
        .filter((record) => !userId || record.userId === userId)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const start = (page - 1) * pageSize;
      return { items: filtered.slice(start, start + pageSize), total: filtered.length };
    }

    // Real DB mode — delegate to prisma with pagination
    const where = userId ? { userId } : {};
    const [items, total] = [
      (this.prisma.db as any).usageRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (this.prisma.db as any).usageRecord.count({ where }),
    ];
    return { items, total };
  }

  async getUserUsage(userId: string) {
    if (this.prisma.isMockMode) {
      const user = mockUsers.find((item) => item.id === userId);
      return { userId, balanceAgentTokens: user?.balanceTokens ?? 0, usedAgentTokens: user?.usedTokens ?? 0, llmTokens: 1300, ttsCharacters: 100, sttSeconds: 3 };
    }
    const user = await (this.prisma.db as any).user.findUnique({ where: { id: userId } });
    return { userId, balanceAgentTokens: Number(user?.balanceTokens ?? 0), usedAgentTokens: Number(user?.usedTokens ?? 0), llmTokens: 0, ttsCharacters: 0, sttSeconds: 0 };
  }

  getUserUsageRecords(userId: string) {
    const items = mockUsageRecords.filter((record) => record.userId === userId);
    return { userId, items, page: 1, pageSize: 20, total: items.length };
  }

  adjustBalance(userId: string, dto: AdjustBalanceDto) {
    return { deprecated: true, replacement: `/studio/users/${userId}/tokens/adjust`, userId, deltaAgentTokens: dto.deltaAgentTokens ?? dto.deltaTokens, reason: dto.reason };
  }
}
