import { Injectable, NotFoundException } from '@nestjs/common';
import { mockRechargeOrders, mockRechargePackages, mockTokenTransactions, mockUsers } from '../../mock/mock-data';
import { CreateRechargeOrderDto } from './dto/create-recharge-order.dto';

@Injectable()
export class RechargeOrderService {
  create(dto: CreateRechargeOrderDto) {
    const pkg = mockRechargePackages.find((item) => item.id === dto.packageId);
    if (!pkg) throw new NotFoundException('Recharge package not found');
    const now = new Date();
    const user = mockUsers[0];
    const order = {
      id: `recharge_order_${Date.now()}`,
      orderNo: `RO${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}${Date.now().toString().slice(-6)}`,
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

  listForCurrentUser(_query: any = {}) {
    const now = Date.now();
    return mockRechargeOrders.filter((order) => order.status === 'PAID' || (order.status === 'PENDING' && new Date(order.expiresAt).getTime() > now));
  }

  listAll(query: any = {}) {
    const status = query.status;
    return mockRechargeOrders.filter((order) => !status || order.status === status);
  }

  getForCurrentUser(id: string) {
    return this.get(id);
  }

  get(id: string) {
    const order = mockRechargeOrders.find((item) => item.id === id);
    if (!order) throw new NotFoundException('Recharge order not found');
    return order;
  }

  mockPay(id: string) {
    const order = this.get(id) as any;
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
}
