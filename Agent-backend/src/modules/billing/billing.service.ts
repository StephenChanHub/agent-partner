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
      'deepseek.cacheHitInputRmbPerMillion': 0.02,
      'deepseek.cacheMissInputRmbPerMillion': 1,
      'deepseek.outputRmbPerMillion': 2,
      'elevenlabs.ttsRmbPer100kChars': 35,
    });

    const agentTokensPerRmb = rules.agentTokensPerRmb;
    const billingMultiplier = rules.billingMultiplier;
    const textMin = rules.minimumTextBalance;
    const voiceMin = rules.minimumVoiceBalance;
    const voiceReplyMaxChars = rules.voiceReplyMaxChars;
    const cacheHitInputRmbPerMillion = rules['deepseek.cacheHitInputRmbPerMillion'];
    const cacheMissInputRmbPerMillion = rules['deepseek.cacheMissInputRmbPerMillion'];
    const outputRmbPerMillion = rules['deepseek.outputRmbPerMillion'];
    const ttsRmbPer100kCharacters = rules['elevenlabs.ttsRmbPer100kChars'];

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
