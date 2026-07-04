import { Injectable, NotFoundException } from '@nestjs/common';
import { mockModelProfiles } from '../../mock/mock-data';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { SecretCryptoService } from '../../infrastructure/crypto/secret-crypto.service';
import { CreateModelProfileDto } from './dto/create-model-profile.dto';
import { UpdateModelProfileDto } from './dto/update-model-profile.dto';
import { TestModelProfileDto } from './dto/test-model-profile.dto';

@Injectable()
export class ModelProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: SecretCryptoService,
  ) {}

  /** Returns the active default model profile with decrypted apiKey for LLM calls. */
  async getDefault(): Promise<{
    id: string;
    provider: string;
    displayName: string;
    modelName: string;
    baseUrl: string;
    apiKey: string;
    defaultTemperature: number;
    defaultMaxTokens: number;
  } | null> {
    if (this.prisma.isMockMode) {
      const item = mockModelProfiles.find((p: any) => p.status === 'ACTIVE' && p.isDefault);
      if (!item) return null;
      return {
        id: (item as any).id,
        provider: (item as any).provider,
        displayName: (item as any).displayName,
        modelName: (item as any).modelName,
        baseUrl: (item as any).baseUrl ?? '',
        apiKey: (item as any)._apiKeyRaw ?? '',
        defaultTemperature: (item as any).defaultTemperature ?? 0.7,
        defaultMaxTokens: (item as any).defaultMaxTokens ?? 512,
      };
    }

    const item = await (this.prisma.db as any).modelProfile.findFirst({
      where: { status: 'ACTIVE', isDefault: true },
    });
    if (!item) return null;
    return {
      id: item.id,
      provider: item.provider,
      displayName: item.displayName,
      modelName: item.modelName,
      baseUrl: item.baseUrl ?? '',
      apiKey: item.apiKeyEncrypted ? this.crypto.decryptSecret(item.apiKeyEncrypted) : '',
      defaultTemperature: Number(item.defaultTemperature ?? 0.7),
      defaultMaxTokens: Number(item.defaultMaxTokens ?? 512),
    };
  }

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
      _apiKeyRaw: dto.apiKey ?? '',
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
      item._apiKeyRaw = dto.apiKey;
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

  delete(id: string) {
    const index = mockModelProfiles.findIndex((profile) => profile.id === id);
    if (index === -1) throw new NotFoundException('Model profile not found');
    mockModelProfiles.splice(index, 1);
    return { deleted: true, id };
  }

  enable(id: string) {
    const item = this.get(id) as any;
    item.status = 'ACTIVE';
    item.updatedAt = new Date().toISOString();
    return item;
  }

  disable(id: string) {
    const item = this.get(id) as any;
    item.status = 'DISABLED';
    item.isDefault = false;
    item.updatedAt = new Date().toISOString();
    return item;
  }
}
