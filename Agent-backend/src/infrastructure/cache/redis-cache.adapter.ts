import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { AppConfigService } from '../../config/app-config.service';
import { CachePort } from './cache.port';

@Injectable()
export class RedisCacheAdapter implements CachePort, OnModuleDestroy {
  private client?: Redis;

  constructor(private readonly config: AppConfigService) {}

  async get<T = unknown>(key: string): Promise<T | null> {
    const raw = await this.getClient().get(this.key(key));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as T;
    }
  }

  async set<T = unknown>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const raw = JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await this.getClient().set(this.key(key), raw, 'EX', ttlSeconds);
      return;
    }
    await this.getClient().set(this.key(key), raw);
  }

  async del(key: string): Promise<void> {
    await this.getClient().del(this.key(key));
  }

  async exists(key: string): Promise<boolean> {
    return (await this.getClient().exists(this.key(key))) > 0;
  }

  async onModuleDestroy() {
    if (this.client) await this.client.quit();
  }

  private getClient() {
    if (!this.client) {
      const redisUrl = this.config.value.cache.redisUrl ?? process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';
      this.client = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 2,
      });
    }
    return this.client;
  }

  private key(key: string) {
    const namespace = process.env.REDIS_NAMESPACE ?? this.config.value.cache.namespace ?? 'jarvis';
    return `${namespace}:${key}`;
  }
}
