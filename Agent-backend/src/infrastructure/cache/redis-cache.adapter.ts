import { Injectable } from '@nestjs/common';
import { CachePort } from './cache.port';

@Injectable()
export class RedisCacheAdapter implements CachePort {
  // v1.5 skeleton: wire ioredis in v1.6/v1.7 when real infrastructure is enabled.
  async get<T = unknown>(_key: string): Promise<T | null> {
    return null;
  }

  async set<T = unknown>(_key: string, _value: T, _ttlSeconds?: number): Promise<void> {}

  async del(_key: string): Promise<void> {}

  async exists(_key: string): Promise<boolean> {
    return false;
  }
}
