import { Injectable } from '@nestjs/common';

@Injectable()
export class BillingService {
  pricing() {
    return {
      currency: 'AGENT_TOKENS',
      agentTokensPerRmb: 1000,
      billingMultiplier: 1.5,
      minimumBalance: { text: 100, voice: 1000 },
      llm: {
        provider: 'deepseek',
        mode: process.env.LLM_PROVIDER ?? 'mock',
        inputCacheHitRmbPerMillion: 0.02,
        inputCacheMissRmbPerMillion: 1,
        outputRmbPerMillion: 2,
      },
      tts: {
        provider: 'elevenlabs',
        mode: process.env.TTS_PROVIDER ?? 'mock',
        rmbPer100kCharacters: 35,
        chargedAgentTokensPerCharacter: 0.525,
      },
    };
  }
}
