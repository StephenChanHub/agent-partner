import { Injectable } from '@nestjs/common';
import { CreateRechargeOrderDto } from '../dto/create-recharge-order.dto';
import { RechargeOrderQueryDto } from '../dto/recharge-order-query.dto';

@Injectable()
export class RechargeOrderRepository {
  createMockOrder(_dto: CreateRechargeOrderDto) {
    return { todo: 'Create PENDING recharge order with 15-minute expiry' };
  }

  listVisibleForCurrentUser(_query: RechargeOrderQueryDto) {
    return { items: [], nextCursor: null };
  }

  findVisibleForCurrentUser(id: string) {
    return { id };
  }

  markPaidByMock(orderId: string) {
    return { id: orderId, status: 'PAID', note: 'Mock payment placeholder' };
  }
}
