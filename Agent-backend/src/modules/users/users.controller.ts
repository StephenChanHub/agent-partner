import { Controller, Get, Headers, Param, Query } from '@nestjs/common';
import { ok, paginated } from '../../common/api-response';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get('me')
  me(@Headers('authorization') authorization?: string) {
    return ok(this.service.me(authorization));
  }

  @Get('studio/users')
  list(@Query() query: any) {
    const items = this.service.list(query);
    return paginated(items, { page: Number(query.page ?? 1), pageSize: Number(query.pageSize ?? 20), total: items.length });
  }

  @Get('studio/users/:id')
  get(@Param('id') id: string) {
    return ok(this.service.get(id));
  }

  @Get('studio/users/:id/recharge-orders')
  getRechargeOrders(@Param('id') id: string) {
    const items = this.service.getRechargeOrders(id);
    return paginated(items, { total: items.length });
  }

  @Get('studio/users/:id/transactions')
  getTransactions(@Param('id') id: string) {
    const items = this.service.getTransactions(id);
    return paginated(items, { total: items.length });
  }

  @Get('studio/users/:id/usage-records')
  getUsageRecords(@Param('id') id: string) {
    const items = this.service.getUsageRecords(id);
    return paginated(items, { total: items.length });
  }
}
