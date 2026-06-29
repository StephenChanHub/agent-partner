import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ok, paginated } from '../../common/api-response';
import { AgentsService } from './agents.service';

@Controller()
export class AgentsController {
  constructor(private readonly service: AgentsService) {}

  @Get('agents')
  listPublished() {
    return ok(this.service.listPublished());
  }

  @Get('agents/:slug')
  getBySlug(@Param('slug') slug: string) {
    return ok(this.service.getBySlug(slug));
  }

  @Get('studio/agents')
  listAll(@Query() query: any) {
    const items = this.service.listAll(query);
    return paginated(items, { page: Number(query.page ?? 1), pageSize: Number(query.pageSize ?? 20), total: items.length });
  }

  @Post('studio/agents')
  create(@Body() dto: any) {
    return ok(this.service.create(dto));
  }

  @Get('studio/agents/:id')
  get(@Param('id') id: string) {
    return ok(this.service.get(id));
  }

  @Patch('studio/agents/:id')
  update(@Param('id') id: string, @Body() dto: any) {
    return ok(this.service.update(id, dto));
  }

  @Post('studio/agents/:id/publish')
  publish(@Param('id') id: string) {
    return ok(this.service.publish(id));
  }

  @Post('studio/agents/:id/disable')
  disable(@Param('id') id: string) {
    return ok(this.service.disable(id));
  }

  @Delete('studio/agents/:id')
  delete(@Param('id') id: string) {
    return ok(this.service.delete(id));
  }
}
