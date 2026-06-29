export type ProviderName = 'mock' | 'gemini' | 'deepseek' | 'elevenlabs' | 'redis' | 'memory' | 'websocket' | 'http';

export interface JarvisAppConfig {
  app: {
    nodeEnv: string;
    port: number;
    apiPrefix: string;
    corsOrigin: string;
  };
  database: {
    url: string;
    logLevel: string[];
  };
  auth: {
    jwtSecret: string;
    jwtExpiresIn: string;
    deviceTokenSecret: string;
  };
  cache: {
    driver: 'memory' | 'redis';
    redisUrl?: string;
    namespace: string;
  };
  llm: {
    provider: 'mock' | 'gemini' | 'deepseek';
    geminiApiKey?: string;
    geminiModel: string;
    deepSeekApiKey?: string;
    deepSeekBaseUrl: string;
    deepSeekModel: string;
  };
  voice: {
    ttsProvider: 'mock' | 'elevenlabs';
    elevenLabsApiKey?: string;
    defaultVoiceId?: string;
    elevenLabsDefaultModelId: string;
    elevenLabsDefaultOutputFormat: string;
    sttProvider: 'mock';
    language: string;
  };
  device: {
    gatewayDriver: 'mock' | 'websocket';
    wsPath: string;
    heartbeatSeconds: number;
  };
  robot: {
    transportDriver: 'mock' | 'websocket' | 'http';
    commandTimeoutMs: number;
    maxMoveDistanceCm: number;
    maxSpeedLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  observability: {
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    requestLoggingEnabled: boolean;
    traceIdHeader: string;
  };
}
