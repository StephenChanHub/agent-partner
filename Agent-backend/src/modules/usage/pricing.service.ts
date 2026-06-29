import { Injectable } from '@nestjs/common';

@Injectable()
export class PricingService {
  private readonly agentTokensPerRmb = Number(process.env.AGENT_TOKENS_PER_RMB ?? 1000);
  private readonly billingMultiplier = Number(process.env.BILLING_MULTIPLIER ?? 1.5);

  getPricing() {
    const cacheHitInputRmbPerMillion = Number(process.env.DEEPSEEK_INPUT_CACHE_HIT_RMB_PER_MILLION ?? 0.02);
    const cacheMissInputRmbPerMillion = Number(process.env.DEEPSEEK_INPUT_CACHE_MISS_RMB_PER_MILLION ?? 1);
    const outputRmbPerMillion = Number(process.env.DEEPSEEK_OUTPUT_RMB_PER_MILLION ?? 2);
    const ttsRmbPer100kChars = Number(process.env.ELEVENLABS_TTS_RMB_PER_100K_CHARS ?? 35);

    return {
      currencyName: 'Agent Tokens',
      agentTokensPerRmb: this.agentTokensPerRmb,
      billingMultiplier: this.billingMultiplier,
      minimumTextBalance: Number(process.env.TEXT_CHAT_MIN_BALANCE_AGENT_TOKENS ?? 100),
      minimumVoiceBalance: Number(process.env.VOICE_CHAT_MIN_BALANCE_AGENT_TOKENS ?? 1000),
      voiceReplyMaxChars: Number(process.env.VOICE_REPLY_MAX_CHARS ?? 200),
      rawRates: {
        deepseek: { cacheHitInputRmbPerMillion, cacheMissInputRmbPerMillion, outputRmbPerMillion },
        elevenlabs: { ttsRmbPer100kChars },
      },
      chargedRates: {
        deepseek: {
          inputCacheHitPerMillionTokensAgentTokens: cacheHitInputRmbPerMillion * this.agentTokensPerRmb * this.billingMultiplier,
          inputCacheMissPerMillionTokensAgentTokens: cacheMissInputRmbPerMillion * this.agentTokensPerRmb * this.billingMultiplier,
          outputPerMillionTokensAgentTokens: outputRmbPerMillion * this.agentTokensPerRmb * this.billingMultiplier,
        },
        elevenlabs: {
          ttsPerCharacterAgentTokens: (ttsRmbPer100kChars * this.agentTokensPerRmb * this.billingMultiplier) / 100000,
        },
      },
    };
  }

  calculateDeepSeekCharge(inputTokens: number, outputTokens: number, cacheHitInputTokens = 0) {
    const pricing = this.getPricing();
    const cacheMissInputTokens = Math.max(inputTokens - cacheHitInputTokens, 0);
    const rawCostCny =
      (cacheHitInputTokens / 1_000_000) * pricing.rawRates.deepseek.cacheHitInputRmbPerMillion +
      (cacheMissInputTokens / 1_000_000) * pricing.rawRates.deepseek.cacheMissInputRmbPerMillion +
      (outputTokens / 1_000_000) * pricing.rawRates.deepseek.outputRmbPerMillion;

    return {
      rawCostCny,
      costTokens: Math.ceil(rawCostCny * this.agentTokensPerRmb * this.billingMultiplier),
      pricingSnapshot: pricing,
    };
  }

  calculateElevenLabsCharge(characters: number) {
    const pricing = this.getPricing();
    const rawCostCny = (characters / 100000) * pricing.rawRates.elevenlabs.ttsRmbPer100kChars;
    return {
      rawCostCny,
      costTokens: Math.ceil(rawCostCny * this.agentTokensPerRmb * this.billingMultiplier),
      pricingSnapshot: pricing,
    };
  }
}
