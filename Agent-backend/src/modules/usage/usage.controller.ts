import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { ok, paginated } from '../../common/api-response';
import { UsageService } from './usage.service';
import { AdjustBalanceDto } from './dto/adjust-balance.dto';

@Controller()
export class UsageController {
  constructor(private readonly usageService: UsageService) {}

  @Get('me/usage')
  async getMyUsage(@Headers('authorization') authorization?: string) { return ok(await this.usageService.getMyUsage(authorization)); }

  @Get('me/usage-records')
  async getMyUsageRecords(@Headers('authorization') authorization?: string) { return ok(await this.usageService.getMyUsageRecords(authorization)); }

  @Get('studio/usage-records')
  getAllUsageRecords(@Query() query: any) {
    const items = this.usageService.getAllUsageRecords(query);
    return paginated(items, { page: Number(query.page ?? 1), pageSize: Number(query.pageSize ?? 20), total: items.length });
  }

  @Get('studio/users/:id/usage')
  async getUserUsage(@Param('id') userId: string) { return ok(await this.usageService.getUserUsage(userId)); }

  @Get('studio/users/:id/usage-records')
  getUserUsageRecords(@Param('id') userId: string) { return ok(this.usageService.getUserUsageRecords(userId)); }

  @Post('studio/users/:id/balance/adjust')
  adjustBalance(@Param('id') userId: string, @Body() dto: AdjustBalanceDto) {
    return ok(this.usageService.adjustBalance(userId, dto));
  }
}
