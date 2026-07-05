import { Module } from '@nestjs/common';
import { LLM_PORT } from '../../common/tokens';
import { AppConfigModule } from '../../config/app-config.module';
import { AppConfigService } from '../../config/app-config.service';
import { GeminiLLMAdapter } from './gemini-llm.adapter';
import { DeepSeekLLMAdapter } from './deepseek-llm.adapter';
import { MockLLMAdapter } from './mock-llm.adapter';

@Module({
  imports: [AppConfigModule],
  providers: [
    MockLLMAdapter,
    GeminiLLMAdapter,
    DeepSeekLLMAdapter,
    {
      provide: LLM_PORT,
      inject: [AppConfigService, MockLLMAdapter, GeminiLLMAdapter, DeepSeekLLMAdapter],
      useFactory: (config: AppConfigService, mock: MockLLMAdapter, gemini: GeminiLLMAdapter, deepseek: DeepSeekLLMAdapter) => {
        // DeepSeekLLMAdapter is now a unified adapter that auto-detects
        // Gemini vs OpenAI-compatible API by model name.
        // Only fall back to MockAdapter when LLM_PROVIDER=mock.
        if (config.value.llm.provider === 'mock') return mock;
        return deepseek;
      },
    },
  ],
  exports: [LLM_PORT],
})
export class LLMModule {}
