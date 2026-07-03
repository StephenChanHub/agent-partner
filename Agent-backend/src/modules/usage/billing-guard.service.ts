import { Injectable, ForbiddenException } from '@nestjs/common';
import { PricingRuleService } from '../billing/pricing-rule.service';

@Injectable()
export class BillingGuardService {
  constructor(private readonly pricingRules: PricingRuleService) {}

  private async getMinTextBalance(): Promise<number> {
    return this.pricingRules.numberValue('minimumTextBalance', 100);
  }

  private async getMinVoiceBalance(): Promise<number> {
    return this.pricingRules.numberValue('minimumVoiceBalance', 1000);
  }

  async assertCanStartTextChat(balanceAgentTokens: number): Promise<void> {
    const billingMode = process.env.BILLING_MODE ?? 'TRACK_ONLY';
    if (billingMode !== 'ENFORCE') return;

    const minBalance = await this.getMinTextBalance();
    if (balanceAgentTokens < minBalance) {
      throw new ForbiddenException(
        `余额不足（最低 ${minBalance} Tokens），请充值后继续文字对话。当前余额：${balanceAgentTokens} Tokens`,
      );
    }
  }

  async assertCanStartVoiceChat(balanceAgentTokens: number): Promise<void> {
    const billingMode = process.env.BILLING_MODE ?? 'TRACK_ONLY';
    if (billingMode !== 'ENFORCE') return;

    const minBalance = await this.getMinVoiceBalance();
    if (balanceAgentTokens < minBalance) {
      throw new ForbiddenException(
        `余额不足（最低 ${minBalance} Tokens），语音回复暂不可用。当前余额：${balanceAgentTokens} Tokens`,
      );
    }
  }

  canGenerateVoice(balanceAfterTextCharge: number, estimatedTtsAgentTokens: number) {
    const billingMode = process.env.BILLING_MODE ?? 'TRACK_ONLY';
    if (billingMode !== 'ENFORCE') return true;
    return balanceAfterTextCharge >= estimatedTtsAgentTokens;
  }
}
