import { Injectable } from '@nestjs/common';
import { PricingService } from './pricing.service';

@Injectable()
export class UsageMeterService {
  constructor(private readonly pricing: PricingService) {}

  /** Tiered text chat charge — user sees simple 1/2/3… Tokens. */
  async fromTextChat(totalTokens: number) {
    const charge = await this.pricing.calculateTextChatTokens(totalTokens);
    const realCost = await this.pricing.calculateRealLLMCost(totalTokens, 0, 0); // approximate
    const profit = await this.pricing.calculateProfitMetrics(realCost.rawCostCny, 0, charge.costTokens);

    return {
      type: 'LLM_USAGE' as const,
      totalTokens,
      costTokens: charge.costTokens,
      tier: charge.tier,
      tierSize: charge.tierSize,
      rawCostCny: realCost.rawCostCny,
      profitRatio: profit.profitRatio,
      isLoss: profit.isLoss,
    };
  }

  /** Tiered voice chat charge — user sees simple 3/4/5… Tokens. */
  async fromVoiceChat(ttsCharacters: number, llmTotalTokens: number) {
    const voiceCharge = await this.pricing.calculateVoiceChatTokens(ttsCharacters);
    const llmRealCost = await this.pricing.calculateRealLLMCost(llmTotalTokens, 0, 0);
    const ttsRealCost = await this.pricing.calculateRealTTSCost(ttsCharacters);
    const totalCostRmb = llmRealCost.rawCostCny + ttsRealCost.rawCostCny;
    const profit = await this.pricing.calculateProfitMetrics(totalCostRmb, 0, voiceCharge.costTokens);

    return {
      type: 'TTS_USAGE' as const,
      ttsCharacters,
      llmTotalTokens,
      costTokens: voiceCharge.costTokens,
      tier: voiceCharge.tier,
      tierSize: voiceCharge.tierSize,
      rawCostCny: totalCostRmb,
      profitRatio: profit.profitRatio,
      isLoss: profit.isLoss,
    };
  }

  /** Detailed LLM usage — for per-token cost tracking, returns full breakdown. */
  async fromDetailedLLM(inputTokens: number, outputTokens: number, cacheHitInputTokens = 0) {
    const totalTokens = inputTokens + outputTokens;
    const charge = await this.pricing.calculateTextChatTokens(totalTokens);
    const realCost = await this.pricing.calculateRealLLMCost(inputTokens, outputTokens, cacheHitInputTokens);
    const profit = await this.pricing.calculateProfitMetrics(realCost.rawCostCny, 0, charge.costTokens);

    return {
      type: 'LLM_USAGE' as const,
      inputTokens,
      outputTokens,
      totalTokens,
      cacheHitInputTokens,
      cacheMissInputTokens: Math.max(inputTokens - cacheHitInputTokens, 0),
      costTokens: charge.costTokens,
      tier: charge.tier,
      tierSize: charge.tierSize,
      rawCostCny: realCost.rawCostCny,
      profitRatio: profit.profitRatio,
      isLoss: profit.isLoss,
    };
  }

  /** Backward-compat: kept for voice chat pipeline which still calls this. */
  async fromDeepSeekUsage(inputTokens: number, outputTokens: number, cacheHitInputTokens = 0) {
    return this.fromDetailedLLM(inputTokens, outputTokens, cacheHitInputTokens);
  }

  /** Backward-compat: kept for voice chat pipeline. */
  async fromTtsUsage(characters: number) {
    const charge = await this.pricing.calculateVoiceChatTokens(characters);
    const realCost = await this.pricing.calculateRealTTSCost(characters);
    const profit = await this.pricing.calculateProfitMetrics(0, realCost.rawCostCny, charge.costTokens);

    return {
      type: 'TTS_USAGE' as const,
      ttsCharacters: characters,
      costTokens: charge.costTokens,
      tier: charge.tier,
      tierSize: charge.tierSize,
      rawCostCny: realCost.rawCostCny,
      profitRatio: profit.profitRatio,
      isLoss: profit.isLoss,
    };
  }

  fromSttUsage(seconds: number) {
    return { type: 'STT_USAGE' as const, sttSeconds: seconds, costTokens: 0 };
  }
}
