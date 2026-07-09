import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ok, paginated } from '../../common/api-response';
import { ModelProfilesService } from './model-profiles.service';
import { CreateModelProfileDto } from './dto/create-model-profile.dto';
import { UpdateModelProfileDto } from './dto/update-model-profile.dto';
import { TestModelProfileDto } from './dto/test-model-profile.dto';

@Controller('studio/model-profiles')
export class ModelProfilesController {
  constructor(private readonly service: ModelProfilesService) {}

  @Get()
  async list() {
    const items = await this.service.list();
    return paginated(items, { total: items.length });
  }

  @Post()
  async create(@Body() dto: CreateModelProfileDto) { return ok(await this.service.create(dto)); }

  @Get(':id')
  async get(@Param('id') id: string) { return ok(await this.service.get(id)); }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateModelProfileDto) { return ok(await this.service.update(id, dto)); }

  @Post(':id/test')
  async test(@Param('id') id: string, @Body() dto: TestModelProfileDto) { return ok(await this.service.test(id, dto)); }

  @Post(':id/set-default')
  async setDefault(@Param('id') id: string) { return ok(await this.service.setDefault(id)); }

  @Post(':id/enable')
  async enable(@Param('id') id: string) { return ok(await this.service.enable(id)); }

  @Post(':id/disable')
  async disable(@Param('id') id: string) { return ok(await this.service.disable(id)); }

  @Delete(':id')
  async delete(@Param('id') id: string) { return ok(await this.service.delete(id)); }
}
