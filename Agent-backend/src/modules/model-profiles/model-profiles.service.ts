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

  async list() {
    if (this.prisma.isMockMode) return mockModelProfiles;
    const items = await (this.prisma.db as any).modelProfile.findMany({
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });
    return items.map((item: any) => this.serialize(item));
  }

  async create(dto: CreateModelProfileDto) {
    if (!this.prisma.isMockMode) {
      const payload: any = {
        provider: dto.provider,
        displayName: dto.displayName,
        modelName: dto.modelName,
        baseUrl: dto.baseUrl ?? '',
        apiKeyEncrypted: dto.apiKey ? this.crypto.encryptSecret(dto.apiKey) : null,
        apiKeyLastFour: dto.apiKey ? dto.apiKey.slice(-4) : null,
        defaultTemperature: dto.defaultTemperature ?? 0.7,
        defaultMaxTokens: dto.defaultMaxTokens ?? 512,
        defaultTimeoutMs: dto.defaultTimeoutMs ?? 30000,
        status: 'ACTIVE',
        isDefault: Boolean(dto.isDefault),
      };
      const saved = await (this.prisma.db as any).$transaction(async (tx: any) => {
        if (payload.isDefault) {
          await tx.modelProfile.updateMany({ data: { isDefault: false } });
        }
        return tx.modelProfile.create({ data: payload });
      });
      return this.serialize(saved);
    }

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

  async get(id: string) {
    if (!this.prisma.isMockMode) {
      const item = await (this.prisma.db as any).modelProfile.findUnique({ where: { id } });
      if (!item) throw new NotFoundException('Model profile not found');
      return this.serialize(item);
    }
    const item = mockModelProfiles.find((profile) => profile.id === id);
    if (!item) throw new NotFoundException('Model profile not found');
    return item;
  }

  async update(id: string, dto: UpdateModelProfileDto) {
    if (!this.prisma.isMockMode) {
      await this.get(id);
      const data: any = {
        ...(dto.displayName !== undefined ? { displayName: dto.displayName } : {}),
        ...(dto.modelName !== undefined ? { modelName: dto.modelName } : {}),
        ...(dto.baseUrl !== undefined ? { baseUrl: dto.baseUrl } : {}),
        ...(dto.defaultTemperature !== undefined ? { defaultTemperature: dto.defaultTemperature } : {}),
        ...(dto.defaultMaxTokens !== undefined ? { defaultMaxTokens: dto.defaultMaxTokens } : {}),
        ...(dto.defaultTimeoutMs !== undefined ? { defaultTimeoutMs: dto.defaultTimeoutMs } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.isDefault !== undefined ? { isDefault: Boolean(dto.isDefault) } : {}),
      };
      if (dto.apiKey !== undefined) {
        data.apiKeyEncrypted = dto.apiKey ? this.crypto.encryptSecret(dto.apiKey) : null;
        data.apiKeyLastFour = dto.apiKey ? dto.apiKey.slice(-4) : null;
      }
      const saved = await (this.prisma.db as any).$transaction(async (tx: any) => {
        if (dto.isDefault) await tx.modelProfile.updateMany({ data: { isDefault: false } });
        return tx.modelProfile.update({ where: { id }, data });
      });
      return this.serialize(saved);
    }

    const item = (await this.get(id)) as any;
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

  async test(id: string, dto: TestModelProfileDto) {
    const item = await this.get(id);
    return { success: true, id, provider: item.provider, modelName: item.modelName, latencyMs: 120, sampleOutput: 'Mock model profile test OK.', prompt: dto.prompt ?? 'hello' };
  }

  async setDefault(id: string) {
    if (!this.prisma.isMockMode) {
      await this.get(id);
      const saved = await (this.prisma.db as any).$transaction(async (tx: any) => {
        await tx.modelProfile.updateMany({ data: { isDefault: false } });
        return tx.modelProfile.update({ where: { id }, data: { isDefault: true, status: 'ACTIVE' } });
      });
      return this.serialize(saved);
    }

    await this.get(id);
    mockModelProfiles.forEach((profile) => { profile.isDefault = profile.id === id; });
    return this.get(id);
  }

  async delete(id: string) {
    if (!this.prisma.isMockMode) {
      await (this.prisma.db as any).modelProfile.delete({ where: { id } }).catch(() => {
        throw new NotFoundException('Model profile not found');
      });
      return { deleted: true, id };
    }

    const index = mockModelProfiles.findIndex((profile) => profile.id === id);
    if (index === -1) throw new NotFoundException('Model profile not found');
    mockModelProfiles.splice(index, 1);
    return { deleted: true, id };
  }

  async enable(id: string) {
    if (!this.prisma.isMockMode) {
      const item = await (this.prisma.db as any).modelProfile.update({
        where: { id },
        data: { status: 'ACTIVE' },
      }).catch(() => null);
      if (!item) throw new NotFoundException('Model profile not found');
      return this.serialize(item);
    }

    const item = (await this.get(id)) as any;
    item.status = 'ACTIVE';
    item.updatedAt = new Date().toISOString();
    return item;
  }

  async disable(id: string) {
    if (!this.prisma.isMockMode) {
      const item = await (this.prisma.db as any).modelProfile.update({
        where: { id },
        data: { status: 'DISABLED', isDefault: false },
      }).catch(() => null);
      if (!item) throw new NotFoundException('Model profile not found');
      return this.serialize(item);
    }

    const item = (await this.get(id)) as any;
    item.status = 'DISABLED';
    item.isDefault = false;
    item.updatedAt = new Date().toISOString();
    return item;
  }

  private serialize(item: any) {
    return {
      id: item.id,
      provider: item.provider,
      displayName: item.displayName,
      name: item.displayName,
      modelName: item.modelName,
      model: item.modelName,
      baseUrl: item.baseUrl ?? '',
      apiKeyConfigured: Boolean(item.apiKeyEncrypted),
      apiKeyMasked: item.apiKeyLastFour ? `****${item.apiKeyLastFour}` : '',
      defaultTemperature: item.defaultTemperature !== null ? Number(item.defaultTemperature) : undefined,
      defaultMaxTokens: item.defaultMaxTokens !== null ? Number(item.defaultMaxTokens) : undefined,
      defaultTimeoutMs: item.defaultTimeoutMs !== null ? Number(item.defaultTimeoutMs) : undefined,
      status: item.status,
      isDefault: Boolean(item.isDefault),
      createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
      updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt,
    };
  }
}
