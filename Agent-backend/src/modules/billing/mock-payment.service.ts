import { Injectable } from '@nestjs/common';
import { RechargeOrderRepository } from './repositories/recharge-order.repository';

@Injectable()
export class MockPaymentService {
  constructor(private readonly repository: RechargeOrderRepository) {}

  pay(orderId: string) {
    // V1: repository method must be idempotent and transactional.
    return this.repository.markPaidByMock(orderId);
  }
}
