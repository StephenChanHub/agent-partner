import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

type PrismaLogLevel = 'query' | 'info' | 'warn' | 'error';
type PrismaClientLike = {
  $connect: () => Promise<void>;
  $disconnect: () => Promise<void>;
  $queryRaw: <T = unknown>(query: TemplateStringsArray | string, ...values: unknown[]) => Promise<T>;
  $queryRawUnsafe: <T = unknown>(query: string, ...values: unknown[]) => Promise<T>;
  [modelName: string]: any;
};

/**
 * PrismaService
 *
 * - DATABASE_MODE=mock keeps the backend fully sandbox-friendly and does not open a DB connection.
 * - Any other DATABASE_MODE uses the real Prisma client and the DATABASE_URL from env.
 *
 * The PrismaClient import is intentionally resolved at runtime because a fresh checkout may not
 * have run `prisma generate` yet. After `npm run prisma:generate`, real DB mode gets the generated
 * typed client; sandbox mode remains buildable without a generated client.
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private client?: PrismaClientLike;

  get isMockMode(): boolean {
    return (process.env.DATABASE_MODE ?? '').toLowerCase() === 'mock';
  }

  get db(): PrismaClientLike {
    return this.getClient();
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async $connect(): Promise<void> {
    if (this.isMockMode) return;
    await this.getClient().$connect();
  }

  async $disconnect(): Promise<void> {
    if (!this.client) return;
    await this.client.$disconnect();
  }

  async $queryRaw<T = unknown>(query: TemplateStringsArray | string, ...values: unknown[]): Promise<T[]> {
    if (this.isMockMode) return [];
    if (typeof query === 'string') {
      return this.getClient().$queryRawUnsafe<T[]>(query, ...values);
    }
    return this.getClient().$queryRaw<T[]>(query, ...values);
  }

  private getClient(): PrismaClientLike {
    if (this.client) return this.client;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PrismaClient } = require('@prisma/client');
    const log = (process.env.PRISMA_LOG_LEVEL ?? 'error,warn')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean) as PrismaLogLevel[];
    this.client = new PrismaClient({ log });
    return this.client;
  }
}
