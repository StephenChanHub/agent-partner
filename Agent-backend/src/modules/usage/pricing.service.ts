import { Injectable } from '@nestjs/common';
import { PricingRuleService } from '../billing/pricing-rule.service';

@Injectable()
export class PricingService {
  constructor(private readonly pricingRules: PricingRuleService) {}

  /** All configurable thresholds — admin can edit via Pricing Rules page. */
  async getPricing() {
    const rules = await this.pricingRules.valuesByKey({
      agentTokensPerRmb: Number(process.env.AGENT_TOKENS_PER_RMB ?? 1000),
      billingMultiplier: Number(process.env.BILLING_MULTIPLIER ?? 1.5),
      minimumTextBalance: Number(process.env.TEXT_CHAT_MIN_BALANCE_AGENT_TOKENS ?? 100),
      minimumVoiceBalance: Number(process.env.VOICE_CHAT_MIN_BALANCE_AGENT_TOKENS ?? 1000),
      voiceReplyMaxChars: Number(process.env.VOICE_REPLY_MAX_CHARS ?? 200),

      // Tiered text chat
      textChatBaseTokens: Number(process.env.TEXT_CHAT_BASE_TOKENS ?? 1),
      textChatTierTokens: Number(process.env.TEXT_CHAT_TIER_TOKENS ?? 8000),
      textChatExtraCharge: Number(process.env.TEXT_CHAT_EXTRA_CHARGE ?? 1),

      // Tiered voice chat
      voiceChatBaseTokens: Number(process.env.VOICE_CHAT_BASE_TOKENS ?? 3),
      voiceChatTierChars: Number(process.env.VOICE_CHAT_TIER_CHARS ?? 1500),
      voiceChatExtraCharge: Number(process.env.VOICE_CHAT_EXTRA_CHARGE ?? 1),

      // Profit protection
      minProfitRatio: Number(process.env.MIN_PROFIT_RATIO ?? 1.5),

      // Real-cost reference rates (for profit tracking, not user-facing)
      'deepseek.cacheHitInputRmbPerMillion': Number(process.env.DEEPSEEK_INPUT_CACHE_HIT_RMB_PER_MILLION ?? 0.02),
      'deepseek.cacheMissInputRmbPerMillion': Number(process.env.DEEPSEEK_INPUT_CACHE_MISS_RMB_PER_MILLION ?? 1),
      'deepseek.outputRmbPerMillion': Number(process.env.DEEPSEEK_OUTPUT_RMB_PER_MILLION ?? 2),
      'elevenlabs.ttsRmbPer100kChars': Number(process.env.ELEVENLABS_TTS_RMB_PER_100K_CHARS ?? 35),
    });

    return {
      agentTokensPerRmb: rules.agentTokensPerRmb,
      billingMultiplier: rules.billingMultiplier,
      minimumTextBalance: rules.minimumTextBalance,
      minimumVoiceBalance: rules.minimumVoiceBalance,
      voiceReplyMaxChars: rules.voiceReplyMaxChars,
      textChatBaseTokens: rules.textChatBaseTokens,
      textChatTierTokens: rules.textChatTierTokens,
      textChatExtraCharge: rules.textChatExtraCharge,
      voiceChatBaseTokens: rules.voiceChatBaseTokens,
      voiceChatTierChars: rules.voiceChatTierChars,
      voiceChatExtraCharge: rules.voiceChatExtraCharge,
      minProfitRatio: rules.minProfitRatio,
      rawRates: {
        deepseekCacheHitInput: rules['deepseek.cacheHitInputRmbPerMillion'],
        deepseekCacheMissInput: rules['deepseek.cacheMissInputRmbPerMillion'],
        deepseekOutput: rules['deepseek.outputRmbPerMillion'],
        elevenlabsTts: rules['elevenlabs.ttsRmbPer100kChars'],
      },
    };
  }

  // ── User-facing tiered charge (simple) ──
  //
  // Algorithm: tiered base × billingMultiplier → final Platform Tokens.
  //
  // Example: text base=1, tier=8000, extra=1, multiplier=1.5
  //   totalTokens=3000  → tier=1 → ceil(1 × 1.5) = 2 Tokens
  //   totalTokens=17000 → tier=3 → ceil(3 × 1.5) = 5 Tokens
  //
  // ── ARCHIVED: per-token real-cost pricing (V1.0, replaced by tiered) ──
  // The original algorithm calculated Platform Tokens from raw LLM cost:
  //   rawCostCny = (inputTokens/1M × inputRate) + (outputTokens/1M × outputRate)
  //   platformTokens = ceil(rawCostCny × billingMultiplier × agentTokensPerRmb)
  // This was replaced because users don't care about per-token costs —
  // they care about "how many chats can I make." The tiered approach is
  // simpler for users, while the real-cost math still runs in
  // calculateRealLLMCost() for profit monitoring.
  //
  // To restore per-token pricing in the future, swap calculateTextChatTokens()
  // contents with the commented block below and adjust the admin Pricing page:
  //
  //   const p = await this.getPricing();
  //   const rawCostCny = (await this.calculateRealLLMCost(inputTokens, outputTokens)).rawCostCny;
  //   const costTokens = Math.ceil(rawCostCny * p.billingMultiplier * p.agentTokensPerRmb);
  //   return { costTokens, ... };

  /** Calculate text chat charge with billingMultiplier on top of tiered base. */
  async calculateTextChatTokens(totalTokens: number) {
    const p = await this.getPricing();
    const tierSize = p.textChatTierTokens;
    const baseCharge = p.textChatBaseTokens;
    const extraCharge = p.textChatExtraCharge;
    const multiplier = p.billingMultiplier;

    const tiers = totalTokens > 0 ? Math.floor((totalTokens - 1) / tierSize) : 0;
    const rawTokens = baseCharge + tiers * extraCharge;
    const costTokens = Math.ceil(rawTokens * multiplier);

    return { costTokens, rawTokens, multiplier, totalTokens, tier: tiers + 1, tierSize, baseCharge, extraCharge };
  }

  /** Calculate voice chat charge with billingMultiplier on top of tiered base. */
  async calculateVoiceChatTokens(ttsCharacters: number) {
    const p = await this.getPricing();
    const tierSize = p.voiceChatTierChars;
    const baseCharge = p.voiceChatBaseTokens;
    const extraCharge = p.voiceChatExtraCharge;
    const multiplier = p.billingMultiplier;

    const tiers = ttsCharacters > 0 ? Math.floor((ttsCharacters - 1) / tierSize) : 0;
    const rawTokens = baseCharge + tiers * extraCharge;
    const costTokens = Math.ceil(rawTokens * multiplier);

    return { costTokens, rawTokens, multiplier, ttsCharacters, tier: tiers + 1, tierSize, baseCharge, extraCharge };
  }

  // ── Real-cost calculation (backend monitoring, not user-facing) ──

  /** Calculate real RMB cost from LLM token usage. */
  async calculateRealLLMCost(inputTokens: number, outputTokens: number, cacheHitInputTokens = 0) {
    const p = await this.getPricing();
    const cacheMiss = Math.max(inputTokens - cacheHitInputTokens, 0);
    const rawCostCny =
      (cacheHitInputTokens / 1_000_000) * p.rawRates.deepseekCacheHitInput +
      (cacheMiss / 1_000_000) * p.rawRates.deepseekCacheMissInput +
      (outputTokens / 1_000_000) * p.rawRates.deepseekOutput;
    return { rawCostCny, inputTokens, outputTokens, cacheHitInputTokens };
  }

  /** Calculate real RMB cost from TTS character usage. */
  async calculateRealTTSCost(characters: number) {
    const p = await this.getPricing();
    const rawCostCny = (characters / 100_000) * p.rawRates.elevenlabsTts;
    return { rawCostCny, characters };
  }

  /** Calculate total real cost + profit ratio for monitoring. */
  async calculateProfitMetrics(llmCostRmb: number, ttsCostRmb: number, platformChargeTokens: number) {
    const p = await this.getPricing();
    const totalCostRmb = llmCostRmb + ttsCostRmb;
    const chargeRmb = platformChargeTokens / p.agentTokensPerRmb;
    const profitRatio = totalCostRmb > 0 ? chargeRmb / totalCostRmb : Infinity;
    const isLoss = profitRatio < p.minProfitRatio && totalCostRmb > 0;
    return { totalCostRmb, chargeRmb, profitRatio, minProfitRatio: p.minProfitRatio, isLoss };
  }
}
