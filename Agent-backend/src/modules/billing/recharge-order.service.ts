import { Injectable, NotFoundException } from '@nestjs/common';
import { mockRechargeOrders, mockTokenTransactions, mockUsers } from '../../mock/mock-data';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateRechargeOrderDto } from './dto/create-recharge-order.dto';
import { RechargePackageService } from './recharge-package.service';

@Injectable()
export class RechargeOrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly packages: RechargePackageService,
  ) {}

  async create(dto: CreateRechargeOrderDto) {
    const pkg = await this.packages.getPackage(dto.packageId);
    const now = new Date();

    if (this.prisma.isMockMode) {
      const user = mockUsers[0];
      const order = {
        id: `recharge_order_${Date.now()}`,
        orderNo: this.makeOrderNo(now),
        userId: user.id,
        userEmail: user.email,
        amountRmb: pkg.amountRmb,
        agentTokens: pkg.agentTokens,
        status: 'PENDING',
        paymentProvider: 'MOCK',
        paymentMethod: 'MOCK_PAY',
        paymentTradeNo: '',
        expiresAt: new Date(now.getTime() + 15 * 60 * 1000).toISOString(),
        paidAt: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      mockRechargeOrders.unshift(order as any);
      return order;
    }

    const user = await this.getOrCreateCurrentUser();
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
        paymentPayload: { packageId: pkg.id, packageName: pkg.name, baseTokens: pkg.baseTokens, bonusTokens: pkg.bonusTokens, pricingSource: 'pricing_rules.agentTokensPerRmb' },
        expiresAt: new Date(now.getTime() + 15 * 60 * 1000),
      },
      include: { user: true },
    });
    return this.serializeOrder(order);
  }

  async listForCurrentUser(_query: any = {}) {
    const now = Date.now();
    if (this.prisma.isMockMode) {
      return mockRechargeOrders.filter((order) => order.status === 'PAID' || (order.status === 'PENDING' && new Date(order.expiresAt).getTime() > now));
    }

    const user = await this.getOrCreateCurrentUser();
    const items = await (this.prisma.db as any).rechargeOrder.findMany({
      where: {
        userId: user.id,
        OR: [
          { status: 'PAID' },
          { status: 'PENDING', expiresAt: { gt: new Date(now) } },
        ],
      },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    return items.map((item: any) => this.serializeOrder(item));
  }

  async listAll(query: any = {}) {
    const status = query.status;
    if (this.prisma.isMockMode) {
      return mockRechargeOrders.filter((order) => !status || order.status === status);
    }

    const items = await (this.prisma.db as any).rechargeOrder.findMany({
      where: status ? { status } : undefined,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    return items.map((item: any) => this.serializeOrder(item));
  }

  async getForCurrentUser(id: string) {
    return this.get(id);
  }

  async get(id: string) {
    if (this.prisma.isMockMode) {
      const order = mockRechargeOrders.find((item) => item.id === id);
      if (!order) throw new NotFoundException('Recharge order not found');
      return order;
    }

    const item = await (this.prisma.db as any).rechargeOrder.findUnique({ where: { id }, include: { user: true } });
    if (!item) throw new NotFoundException('Recharge order not found');
    return this.serializeOrder(item);
  }

  async mockPay(id: string) {
    if (this.prisma.isMockMode) {
      const order = await this.get(id) as any;
      if (order.status === 'PAID') return { order, alreadyPaid: true };
      const now = new Date().toISOString();
      order.status = 'PAID';
      order.paidAt = now;
      order.updatedAt = now;
      order.paymentTradeNo = `mock_trade_${Date.now()}`;

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
          operatorAdminId: null,
          description: 'Mock recharge order paid.',
          createdAt: now,
        } as any);
      }
      return { order, alreadyPaid: false };
    }

    const existing = await (this.prisma.db as any).rechargeOrder.findUnique({ where: { id }, include: { user: true } });
    if (!existing) throw new NotFoundException('Recharge order not found');
    if (existing.status === 'PAID') return { order: this.serializeOrder(existing), alreadyPaid: true };

    const now = new Date();
    const amountTokens = BigInt(existing.agentTokens);
    const result = await (this.prisma.db as any).$transaction(async (tx: any) => {
      const user = await tx.user.findUnique({ where: { id: existing.userId } });
      if (!user) throw new NotFoundException('User not found');
      const balanceBefore = BigInt(user.balanceTokens);
      const balanceAfter = balanceBefore + amountTokens;
      const [order] = await Promise.all([
        tx.rechargeOrder.update({
          where: { id },
          data: { status: 'PAID', paidAt: now, paymentTradeNo: `mock_trade_${Date.now()}` },
          include: { user: true },
        }),
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
            description: 'Mock recharge order paid.',
            metadata: { paymentProvider: 'MOCK' },
          },
        }),
      ]);
      return order;
    });

    return { order: this.serializeOrder(result), alreadyPaid: false };
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
