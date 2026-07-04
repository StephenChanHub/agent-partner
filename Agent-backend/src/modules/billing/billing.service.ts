import { Injectable } from '@nestjs/common';
import { PricingRuleService } from './pricing-rule.service';

@Injectable()
export class BillingService {
  constructor(private readonly pricingRules: PricingRuleService) {}

  async pricing() {
    const rules = await this.pricingRules.valuesByKey({
      agentTokensPerRmb: 1000,
      billingMultiplier: 1.5,
      minimumTextBalance: 100,
      minimumVoiceBalance: 1000,
      voiceReplyMaxChars: 200,
      // Tiered pricing
      textChatBaseTokens: 1,
      textChatTierTokens: 8000,
      textChatExtraCharge: 1,
      voiceChatBaseTokens: 3,
      voiceChatTierChars: 1500,
      voiceChatExtraCharge: 1,
      minProfitRatio: 1.5,
      // Real-cost reference (for profit tracking)
      'deepseek.cacheHitInputRmbPerMillion': 0.02,
      'deepseek.cacheMissInputRmbPerMillion': 1,
      'deepseek.outputRmbPerMillion': 2,
      'elevenlabs.ttsRmbPer100kChars': 35,
    });

    return {
      currency: 'AGENT_TOKENS',
      agentTokensPerRmb: rules.agentTokensPerRmb,
      billingMultiplier: rules.billingMultiplier,
      minimumTextBalance: rules.minimumTextBalance,
      minimumVoiceBalance: rules.minimumVoiceBalance,
      minimumBalance: { text: rules.minimumTextBalance, voice: rules.minimumVoiceBalance },
      voiceReplyMaxChars: rules.voiceReplyMaxChars,
      // Tiered pricing (user-facing)
      textChat: {
        baseTokens: rules.textChatBaseTokens,
        tierTokens: rules.textChatTierTokens,
        extraCharge: rules.textChatExtraCharge,
      },
      voiceChat: {
        baseTokens: rules.voiceChatBaseTokens,
        tierChars: rules.voiceChatTierChars,
        extraCharge: rules.voiceChatExtraCharge,
      },
      minProfitRatio: rules.minProfitRatio,
      // Real-cost reference rates
      llm: {
        provider: 'deepseek',
        mode: process.env.LLM_PROVIDER ?? 'deepseek',
        inputCacheHitRmbPerMillion: rules['deepseek.cacheHitInputRmbPerMillion'],
        inputCacheMissRmbPerMillion: rules['deepseek.cacheMissInputRmbPerMillion'],
        outputRmbPerMillion: rules['deepseek.outputRmbPerMillion'],
      },
      tts: {
        provider: 'elevenlabs',
        mode: process.env.TTS_PROVIDER ?? 'mock',
        rmbPer100kCharacters: rules['elevenlabs.ttsRmbPer100kChars'],
      },
    };
  }
}
