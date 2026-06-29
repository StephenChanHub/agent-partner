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
        if (config.value.llm.provider === 'gemini') return gemini;
        if (config.value.llm.provider === 'deepseek') return deepseek;
        return mock;
      },
    },
  ],
  exports: [LLM_PORT],
})
export class LLMModule {}
