import { Injectable, ForbiddenException } from '@nestjs/common';

@Injectable()
export class BillingGuardService {
  private readonly billingMode = process.env.BILLING_MODE ?? 'TRACK_ONLY';
  private readonly minTextBalance = Number(process.env.TEXT_CHAT_MIN_BALANCE_AGENT_TOKENS ?? 100);
  private readonly minVoiceBalance = Number(process.env.VOICE_CHAT_MIN_BALANCE_AGENT_TOKENS ?? 1000);

  async assertCanStartTextChat(balanceAgentTokens: number): Promise<void> {
    if (this.billingMode !== 'ENFORCE') return;
    if (balanceAgentTokens < this.minTextBalance) {
      throw new ForbiddenException('余额不足，请充值后继续文字对话。');
    }
  }

  async assertCanStartVoiceChat(balanceAgentTokens: number): Promise<void> {
    if (this.billingMode !== 'ENFORCE') return;
    if (balanceAgentTokens < this.minVoiceBalance) {
      throw new ForbiddenException('余额不足，语音回复暂不可用。');
    }
  }

  canGenerateVoice(balanceAfterTextCharge: number, estimatedTtsAgentTokens: number) {
    if (this.billingMode !== 'ENFORCE') return true;
    return balanceAfterTextCharge >= estimatedTtsAgentTokens;
  }
}
