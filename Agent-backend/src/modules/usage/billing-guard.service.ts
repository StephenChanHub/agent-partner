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

  private async isEnforce(): Promise<boolean> {
    const envMode = process.env.BILLING_MODE;
    if (envMode === 'TRACK_ONLY') return false;
    if (envMode === 'ENFORCE') return true;
    // Default to ENFORCE — can be overridden by pricing rule
    const ruleValue = await this.pricingRules.numberValue('billingMode', 1); // 1=enforce, 0=track
    return ruleValue !== 0;
  }

  async assertCanStartTextChat(balanceAgentTokens: number): Promise<void> {
    if (!(await this.isEnforce())) return;

    const minBalance = await this.getMinTextBalance();
    if (balanceAgentTokens < minBalance) {
      throw new ForbiddenException(
        `余额不足（最低 ${minBalance} Tokens），请充值后继续文字对话。当前余额：${balanceAgentTokens} Tokens`,
      );
    }
  }

  async assertCanStartVoiceChat(balanceAgentTokens: number): Promise<void> {
    if (!(await this.isEnforce())) return;

    const minBalance = await this.getMinVoiceBalance();
    if (balanceAgentTokens < minBalance) {
      throw new ForbiddenException(
        `余额不足（最低 ${minBalance} Tokens），语音回复暂不可用。当前余额：${balanceAgentTokens} Tokens`,
      );
    }
  }

  canGenerateVoice(balanceAfterTextCharge: number, estimatedTtsAgentTokens: number) {
    // Voice generation cost check is always soft — no async in sync context
    return balanceAfterTextCharge >= estimatedTtsAgentTokens;
  }
}
