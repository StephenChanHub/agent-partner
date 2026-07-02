import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ok, paginated } from '../../common/api-response';
import { AdminAdjustAgentTokensDto } from './dto/admin-adjust-agent-tokens.dto';
import { AdminTokenAdjustmentService } from './admin-token-adjustment.service';
import { RechargeOrderService } from './recharge-order.service';
import { AgentTokenTransactionService } from './agent-token-transaction.service';
import { RechargePackageService } from './recharge-package.service';
import { PricingRuleService } from './pricing-rule.service';

@Controller('studio')
export class StudioBillingController {
  constructor(
    private readonly adminTokenAdjustment: AdminTokenAdjustmentService,
    private readonly orders: RechargeOrderService,
    private readonly transactions: AgentTokenTransactionService,
    private readonly packages: RechargePackageService,
    private readonly pricingRules: PricingRuleService,
  ) {}

  @Post('users/:id/tokens/adjust')
  adjustUserTokens(@Param('id') id: string, @Body() dto: AdminAdjustAgentTokensDto) {
    return ok(this.adminTokenAdjustment.addTokens({ userId: id, adminUserId: 'admin_mock_001', dto }));
  }

  @Get('recharge-orders')
  listRechargeOrders(@Query() query: any) {
    const items = this.orders.listAll(query);
    return paginated(items, { page: Number(query.page ?? 1), pageSize: Number(query.pageSize ?? 20), total: items.length });
  }

  @Get('recharge-orders/:id')
  getRechargeOrder(@Param('id') id: string) {
    return ok(this.orders.get(id));
  }

  @Get('token-transactions')
  listTokenTransactions(@Query() query: any) {
    const items = this.transactions.listAll(query);
    return paginated(items, { page: Number(query.page ?? 1), pageSize: Number(query.pageSize ?? 20), total: items.length });
  }

  @Get('billing/packages')
  listPackages() {
    return ok(this.packages.listPackages());
  }

  @Post('billing/packages')
  createPackage(@Body() dto: any) {
    return ok(this.packages.createPackage(dto));
  }

  @Patch('billing/packages/:id')
  updatePackage(@Param('id') id: string, @Body() dto: any) {
    return ok(this.packages.updatePackage(id, dto));
  }

  @Delete('billing/packages/:id')
  deletePackage(@Param('id') id: string) {
    return ok(this.packages.deletePackage(id));
  }

  @Post('billing/packages/:id/discount')
  applyPackageDiscount(@Param('id') id: string, @Body() dto: any) {
    return ok(this.packages.applyDiscount(id, dto));
  }



  @Get('billing/pricing-rules')
  async listPricingRules() {
    return ok(await this.pricingRules.listRules());
  }

  @Post('billing/pricing-rules')
  async createPricingRule(@Body() dto: any) {
    return ok(await this.pricingRules.createRule(dto));
  }

  @Get('billing/pricing-rules/:id')
  async getPricingRule(@Param('id') id: string) {
    return ok(await this.pricingRules.getRule(id));
  }

  @Patch('billing/pricing-rules/:id')
  async updatePricingRule(@Param('id') id: string, @Body() dto: any) {
    return ok(await this.pricingRules.updateRule(id, dto));
  }

  @Delete('billing/pricing-rules/:id')
  async deletePricingRule(@Param('id') id: string) {
    return ok(await this.pricingRules.deleteRule(id));
  }

}
