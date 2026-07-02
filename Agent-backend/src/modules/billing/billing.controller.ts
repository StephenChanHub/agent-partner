import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ok, paginated } from '../../common/api-response';
import { BillingService } from './billing.service';
import { RechargePackageService } from './recharge-package.service';
import { RechargeOrderService } from './recharge-order.service';
import { AgentTokenTransactionService } from './agent-token-transaction.service';
import { CreateRechargeOrderDto } from './dto/create-recharge-order.dto';

@Controller('billing')
export class BillingController {
  constructor(
    private readonly billing: BillingService,
    private readonly packages: RechargePackageService,
    private readonly orders: RechargeOrderService,
    private readonly transactions: AgentTokenTransactionService,
  ) {}

  @Get('pricing')
  async pricing() { return ok(await this.billing.pricing()); }

  @Get('packages')
  listPackages() { return ok(this.packages.listPackages()); }

  @Post('recharge-orders')
  createOrder(@Body() dto: CreateRechargeOrderDto) { return ok(this.orders.create(dto)); }

  @Get('recharge-orders')
  listOrders(@Query() query: any) { const items = this.orders.listForCurrentUser(query); return paginated(items, { total: items.length }); }

  @Get('recharge-orders/:id')
  getOrder(@Param('id') id: string) { return ok(this.orders.getForCurrentUser(id)); }

  @Post('recharge-orders/:id/mock-pay')
  mockPay(@Param('id') id: string) { return ok(this.orders.mockPay(id)); }

  @Get('transactions')
  listTransactions(@Query() query: any) { const items = this.transactions.listForCurrentUser(query); return paginated(items, { total: items.length }); }

  @Post('payment/webhook/wechat')
  wechatWebhook() { return ok({ received: true, provider: 'WECHAT', implemented: false, mode: 'reserved' }); }

  @Post('payment/webhook/alipay')
  alipayWebhook() { return ok({ received: true, provider: 'ALIPAY', implemented: false, mode: 'reserved' }); }
}
