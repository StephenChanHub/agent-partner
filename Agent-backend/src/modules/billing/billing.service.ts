import { Injectable } from '@nestjs/common';
import { PricingRuleService } from './pricing-rule.service';

@Injectable()
export class BillingService {
  constructor(private readonly pricingRules: PricingRuleService) {}

  pricing() {
    const agentTokensPerRmb = this.pricingRules.numberValue('agentTokensPerRmb', 1000);
    const billingMultiplier = this.pricingRules.numberValue('billingMultiplier', 1.5);
    const textMin = this.pricingRules.numberValue('minimumTextBalance', 100);
    const voiceMin = this.pricingRules.numberValue('minimumVoiceBalance', 1000);
    const voiceReplyMaxChars = this.pricingRules.numberValue('voiceReplyMaxChars', 200);
    const cacheHitInputRmbPerMillion = this.pricingRules.numberValue('deepseek.cacheHitInputRmbPerMillion', 0.02);
    const cacheMissInputRmbPerMillion = this.pricingRules.numberValue('deepseek.cacheMissInputRmbPerMillion', 1);
    const outputRmbPerMillion = this.pricingRules.numberValue('deepseek.outputRmbPerMillion', 2);
    const ttsRmbPer100kCharacters = this.pricingRules.numberValue('elevenlabs.ttsRmbPer100kChars', 35);

    return {
      currency: 'AGENT_TOKENS',
      agentTokensPerRmb,
      billingMultiplier,
      minimumTextBalance: textMin,
      minimumVoiceBalance: voiceMin,
      minimumBalance: { text: textMin, voice: voiceMin },
      voiceReplyMaxChars,
      llm: {
        provider: 'deepseek',
        mode: process.env.LLM_PROVIDER ?? 'mock',
        inputCacheHitRmbPerMillion: cacheHitInputRmbPerMillion,
        inputCacheMissRmbPerMillion: cacheMissInputRmbPerMillion,
        outputRmbPerMillion,
      },
      tts: {
        provider: 'elevenlabs',
        mode: process.env.TTS_PROVIDER ?? 'mock',
        rmbPer100kCharacters: ttsRmbPer100kCharacters,
        chargedAgentTokensPerCharacter: (ttsRmbPer100kCharacters * agentTokensPerRmb * billingMultiplier) / 100000,
      },
    };
  }
}
