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
  async listRechargeOrders(@Query() query: any) {
    const result = await this.orders.listAll(query);
    const items = Array.isArray(result) ? result : result.items;
    const total = Array.isArray(result) ? result.length : (result.total ?? items.length);
    return paginated(items, { page: Number(query.page ?? 1), pageSize: Number(query.pageSize ?? 10), total });
  }

  @Get('recharge-orders/:id')
  async getRechargeOrder(@Param('id') id: string) {
    return ok(await this.orders.get(id));
  }

  @Post('recharge-orders/:id/confirm')
  async confirmRechargeOrder(@Param('id') id: string) {
    return ok(await this.orders.confirmManualRecharge(id));
  }

  @Delete('recharge-orders/:id')
  async deleteRechargeOrder(@Param('id') id: string) {
    return ok(await this.orders.deleteOrder(id));
  }

  @Get('token-transactions')
  async listTokenTransactions(@Query() query: any) {
    const result = await this.transactions.listAll(query);
    const items = Array.isArray(result) ? result : result.items;
    const total = Array.isArray(result) ? result.length : (result.total ?? items.length);
    return paginated(items, { page: Number(query.page ?? 1), pageSize: Number(query.pageSize ?? 10), total });
  }

  @Get('billing/packages')
  async listPackages() {
    return ok(await this.packages.listPackages({ includeDisabled: true }));
  }

  @Post('billing/packages')
  async createPackage(@Body() dto: any) {
    return ok(await this.packages.createPackage(dto));
  }

  @Patch('billing/packages/:id')
  async updatePackage(@Param('id') id: string, @Body() dto: any) {
    return ok(await this.packages.updatePackage(id, dto));
  }

  @Delete('billing/packages/:id')
  async deletePackage(@Param('id') id: string) {
    return ok(await this.packages.deletePackage(id));
  }

  @Post('billing/packages/:id/discount')
  async applyPackageDiscount(@Param('id') id: string, @Body() dto: any) {
    return ok(await this.packages.applyDiscount(id, dto));
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
