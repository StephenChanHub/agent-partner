import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { mockPricingRules } from '../../mock/mock-data';
import { PrismaService } from '../../infrastructure/database/prisma.service';

type PricingRuleGroup = 'CORE' | 'LLM' | 'TTS' | 'BALANCE' | 'VOICE' | 'SYSTEM';
type PricingRuleValueType = 'NUMBER' | 'STRING' | 'BOOLEAN';
type PricingRuleStatus = 'ACTIVE' | 'DISABLED' | 'ARCHIVED' | 'PUBLISHED';

type PricingRuleInput = {
  key?: string;
  label?: string;
  group?: PricingRuleGroup;
  valueType?: PricingRuleValueType;
  value?: number | string | boolean;
  unit?: string | null;
  description?: string | null;
  editable?: boolean;
  status?: PricingRuleStatus;
  sortOrder?: number;
};

type PricingRuleRecord = Required<Omit<PricingRuleInput, 'unit' | 'description'>> & {
  id: string;
  unit?: string | null;
  description?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

const defaultPricingRules = mockPricingRules.map((rule) => ({ ...rule }));

@Injectable()
export class PricingRuleService {
  constructor(private readonly prisma: PrismaService) {}

  async listRules() {
    if (this.prisma.isMockMode) {
      return this.listMockRules();
    }
    await this.ensureDefaultRulesSeeded();
    const items = await (this.prisma.db as any).pricingRule.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return items.map((item: any) => this.serializeRule(item));
  }

  async getRule(id: string) {
    if (this.prisma.isMockMode) return this.getMockRule(id);
    const item = await (this.prisma.db as any).pricingRule.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Pricing rule not found');
    return this.serializeRule(item);
  }

  async createRule(dto: PricingRuleInput) {
    const payload = this.normalizeInput(dto, { creating: true });
    if (this.prisma.isMockMode) return this.createMockRule(payload);

    try {
      const item = await (this.prisma.db as any).pricingRule.create({ data: payload });
      return this.serializeRule(item);
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException('Pricing rule key already exists');
      throw error;
    }
  }

  async updateRule(id: string, dto: PricingRuleInput) {
    const current = await this.getRule(id);
    if (!current.editable && dto.editable !== true) {
      throw new BadRequestException('This pricing rule is read-only');
    }

    const payload = this.normalizeInput(dto, { creating: false, currentValueType: current.valueType });
    delete (payload as any).key;

    if (this.prisma.isMockMode) return this.updateMockRule(id, payload);

    try {
      const item = await (this.prisma.db as any).pricingRule.update({ where: { id }, data: payload });
      return this.serializeRule(item);
    } catch (error: any) {
      if (error?.code === 'P2025') throw new NotFoundException('Pricing rule not found');
      throw error;
    }
  }

  async deleteRule(id: string) {
    const current = await this.getRule(id);
    if (!current.editable) throw new BadRequestException('This pricing rule is read-only');

    if (this.prisma.isMockMode) {
      const index = mockPricingRules.findIndex((rule) => rule.id === id);
      if (index === -1) throw new NotFoundException('Pricing rule not found');
      mockPricingRules.splice(index, 1);
      return { deleted: true, id };
    }

    try {
      await (this.prisma.db as any).pricingRule.delete({ where: { id } });
      return { deleted: true, id };
    } catch (error: any) {
      if (error?.code === 'P2025') throw new NotFoundException('Pricing rule not found');
      throw error;
    }
  }

  async numberValue(key: string, fallback: number) {
    const rule = await this.findActiveRuleByKey(key);
    const value = Number(rule?.value ?? fallback);
    return Number.isFinite(value) ? value : fallback;
  }

  async valuesByKey<T extends Record<string, number>>(fallbacks: T): Promise<T> {
    const result = { ...fallbacks };
    const keys = Object.keys(fallbacks);

    if (this.prisma.isMockMode) {
      for (const key of keys) {
        const rule = mockPricingRules.find((item) => item.key === key && item.status === 'ACTIVE');
        const value = Number(rule?.value ?? fallbacks[key]);
        (result as Record<string, number>)[key] = Number.isFinite(value) ? value : fallbacks[key];
      }
      return result;
    }

    await this.ensureDefaultRulesSeeded();
    const items = await (this.prisma.db as any).pricingRule.findMany({
      where: { key: { in: keys }, status: 'ACTIVE' },
    });
    for (const item of items) {
      const value = Number(item.value ?? fallbacks[item.key]);
      if (Number.isFinite(value)) (result as Record<string, number>)[item.key] = value;
    }
    return result;
  }

  private listMockRules() {
    return [...mockPricingRules]
      .sort((a, b) => (a.sortOrder ?? 100) - (b.sortOrder ?? 100))
      .map((item) => this.serializeRule(item));
  }

  private getMockRule(id: string) {
    const item = mockPricingRules.find((rule) => rule.id === id);
    if (!item) throw new NotFoundException('Pricing rule not found');
    return this.serializeRule(item);
  }

  private createMockRule(dto: PricingRuleInput) {
    if (mockPricingRules.some((rule) => rule.key === dto.key)) {
      throw new ConflictException('Pricing rule key already exists');
    }
    const now = new Date().toISOString();
    const item = {
      id: `pricing_rule_${Date.now()}`,
      key: dto.key,
      label: dto.label,
      group: dto.group,
      valueType: dto.valueType,
      value: dto.value,
      unit: dto.unit ?? '',
      description: dto.description ?? '',
      editable: dto.editable ?? true,
      status: dto.status ?? 'ACTIVE',
      sortOrder: Number(dto.sortOrder ?? 100),
      createdAt: now,
      updatedAt: now,
    };
    mockPricingRules.push(item as any);
    return this.serializeRule(item);
  }

  private updateMockRule(id: string, dto: PricingRuleInput) {
    const item = mockPricingRules.find((rule) => rule.id === id) as any;
    if (!item) throw new NotFoundException('Pricing rule not found');
    const nextValueType = (dto.valueType ?? item.valueType) as PricingRuleValueType;
    const patch = { ...dto };
    if (patch.value !== undefined) patch.value = this.coerceValue(patch.value, nextValueType);
    Object.assign(item, { ...patch, updatedAt: new Date().toISOString() });
    if (dto.sortOrder !== undefined) item.sortOrder = Number(dto.sortOrder);
    return this.serializeRule(item);
  }

  private async findActiveRuleByKey(key: string) {
    if (this.prisma.isMockMode) {
      return mockPricingRules.find((item) => item.key === key && item.status === 'ACTIVE');
    }
    await this.ensureDefaultRulesSeeded();
    const item = await (this.prisma.db as any).pricingRule.findFirst({ where: { key, status: 'ACTIVE' } });
    return item ? this.serializeRule(item) : null;
  }

  private async ensureDefaultRulesSeeded() {
    const count = await (this.prisma.db as any).pricingRule.count();
    if (count > 0) return;
    await (this.prisma.db as any).pricingRule.createMany({
      data: defaultPricingRules.map((rule) => ({
        key: rule.key,
        label: rule.label,
        group: rule.group,
        valueType: rule.valueType,
        value: rule.value,
        unit: rule.unit,
        description: rule.description,
        editable: rule.editable,
        status: rule.status,
        sortOrder: rule.sortOrder,
        createdAt: new Date(rule.createdAt),
        updatedAt: new Date(),
      })),
      skipDuplicates: true,
    });
  }

  private normalizeInput(dto: PricingRuleInput, options: { creating: boolean; currentValueType?: PricingRuleValueType }): PricingRuleInput {
    const payload: PricingRuleInput = {};

    if (options.creating) {
      const key = dto.key?.trim();
      if (!key) throw new BadRequestException('Pricing rule key is required');
      if (!/^[a-zA-Z][a-zA-Z0-9._-]{1,127}$/.test(key)) {
        throw new BadRequestException('Pricing rule key format is invalid');
      }
      payload.key = key;
      payload.label = dto.label?.trim() || key;
      payload.group = this.normalizeGroup(dto.group ?? 'CORE');
      payload.valueType = this.normalizeValueType(dto.valueType ?? 'NUMBER');
      payload.value = this.coerceValue(dto.value ?? 0, payload.valueType);
      payload.editable = dto.editable ?? true;
      payload.status = this.normalizeStatus(dto.status ?? 'ACTIVE');
      payload.sortOrder = this.normalizeSortOrder(dto.sortOrder ?? 100);
    } else {
      if (dto.label !== undefined) payload.label = dto.label.trim();
      if (dto.group !== undefined) payload.group = this.normalizeGroup(dto.group);
      if (dto.valueType !== undefined) payload.valueType = this.normalizeValueType(dto.valueType);
      if (dto.value !== undefined) payload.value = dto.value;
      if (dto.editable !== undefined) payload.editable = Boolean(dto.editable);
      if (dto.status !== undefined) payload.status = this.normalizeStatus(dto.status);
      if (dto.sortOrder !== undefined) payload.sortOrder = this.normalizeSortOrder(dto.sortOrder);
    }

    if (dto.unit !== undefined) payload.unit = dto.unit?.trim() ?? '';
    if (dto.description !== undefined) payload.description = dto.description?.trim() ?? '';

    if (!options.creating && payload.value !== undefined) {
      payload.value = this.coerceValue(payload.value, dto.valueType ?? options.currentValueType ?? 'NUMBER');
    }

    return payload;
  }

  private normalizeGroup(value: unknown): PricingRuleGroup {
    const allowed: PricingRuleGroup[] = ['CORE', 'LLM', 'TTS', 'BALANCE', 'VOICE', 'SYSTEM'];
    if (allowed.includes(value as PricingRuleGroup)) return value as PricingRuleGroup;
    throw new BadRequestException('Pricing rule group is invalid');
  }

  private normalizeValueType(value: unknown): PricingRuleValueType {
    const allowed: PricingRuleValueType[] = ['NUMBER', 'STRING', 'BOOLEAN'];
    if (allowed.includes(value as PricingRuleValueType)) return value as PricingRuleValueType;
    throw new BadRequestException('Pricing rule value type is invalid');
  }

  private normalizeStatus(value: unknown): PricingRuleStatus {
    const allowed: PricingRuleStatus[] = ['ACTIVE', 'DISABLED', 'ARCHIVED', 'PUBLISHED'];
    if (allowed.includes(value as PricingRuleStatus)) return value as PricingRuleStatus;
    throw new BadRequestException('Pricing rule status is invalid');
  }

  private normalizeSortOrder(value: unknown) {
    const sortOrder = Number(value ?? 100);
    if (!Number.isFinite(sortOrder) || sortOrder < 0) throw new BadRequestException('Pricing rule sortOrder is invalid');
    return Math.round(sortOrder);
  }

  private coerceValue(value: unknown, valueType?: PricingRuleValueType) {
    if (valueType === 'BOOLEAN') return value === true || value === 'true' || value === 1 || value === '1';
    if (valueType === 'STRING') return String(value ?? '');
    const numberValue = Number(value ?? 0);
    if (!Number.isFinite(numberValue)) throw new BadRequestException('Pricing rule value must be a finite number');
    return numberValue;
  }

  private serializeRule(item: any): PricingRuleRecord {
    return {
      id: item.id,
      key: item.key,
      label: item.label,
      group: item.group,
      valueType: item.valueType,
      value: item.value,
      unit: item.unit ?? '',
      description: item.description ?? '',
      editable: Boolean(item.editable),
      status: item.status,
      sortOrder: Number(item.sortOrder ?? 100),
      createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
      updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt,
    };
  }
}
