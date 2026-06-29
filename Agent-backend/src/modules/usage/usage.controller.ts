import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ok, paginated } from '../../common/api-response';
import { UsageService } from './usage.service';
import { AdjustBalanceDto } from './dto/adjust-balance.dto';

@Controller()
export class UsageController {
  constructor(private readonly usageService: UsageService) {}

  @Get('me/usage')
  getMyUsage() { return ok(this.usageService.getMyUsage()); }

  @Get('me/usage-records')
  getMyUsageRecords() { return ok(this.usageService.getMyUsageRecords()); }

  @Get('studio/usage-records')
  getAllUsageRecords(@Query() query: any) {
    const items = this.usageService.getAllUsageRecords(query);
    return paginated(items, { page: Number(query.page ?? 1), pageSize: Number(query.pageSize ?? 20), total: items.length });
  }

  @Get('studio/users/:id/usage')
  getUserUsage(@Param('id') userId: string) { return ok(this.usageService.getUserUsage(userId)); }

  @Get('studio/users/:id/usage-records')
  getUserUsageRecords(@Param('id') userId: string) { return ok(this.usageService.getUserUsageRecords(userId)); }

  @Post('studio/users/:id/balance/adjust')
  adjustBalance(@Param('id') userId: string, @Body() dto: AdjustBalanceDto) {
    return ok(this.usageService.adjustBalance(userId, dto));
  }
}
