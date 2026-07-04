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
  list() { const items = this.service.list(); return paginated(items, { total: items.length }); }

  @Post()
  create(@Body() dto: CreateModelProfileDto) { return ok(this.service.create(dto)); }

  @Get(':id')
  get(@Param('id') id: string) { return ok(this.service.get(id)); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateModelProfileDto) { return ok(this.service.update(id, dto)); }

  @Post(':id/test')
  test(@Param('id') id: string, @Body() dto: TestModelProfileDto) { return ok(this.service.test(id, dto)); }

  @Post(':id/set-default')
  setDefault(@Param('id') id: string) { return ok(this.service.setDefault(id)); }

  @Post(':id/enable')
  enable(@Param('id') id: string) { return ok(this.service.enable(id)); }

  @Post(':id/disable')
  disable(@Param('id') id: string) { return ok(this.service.disable(id)); }

  @Delete(':id')
  delete(@Param('id') id: string) { return ok(this.service.delete(id)); }
}
