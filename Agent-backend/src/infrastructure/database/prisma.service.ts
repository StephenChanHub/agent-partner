import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

/**
 * Sandbox PrismaService
 *
 * v1.6.2 沙盒阶段默认不连接真实数据库。
 * 目标是让 Mock API / Runtime Stub / Admin Studio API Contract 先跑通。
 * 后续进入真实数据库阶段时，再替换为 PrismaClient 实现。
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async $connect(): Promise<void> {
    return;
  }

  async $disconnect(): Promise<void> {
    return;
  }

  async $queryRaw<T = unknown>(_query: TemplateStringsArray | string, ..._values: unknown[]): Promise<T[]> {
    return [];
  }
}
