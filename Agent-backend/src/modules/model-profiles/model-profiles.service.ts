import { Injectable, NotFoundException } from '@nestjs/common';
import { mockModelProfiles } from '../../mock/mock-data';
import { CreateModelProfileDto } from './dto/create-model-profile.dto';
import { UpdateModelProfileDto } from './dto/update-model-profile.dto';
import { TestModelProfileDto } from './dto/test-model-profile.dto';

@Injectable()
export class ModelProfilesService {
  list() { return mockModelProfiles; }

  create(dto: CreateModelProfileDto) {
    const now = new Date().toISOString();
    const item = {
      id: `model_profile_${Date.now()}`,
      provider: dto.provider,
      displayName: dto.displayName,
      name: dto.displayName,
      modelName: dto.modelName,
      model: dto.modelName,
      baseUrl: dto.baseUrl ?? '',
      apiKeyConfigured: Boolean(dto.apiKey),
      apiKeyMasked: dto.apiKey ? '****' + dto.apiKey.slice(-4) : '',
      defaultTemperature: dto.defaultTemperature ?? 0.7,
      defaultMaxTokens: dto.defaultMaxTokens ?? 512,
      defaultTimeoutMs: dto.defaultTimeoutMs ?? 30000,
      status: 'ACTIVE' as const,
      isDefault: Boolean(dto.isDefault),
      createdAt: now,
      updatedAt: now,
    };
    if (item.isDefault) mockModelProfiles.forEach((profile) => (profile.isDefault = false));
    mockModelProfiles.push(item as any);
    return item;
  }

  get(id: string) {
    const item = mockModelProfiles.find((profile) => profile.id === id);
    if (!item) throw new NotFoundException('Model profile not found');
    return item;
  }

  update(id: string, dto: UpdateModelProfileDto) {
    const item = this.get(id) as any;
    if (dto.apiKey) {
      item.apiKeyConfigured = true;
      item.apiKeyMasked = '****' + dto.apiKey.slice(-4);
    }
    Object.assign(item, { ...dto, apiKey: undefined, updatedAt: new Date().toISOString() });
    if (dto.displayName) item.name = dto.displayName;
    if (dto.modelName) item.model = dto.modelName;
    if (dto.isDefault) mockModelProfiles.forEach((profile) => { profile.isDefault = profile.id === id; });
    return item;
  }

  test(id: string, dto: TestModelProfileDto) {
    const item = this.get(id);
    return { success: true, id, provider: item.provider, modelName: item.modelName, latencyMs: 120, sampleOutput: 'Mock model profile test OK.', prompt: dto.prompt ?? 'hello' };
  }

  setDefault(id: string) {
    this.get(id);
    mockModelProfiles.forEach((profile) => { profile.isDefault = profile.id === id; });
    return this.get(id);
  }
}
