import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JarvisAppConfig } from './app-config.types';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService) {}

  get value(): JarvisAppConfig {
    return {
      app: {
        nodeEnv: this.getString('NODE_ENV', 'development'),
        port: this.getNumber('PORT', 3000),
        apiPrefix: this.getString('API_PREFIX', 'api'),
        corsOrigin: this.getString('CORS_ORIGINS', this.getString('CORS_ORIGIN', 'http://localhost:5173,http://localhost:5174')),
      },
      database: {
        url: this.getString('DATABASE_URL', 'mysql://sandbox:sandbox@localhost:3306/jarvis_sandbox'),
        logLevel: this.getString('PRISMA_LOG_LEVEL', 'error,warn').split(','),
      },
      auth: {
        jwtSecret: this.getString('JWT_SECRET', 'sandbox-jwt-secret'),
        jwtExpiresIn: this.getString('JWT_EXPIRES_IN', '7d'),
        deviceTokenSecret: this.getString('DEVICE_TOKEN_SECRET', 'sandbox-device-token-secret'),
      },
      cache: {
        driver: this.getString('CACHE_DRIVER', 'memory') as 'memory' | 'redis',
        redisUrl: this.getOptionalString('REDIS_URL'),
        namespace: this.getString('REDIS_NAMESPACE', 'jarvis:sandbox'),
      },
      llm: {
        provider: this.getString('LLM_PROVIDER', 'mock') as 'mock' | 'gemini' | 'deepseek',
        geminiApiKey: this.getOptionalString('GEMINI_API_KEY'),
        geminiModel: this.getString('GEMINI_MODEL', 'gemini-1.5-pro'),
        deepSeekApiKey: this.getOptionalString('DEEPSEEK_API_KEY'),
        deepSeekBaseUrl: this.getString('DEEPSEEK_BASE_URL', 'https://api.deepseek.com'),
        deepSeekModel: this.getString('DEEPSEEK_MODEL', 'deepseek-chat'),
      },
      voice: {
        ttsProvider: this.getString('TTS_PROVIDER', 'mock') as 'mock' | 'elevenlabs',
        elevenLabsApiKey: this.getOptionalString('ELEVENLABS_API_KEY'),
        defaultVoiceId: this.getOptionalString('ELEVENLABS_DEFAULT_VOICE_ID'),
        elevenLabsDefaultModelId: this.getString('ELEVENLABS_DEFAULT_MODEL_ID', 'eleven_v3'),
        elevenLabsDefaultOutputFormat: this.getString('ELEVENLABS_DEFAULT_OUTPUT_FORMAT', 'mp3_44100_128'),
        sttProvider: 'mock',
        language: this.getString('STT_LANGUAGE', 'zh-CN'),
      },
      device: {
        gatewayDriver: this.getString('DEVICE_GATEWAY_DRIVER', 'mock') as 'mock' | 'websocket',
        wsPath: this.getString('DEVICE_WS_PATH', '/devices/ws'),
        heartbeatSeconds: this.getNumber('DEVICE_HEARTBEAT_SECONDS', 30),
      },
      robot: {
        transportDriver: this.getString('ROBOT_TRANSPORT_DRIVER', 'mock') as 'mock' | 'websocket' | 'http',
        commandTimeoutMs: this.getNumber('ROBOT_COMMAND_TIMEOUT_MS', 5000),
        maxMoveDistanceCm: this.getNumber('ROBOT_MAX_MOVE_DISTANCE_CM', 100),
        maxSpeedLevel: this.getString('ROBOT_MAX_SPEED_LEVEL', 'LOW') as 'LOW' | 'MEDIUM' | 'HIGH',
      },
      observability: {
        logLevel: this.getString('LOG_LEVEL', 'debug') as 'debug' | 'info' | 'warn' | 'error',
        requestLoggingEnabled: this.getBoolean('REQUEST_LOGGING_ENABLED', true),
        traceIdHeader: this.getString('TRACE_ID_HEADER', 'x-trace-id'),
      },
    };
  }

  private getString(key: string, fallback?: string): string {
    const value = this.config.get<string>(key) ?? fallback;
    if (!value) throw new Error(`Missing required environment variable: ${key}`);
    return value;
  }

  private getOptionalString(key: string): string | undefined {
    const value = this.config.get<string>(key);
    return value && value.length > 0 ? value : undefined;
  }

  private getNumber(key: string, fallback: number): number {
    const raw = this.config.get<string>(key);
    const value = raw ? Number(raw) : fallback;
    if (Number.isNaN(value)) throw new Error(`Invalid number environment variable: ${key}`);
    return value;
  }

  private getBoolean(key: string, fallback: boolean): boolean {
    const raw = this.config.get<string>(key);
    if (raw === undefined) return fallback;
    return raw === 'true';
  }
}
