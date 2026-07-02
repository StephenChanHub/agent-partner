import { Injectable } from '@nestjs/common';
import { mockRechargePackages, mockUsageRecords, mockUsers } from '../../mock/mock-data';
import { AdjustBalanceDto } from './dto/adjust-balance.dto';
import { PricingService } from './pricing.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class UsageService {
  constructor(
    private readonly pricingService: PricingService,
    private readonly prisma: PrismaService,
  ) {}

  async getMyUsage() {
    const demo = mockUsers[0];
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

  getMyUsageRecords() { return { items: mockUsageRecords.filter((record) => record.userId === mockUsers[0].id), page: 1, pageSize: 20, total: 1 }; }

  getAllUsageRecords(query: any = {}) {
    const userId = query.userId;
    return mockUsageRecords.filter((record) => !userId || record.userId === userId);
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
