import { Injectable } from '@nestjs/common';
import { mockRechargePackages, mockUsageRecords, mockUsers } from '../../mock/mock-data';
import { AdjustBalanceDto } from './dto/adjust-balance.dto';
import { PricingService } from './pricing.service';

@Injectable()
export class UsageService {
  constructor(private readonly pricingService: PricingService) {}

  getMyUsage() {
    const user = mockUsers[0];
    return {
      balanceAgentTokens: user.balanceTokens,
      usedAgentTokens: user.usedTokens,
      billingMode: process.env.BILLING_MODE ?? 'TRACK_ONLY',
      minimumTextBalance: Number(process.env.TEXT_CHAT_MIN_BALANCE_AGENT_TOKENS ?? 100),
      minimumVoiceBalance: Number(process.env.VOICE_CHAT_MIN_BALANCE_AGENT_TOKENS ?? 1000),
      canUseTextChat: user.balanceTokens >= Number(process.env.TEXT_CHAT_MIN_BALANCE_AGENT_TOKENS ?? 100),
      canUseVoiceChat: user.balanceTokens >= Number(process.env.VOICE_CHAT_MIN_BALANCE_AGENT_TOKENS ?? 1000),
    };
  }

  getPricing() { return this.pricingService.getPricing(); }

  getRechargePackages() { return { packages: mockRechargePackages }; }

  getMyUsageRecords() { return { items: mockUsageRecords.filter((record) => record.userId === mockUsers[0].id), page: 1, pageSize: 20, total: 1 }; }

  getAllUsageRecords(query: any = {}) {
    const userId = query.userId;
    return mockUsageRecords.filter((record) => !userId || record.userId === userId);
  }

  getUserUsage(userId: string) {
    const user = mockUsers.find((item) => item.id === userId);
    return { userId, balanceAgentTokens: user?.balanceTokens ?? 0, usedAgentTokens: user?.usedTokens ?? 0, llmTokens: 1300, ttsCharacters: 100, sttSeconds: 3 };
  }

  getUserUsageRecords(userId: string) {
    const items = mockUsageRecords.filter((record) => record.userId === userId);
    return { userId, items, page: 1, pageSize: 20, total: items.length };
  }

  adjustBalance(userId: string, dto: AdjustBalanceDto) {
    return { deprecated: true, replacement: `/studio/users/${userId}/tokens/adjust`, userId, deltaAgentTokens: dto.deltaAgentTokens ?? dto.deltaTokens, reason: dto.reason };
  }
}
