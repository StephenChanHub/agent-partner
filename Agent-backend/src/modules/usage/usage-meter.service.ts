import { Injectable } from '@nestjs/common';
import { PricingService } from './pricing.service';

@Injectable()
export class UsageMeterService {
  constructor(private readonly pricingService: PricingService) {}

  async fromDeepSeekUsage(inputTokens: number, outputTokens: number, cacheHitInputTokens = 0) {
    const charge = await this.pricingService.calculateDeepSeekCharge(inputTokens, outputTokens, cacheHitInputTokens);
    return {
      type: 'LLM_USAGE',
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      cacheHitInputTokens,
      cacheMissInputTokens: Math.max(inputTokens - cacheHitInputTokens, 0),
      rawCostCny: charge.rawCostCny,
      billingMultiplier: charge.pricingSnapshot.billingMultiplier,
      costTokens: charge.costTokens,
      pricingSnapshot: charge.pricingSnapshot,
    };
  }

  async fromTtsUsage(characters: number) {
    const charge = await this.pricingService.calculateElevenLabsCharge(characters);
    return {
      type: 'TTS_USAGE',
      ttsCharacters: characters,
      rawCostCny: charge.rawCostCny,
      billingMultiplier: charge.pricingSnapshot.billingMultiplier,
      costTokens: charge.costTokens,
      pricingSnapshot: charge.pricingSnapshot,
    };
  }

  fromSttUsage(seconds: number) {
    // V1 can track STT seconds first. Add paid STT rates when provider pricing is finalized.
    return { type: 'STT_USAGE', sttSeconds: seconds, costTokens: 0 };
  }
}
