import { BadRequestException, ConflictException, Injectable, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { mockRechargeOrders, mockTokenTransactions, mockUsers } from '../../mock/mock-data';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateRechargeOrderDto } from './dto/create-recharge-order.dto';
import { RechargePackageService } from './recharge-package.service';

const MANUAL_RECHARGE_EXPIRE_MS = 5 * 60 * 1000;
const STALE_ORDER_SWEEP_MS = 60 * 1000;
const FINAL_ORDER_STATUSES = new Set(['PAID', 'EXPIRED']);

@Injectable()
export class RechargeOrderService implements OnModuleInit, OnModuleDestroy {
  private staleOrderTimer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly packages: RechargePackageService,
  ) {}

  onModuleInit() {
    this.staleOrderTimer = setInterval(() => {
      this.expireStalePendingOrders().catch(() => undefined);
    }, STALE_ORDER_SWEEP_MS);
    this.staleOrderTimer.unref?.();
  }

  onModuleDestroy() {
    if (this.staleOrderTimer) clearInterval(this.staleOrderTimer);
  }

  async create(dto: CreateRechargeOrderDto) {
    const pkg = await this.packages.getPackage(dto.packageId);
    const now = new Date();

    if (this.prisma.isMockMode) {
      const user = mockUsers[0];
      this.expireMockPendingOrdersForUser(user.id, now);
      const blockingOrder = this.findMockBlockingOrder(user.id, now);
      if (blockingOrder) {
        throw new ConflictException({
          message: '你有未处理完成的充值订单，请先等待管理员确认或订单自动取消后再下单。',
          code: 'RECHARGE_ORDER_UNFINISHED',
          order: blockingOrder,
        });
      }

      const order = {
        id: `recharge_order_${Date.now()}`,
        orderNo: this.makeOrderNo(now),
        userId: user.id,
        userEmail: user.email,
        amountRmb: pkg.amountRmb,
        currency: 'CNY',
        agentTokens: pkg.agentTokens,
        status: 'PENDING',
        paymentProvider: 'MOCK',
        paymentMethod: 'MOCK',
        paymentTradeNo: '',
        paymentPayload: {
          packageId: pkg.id,
          packageName: pkg.name,
          baseTokens: pkg.baseTokens,
          bonusTokens: pkg.bonusTokens,
          mode: 'MANUAL_ADMIN_CONFIRMATION',
        },
        expiresAt: new Date(now.getTime() + MANUAL_RECHARGE_EXPIRE_MS).toISOString(),
        paidAt: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      mockRechargeOrders.unshift(order as any);
      return order;
    }

    const user = await this.getOrCreateCurrentUser();
    await this.expireStalePendingOrdersForUser(user.id, now);
    const blockingOrder = await this.findBlockingOrderForUser(user.id, now);
    if (blockingOrder) {
      throw new ConflictException({
        message: '你有未处理完成的充值订单，请先等待管理员确认或订单自动取消后再下单。',
        code: 'RECHARGE_ORDER_UNFINISHED',
        order: this.serializeOrder(blockingOrder),
      });
    }

    const order = await (this.prisma.db as any).rechargeOrder.create({
      data: {
        orderNo: this.makeOrderNo(now),
        userId: user.id,
        amountRmb: pkg.amountRmb,
        currency: 'CNY',
        agentTokens: BigInt(pkg.agentTokens),
        status: 'PENDING',
        paymentProvider: 'MOCK',
        paymentMethod: 'MOCK',
        paymentTradeNo: '',
        paymentPayload: {
          packageId: pkg.id,
          packageName: pkg.name,
          baseTokens: pkg.baseTokens,
          bonusTokens: pkg.bonusTokens,
          pricingSource: 'pricing_rules.agentTokensPerRmb',
          mode: 'MANUAL_ADMIN_CONFIRMATION',
        },
        expiresAt: new Date(now.getTime() + MANUAL_RECHARGE_EXPIRE_MS),
      },
      include: { user: true },
    });
    return this.serializeOrder(order);
  }

  async listForCurrentUser(_query: any = {}) {
    const now = new Date();
    if (this.prisma.isMockMode) {
      const user = mockUsers[0];
      this.expireMockPendingOrdersForUser(user.id, now);
      return mockRechargeOrders
        .filter((order) => order.userId === user.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const user = await this.getOrCreateCurrentUser();
    await this.expireStalePendingOrdersForUser(user.id, now);
    const items = await (this.prisma.db as any).rechargeOrder.findMany({
      where: { userId: user.id },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    return items.map((item: any) => this.serializeOrder(item));
  }

  async listAll(query: any = {}) {
    const status = query.status;
    await this.expireStalePendingOrders();

    if (this.prisma.isMockMode) {
      return mockRechargeOrders
        .filter((order) => !status || order.status === status)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const items = await (this.prisma.db as any).rechargeOrder.findMany({
      where: status ? { status } : undefined,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    return items.map((item: any) => this.serializeOrder(item));
  }

  async getForCurrentUser(id: string) {
    const order = await this.get(id);
    if (!this.prisma.isMockMode) {
      const user = await this.getOrCreateCurrentUser();
      if ((order as any).userId !== user.id) throw new NotFoundException('Recharge order not found');
    }
    return order;
  }

  async get(id: string) {
    await this.expireStalePendingOrders();

    if (this.prisma.isMockMode) {
      const order = mockRechargeOrders.find((item) => item.id === id);
      if (!order) throw new NotFoundException('Recharge order not found');
      return order;
    }

    const item = await (this.prisma.db as any).rechargeOrder.findUnique({ where: { id }, include: { user: true } });
    if (!item) throw new NotFoundException('Recharge order not found');
    return this.serializeOrder(item);
  }

  async confirmManualRecharge(id: string) {
    await this.expireStalePendingOrders();

    if (this.prisma.isMockMode) {
      const order = await this.get(id) as any;
      if (order.status === 'PAID') return { order, alreadyPaid: true };
      if (order.status !== 'PENDING') throw new BadRequestException('Only pending recharge orders can be confirmed.');

      const now = new Date().toISOString();
      order.status = 'PAID';
      order.paidAt = now;
      order.updatedAt = now;
      order.paymentTradeNo = `manual_confirm_${Date.now()}`;

      const user = mockUsers.find((item) => item.id === order.userId) as any;
      if (user) {
        const before = user.balanceTokens;
        user.balanceTokens += order.agentTokens;
        mockTokenTransactions.unshift({
          id: `txn_${Date.now()}`,
          userId: user.id,
          userEmail: user.email,
          type: 'RECHARGE',
          direction: 'CREDIT',
          amountTokens: order.agentTokens,
          balanceBefore: before,
          balanceAfter: user.balanceTokens,
          relatedOrderId: order.id,
          relatedUsageRecordId: null,
          operatorAdminId: 'admin_mock_001',
          description: 'Manual recharge approved by admin.',
          metadata: { paymentProvider: 'MOCK', mode: 'MANUAL_ADMIN_CONFIRMATION' },
          createdAt: now,
        } as any);
      }
      return { order, alreadyPaid: false };
    }

    const now = new Date();
    const result = await (this.prisma.db as any).$transaction(async (tx: any) => {
      const existing = await tx.rechargeOrder.findUnique({ where: { id }, include: { user: true } });
      if (!existing) throw new NotFoundException('Recharge order not found');
      if (existing.status === 'PAID') return { order: existing, alreadyPaid: true };
      if (existing.status !== 'PENDING') throw new BadRequestException('Only pending recharge orders can be confirmed.');
      if (existing.expiresAt && new Date(existing.expiresAt).getTime() <= now.getTime()) {
        const expired = await tx.rechargeOrder.update({
          where: { id },
          data: { status: 'EXPIRED' },
          include: { user: true },
        });
        throw new BadRequestException({ message: '订单已超过 5 分钟未处理，已自动取消。', order: this.serializeOrder(expired) });
      }

      const claimed = await tx.rechargeOrder.updateMany({
        where: { id, status: 'PENDING', expiresAt: { gt: now } },
        data: {
          status: 'PAID',
          paidAt: now,
          paymentTradeNo: `manual_confirm_${Date.now()}`,
          paymentPayload: {
            ...(existing.paymentPayload ?? {}),
            confirmedBy: 'admin_mock_001',
            confirmedAt: now.toISOString(),
            mode: 'MANUAL_ADMIN_CONFIRMATION',
          },
        },
      });
      if (claimed.count !== 1) {
        const latest = await tx.rechargeOrder.findUnique({ where: { id }, include: { user: true } });
        if (latest?.status === 'PAID') return { order: latest, alreadyPaid: true };
        throw new BadRequestException('Recharge order was already processed.');
      }

      const amountTokens = BigInt(existing.agentTokens);
      const user = await tx.user.findUnique({ where: { id: existing.userId } });
      if (!user) throw new NotFoundException('User not found');
      const balanceBefore = BigInt(user.balanceTokens);
      const balanceAfter = balanceBefore + amountTokens;
      await Promise.all([
        tx.user.update({ where: { id: user.id }, data: { balanceTokens: balanceAfter } }),
        tx.agentTokenTransaction.create({
          data: {
            userId: user.id,
            type: 'RECHARGE',
            direction: 'CREDIT',
            amountTokens,
            balanceBefore,
            balanceAfter,
            relatedOrderId: id,
            description: 'Manual recharge approved by admin.',
            metadata: { paymentProvider: 'MOCK', mode: 'MANUAL_ADMIN_CONFIRMATION' },
          },
        }),
      ]);

      const order = await tx.rechargeOrder.findUnique({ where: { id }, include: { user: true } });
      return { order, alreadyPaid: false };
    });

    return { order: this.serializeOrder(result.order), alreadyPaid: result.alreadyPaid };
  }

  async deleteOrder(id: string) {
    if (this.prisma.isMockMode) {
      const index = mockRechargeOrders.findIndex((item) => item.id === id);
      if (index < 0) throw new NotFoundException('Recharge order not found');
      mockRechargeOrders.splice(index, 1);
      return { deleted: true, id };
    }

    const existing = await (this.prisma.db as any).rechargeOrder.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Recharge order not found');
    await (this.prisma.db as any).rechargeOrder.delete({ where: { id } });
    return { deleted: true, id };
  }

  /** Backward compatible endpoint retained for older clients; admin confirmation is the real flow now. */
  async mockPay(id: string) {
    return this.confirmManualRecharge(id);
  }

  async expireStalePendingOrders() {
    const now = new Date();
    if (this.prisma.isMockMode) {
      this.expireMockPendingOrders(now);
      return { expired: true, mode: 'mock' };
    }

    await (this.prisma.db as any).rechargeOrder.updateMany({
      where: { status: 'PENDING', expiresAt: { lte: now } },
      data: { status: 'EXPIRED' },
    });
    return { expired: true, mode: 'db' };
  }

  private async expireStalePendingOrdersForUser(userId: string, now = new Date()) {
    await (this.prisma.db as any).rechargeOrder.updateMany({
      where: { userId, status: 'PENDING', expiresAt: { lte: now } },
      data: { status: 'EXPIRED' },
    });
  }

  private async findBlockingOrderForUser(userId: string, now = new Date()) {
    return (this.prisma.db as any).rechargeOrder.findFirst({
      where: {
        userId,
        OR: [
          { status: 'PENDING', expiresAt: { gt: now } },
          { status: { notIn: Array.from(FINAL_ORDER_STATUSES) } },
        ],
      },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  private expireMockPendingOrders(now = new Date()) {
    mockRechargeOrders.forEach((order: any) => {
      if (order.status === 'PENDING' && new Date(order.expiresAt).getTime() <= now.getTime()) {
        order.status = 'EXPIRED';
        order.updatedAt = now.toISOString();
      }
    });
  }

  private expireMockPendingOrdersForUser(userId: string, now = new Date()) {
    mockRechargeOrders.forEach((order: any) => {
      if (order.userId === userId && order.status === 'PENDING' && new Date(order.expiresAt).getTime() <= now.getTime()) {
        order.status = 'EXPIRED';
        order.updatedAt = now.toISOString();
      }
    });
  }

  private findMockBlockingOrder(userId: string, now = new Date()) {
    return mockRechargeOrders.find((order: any) => (
      order.userId === userId && (
        (order.status === 'PENDING' && new Date(order.expiresAt).getTime() > now.getTime()) ||
        !FINAL_ORDER_STATUSES.has(order.status)
      )
    ));
  }

  private async getOrCreateCurrentUser() {
    const demo = mockUsers[0];
    const existing = await (this.prisma.db as any).user.findFirst({
      where: { OR: [{ id: demo.id }, { email: demo.email }] },
    });
    if (existing) return existing;
    return (this.prisma.db as any).user.create({
      data: {
        id: demo.id,
        email: demo.email,
        passwordHash: 'sandbox_mock_password_hash',
        nickname: demo.nickname,
        role: 'USER',
        balanceTokens: BigInt(demo.balanceTokens),
        usedTokens: BigInt(demo.usedTokens),
        lastSeenAt: new Date(),
      },
    });
  }

  private makeOrderNo(now: Date) {
    return `RO${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}${Date.now().toString().slice(-6)}`;
  }

  private serializeOrder(item: any) {
    return {
      id: item.id,
      orderNo: item.orderNo,
      userId: item.userId,
      userEmail: item.user?.email ?? item.userEmail ?? '',
      amountRmb: Number(item.amountRmb ?? 0),
      currency: item.currency ?? 'CNY',
      agentTokens: Number(item.agentTokens ?? 0),
      status: item.status,
      paymentProvider: item.paymentProvider,
      paymentMethod: item.paymentMethod,
      paymentTradeNo: item.paymentTradeNo ?? '',
      paymentPayload: item.paymentPayload ?? null,
      expiresAt: item.expiresAt instanceof Date ? item.expiresAt.toISOString() : item.expiresAt,
      paidAt: item.paidAt instanceof Date ? item.paidAt.toISOString() : item.paidAt,
      createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
      updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt,
    };
  }
}
