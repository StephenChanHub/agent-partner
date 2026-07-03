import { Controller, Get, Headers, Param, Query } from '@nestjs/common';
import { ok, paginated } from '../../common/api-response';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get('me')
  async me(@Headers('authorization') authorization?: string) {
    return ok(await this.service.me(authorization));
  }

  @Get('studio/users')
  async list(@Query() query: any) {
    const items = await this.service.list(query);
    return paginated(items, { page: Number(query.page ?? 1), pageSize: Number(query.pageSize ?? 20), total: items.length });
  }

  @Get('studio/users/:id')
  async get(@Param('id') id: string) {
    return ok(await this.service.get(id));
  }

  @Get('studio/users/:id/recharge-orders')
  async getRechargeOrders(@Param('id') id: string) {
    const items = await this.service.getRechargeOrders(id);
    return paginated(items, { total: items.length });
  }

  @Get('studio/users/:id/transactions')
  async getTransactions(@Param('id') id: string) {
    const items = await this.service.getTransactions(id);
    return paginated(items, { total: items.length });
  }

  @Get('studio/users/:id/usage-records')
  async getUsageRecords(@Param('id') id: string) {
    const items = await this.service.getUsageRecords(id);
    return paginated(items, { total: items.length });
  }
}
