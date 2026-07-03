import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ok, paginated } from '../../common/api-response';
import { AgentsService } from './agents.service';

@Controller()
export class AgentsController {
  constructor(private readonly service: AgentsService) {}

  @Get('agents')
  async listPublished() {
    return ok(await this.service.listPublished());
  }

  @Get('agents/:slug')
  async getBySlug(@Param('slug') slug: string) {
    return ok(await this.service.getBySlug(slug));
  }

  @Get('studio/agents')
  async listAll(@Query() query: any) {
    const items = await this.service.listAll(query);
    return paginated(items, { page: Number(query.page ?? 1), pageSize: Number(query.pageSize ?? 20), total: items.length });
  }

  @Post('studio/agents')
  async create(@Body() dto: any) {
    return ok(await this.service.create(dto));
  }

  @Get('studio/agents/:id')
  async get(@Param('id') id: string) {
    return ok(await this.service.get(id));
  }

  @Patch('studio/agents/:id')
  async update(@Param('id') id: string, @Body() dto: any) {
    return ok(await this.service.update(id, dto));
  }

  @Post('studio/agents/:id/publish')
  async publish(@Param('id') id: string) {
    return ok(await this.service.publish(id));
  }

  @Post('studio/agents/:id/disable')
  async disable(@Param('id') id: string) {
    return ok(await this.service.disable(id));
  }

  @Delete('studio/agents/:id')
  async delete(@Param('id') id: string) {
    return ok(await this.service.delete(id));
  }
}
