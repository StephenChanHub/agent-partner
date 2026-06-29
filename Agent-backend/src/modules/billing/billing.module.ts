import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { StudioBillingController } from './studio-billing.controller';
import { BillingService } from './billing.service';
import { RechargeOrderService } from './recharge-order.service';
import { RechargePackageService } from './recharge-package.service';
import { AgentTokenTransactionService } from './agent-token-transaction.service';
import { MockPaymentService } from './mock-payment.service';
import { AdminTokenAdjustmentService } from './admin-token-adjustment.service';
import { RechargeOrderRepository } from './repositories/recharge-order.repository';
import { AgentTokenTransactionRepository } from './repositories/agent-token-transaction.repository';

@Module({
  controllers: [BillingController, StudioBillingController],
  providers: [
    BillingService,
    RechargeOrderService,
    RechargePackageService,
    AgentTokenTransactionService,
    MockPaymentService,
    AdminTokenAdjustmentService,
    RechargeOrderRepository,
    AgentTokenTransactionRepository,
  ],
  exports: [BillingService, RechargeOrderService, AgentTokenTransactionService, AdminTokenAdjustmentService],
})
export class BillingModule {}
