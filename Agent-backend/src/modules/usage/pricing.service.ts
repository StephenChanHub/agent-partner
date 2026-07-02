import { Injectable } from '@nestjs/common';
import { PricingRuleService } from '../billing/pricing-rule.service';

@Injectable()
export class PricingService {
  constructor(private readonly pricingRules: PricingRuleService) {}

  async getPricing() {
    const rules = await this.pricingRules.valuesByKey({
      agentTokensPerRmb: Number(process.env.AGENT_TOKENS_PER_RMB ?? 1000),
      billingMultiplier: Number(process.env.BILLING_MULTIPLIER ?? 1.5),
      minimumTextBalance: Number(process.env.TEXT_CHAT_MIN_BALANCE_AGENT_TOKENS ?? 100),
      minimumVoiceBalance: Number(process.env.VOICE_CHAT_MIN_BALANCE_AGENT_TOKENS ?? 1000),
      voiceReplyMaxChars: Number(process.env.VOICE_REPLY_MAX_CHARS ?? 200),
      'deepseek.cacheHitInputRmbPerMillion': Number(process.env.DEEPSEEK_INPUT_CACHE_HIT_RMB_PER_MILLION ?? 0.02),
      'deepseek.cacheMissInputRmbPerMillion': Number(process.env.DEEPSEEK_INPUT_CACHE_MISS_RMB_PER_MILLION ?? 1),
      'deepseek.outputRmbPerMillion': Number(process.env.DEEPSEEK_OUTPUT_RMB_PER_MILLION ?? 2),
      'elevenlabs.ttsRmbPer100kChars': Number(process.env.ELEVENLABS_TTS_RMB_PER_100K_CHARS ?? 35),
    });

    const agentTokensPerRmb = rules.agentTokensPerRmb;
    const billingMultiplier = rules.billingMultiplier;
    const cacheHitInputRmbPerMillion = rules['deepseek.cacheHitInputRmbPerMillion'];
    const cacheMissInputRmbPerMillion = rules['deepseek.cacheMissInputRmbPerMillion'];
    const outputRmbPerMillion = rules['deepseek.outputRmbPerMillion'];
    const ttsRmbPer100kChars = rules['elevenlabs.ttsRmbPer100kChars'];

    return {
      currencyName: 'Agent Tokens',
      agentTokensPerRmb,
      billingMultiplier,
      minimumTextBalance: rules.minimumTextBalance,
      minimumVoiceBalance: rules.minimumVoiceBalance,
      voiceReplyMaxChars: rules.voiceReplyMaxChars,
      rawRates: {
        deepseek: { cacheHitInputRmbPerMillion, cacheMissInputRmbPerMillion, outputRmbPerMillion },
        elevenlabs: { ttsRmbPer100kChars },
      },
      chargedRates: {
        deepseek: {
          inputCacheHitPerMillionTokensAgentTokens: cacheHitInputRmbPerMillion * agentTokensPerRmb * billingMultiplier,
          inputCacheMissPerMillionTokensAgentTokens: cacheMissInputRmbPerMillion * agentTokensPerRmb * billingMultiplier,
          outputPerMillionTokensAgentTokens: outputRmbPerMillion * agentTokensPerRmb * billingMultiplier,
        },
        elevenlabs: {
          ttsPerCharacterAgentTokens: (ttsRmbPer100kChars * agentTokensPerRmb * billingMultiplier) / 100000,
        },
      },
    };
  }

  async calculateDeepSeekCharge(inputTokens: number, outputTokens: number, cacheHitInputTokens = 0) {
    const pricing = await this.getPricing();
    const cacheMissInputTokens = Math.max(inputTokens - cacheHitInputTokens, 0);
    const rawCostCny =
      (cacheHitInputTokens / 1_000_000) * pricing.rawRates.deepseek.cacheHitInputRmbPerMillion +
      (cacheMissInputTokens / 1_000_000) * pricing.rawRates.deepseek.cacheMissInputRmbPerMillion +
      (outputTokens / 1_000_000) * pricing.rawRates.deepseek.outputRmbPerMillion;

    return {
      rawCostCny,
      costTokens: Math.ceil(rawCostCny * pricing.agentTokensPerRmb * pricing.billingMultiplier),
      pricingSnapshot: pricing,
    };
  }

  async calculateElevenLabsCharge(characters: number) {
    const pricing = await this.getPricing();
    const rawCostCny = (characters / 100000) * pricing.rawRates.elevenlabs.ttsRmbPer100kChars;
    return {
      rawCostCny,
      costTokens: Math.ceil(rawCostCny * pricing.agentTokensPerRmb * pricing.billingMultiplier),
      pricingSnapshot: pricing,
    };
  }
}
