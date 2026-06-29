import { Injectable, NotFoundException } from '@nestjs/common';
import { mockPricingRules } from '../../mock/mock-data';

type PricingRuleInput = {
  key?: string;
  label?: string;
  group?: 'CORE' | 'LLM' | 'TTS' | 'BALANCE' | 'VOICE' | 'SYSTEM';
  valueType?: 'NUMBER' | 'STRING' | 'BOOLEAN';
  value?: number | string | boolean;
  unit?: string;
  description?: string;
  editable?: boolean;
  status?: 'ACTIVE' | 'DISABLED';
  sortOrder?: number;
};

@Injectable()
export class PricingRuleService {
  listRules() {
    return [...mockPricingRules].sort((a, b) => (a.sortOrder ?? 100) - (b.sortOrder ?? 100));
  }

  getRule(id: string) {
    const item = mockPricingRules.find((rule) => rule.id === id);
    if (!item) throw new NotFoundException('Pricing rule not found');
    return item;
  }

  createRule(dto: PricingRuleInput) {
    const now = new Date().toISOString();
    const key = dto.key ?? `customRule.${Date.now()}`;
    const item = {
      id: `pricing_rule_${Date.now()}`,
      key,
      label: dto.label ?? key,
      group: dto.group ?? 'CORE',
      valueType: dto.valueType ?? 'NUMBER',
      value: dto.value ?? 0,
      unit: dto.unit ?? '',
      description: dto.description ?? '',
      editable: dto.editable ?? true,
      status: dto.status ?? 'ACTIVE',
      sortOrder: Number(dto.sortOrder ?? 100),
      createdAt: now,
      updatedAt: now,
    };
    mockPricingRules.push(item as any);
    return item;
  }

  updateRule(id: string, dto: PricingRuleInput) {
    const item = this.getRule(id) as any;
    Object.assign(item, { ...dto, updatedAt: new Date().toISOString() });
    if (dto.sortOrder !== undefined) item.sortOrder = Number(dto.sortOrder);
    return item;
  }

  deleteRule(id: string) {
    const index = mockPricingRules.findIndex((rule) => rule.id === id);
    if (index === -1) throw new NotFoundException('Pricing rule not found');
    mockPricingRules.splice(index, 1);
    return { deleted: true, id };
  }

  numberValue(key: string, fallback: number) {
    const rule = mockPricingRules.find((item) => item.key === key && item.status === 'ACTIVE');
    const value = Number(rule?.value ?? fallback);
    return Number.isFinite(value) ? value : fallback;
  }
}
