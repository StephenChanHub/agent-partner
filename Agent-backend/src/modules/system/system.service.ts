import { Injectable } from '@nestjs/common';

@Injectable()
export class SystemService {
  health() {
    return {
      status: 'ok',
      service: 'jarvis-core',
      version: '1.6.2',
      environment: process.env.NODE_ENV ?? 'development',
      providers: {
        llm: process.env.LLM_PROVIDER ?? 'mock',
        tts: process.env.TTS_PROVIDER ?? 'mock',
        stt: process.env.STT_PROVIDER ?? 'mock',
        payment: process.env.PAYMENT_PROVIDER ?? 'mock',
        cache: process.env.CACHE_DRIVER ?? 'memory',
        database: process.env.DATABASE_MODE ?? 'mock',
      },
      time: new Date().toISOString(),
    };
  }

  readiness() {
    return {
      ready: true,
      checks: [
        { name: 'api', status: 'ok' },
        { name: 'mock-data', status: 'ok' },
        { name: 'prisma', status: 'stubbed' },
        { name: 'admin-studio-contract', status: 'ok' },
      ],
    };
  }
}
