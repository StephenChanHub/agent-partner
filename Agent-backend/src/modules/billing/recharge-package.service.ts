import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { mockRechargePackages } from '../../mock/mock-data';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PricingRuleService } from './pricing-rule.service';

type RechargePackageStatus = 'ACTIVE' | 'DISABLED';

type RechargePackageInput = {
  name?: string;
  amountRmb?: number;
  agentTokens?: number;
  status?: RechargePackageStatus;
  sortOrder?: number;
};

type RechargePackageRecord = {
  id: string;
  name: string;
  amountRmb: number;
  baseTokens: number;
  agentTokens: number;
  bonusTokens: number;
  discountPercent: number;
  status: RechargePackageStatus;
  sortOrder: number;
  createdAt: string | Date;
  updatedAt: string | Date;
};

const defaultRechargePackageTemplates = [
  { id: 'pkg_5', name: '¥5 基础包', amountRmb: 5, status: 'ACTIVE' as RechargePackageStatus, sortOrder: 10 },
  { id: 'pkg_10', name: '¥10 标准包', amountRmb: 10, status: 'ACTIVE' as RechargePackageStatus, sortOrder: 20 },
  { id: 'pkg_30', name: '¥30 进阶包', amountRmb: 30, status: 'ACTIVE' as RechargePackageStatus, sortOrder: 30 },
  { id: 'pkg_50', name: '¥50 高级包', amountRmb: 50, status: 'ACTIVE' as RechargePackageStatus, sortOrder: 40 },
  { id: 'pkg_100', name: '¥100 旗舰包', amountRmb: 100, status: 'ACTIVE' as RechargePackageStatus, sortOrder: 50 },
];

@Injectable()
export class RechargePackageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingRules: PricingRuleService,
  ) {}

  async listPackages(options: { includeDisabled?: boolean } = {}) {
    if (this.prisma.isMockMode) {
      await this.ensureMockDefaultsSeeded();
      return [...mockRechargePackages]
        .filter((pkg) => options.includeDisabled || pkg.status === 'ACTIVE')
        .sort((a, b) => (a.sortOrder ?? 100) - (b.sortOrder ?? 100) || a.amountRmb - b.amountRmb)
        .map((item) => this.serializePackage(item));
    }

    await this.ensureDefaultPackagesSeeded();
    const items = await (this.prisma.db as any).rechargePackage.findMany({
      where: options.includeDisabled ? undefined : { status: 'ACTIVE' },
      orderBy: [{ sortOrder: 'asc' }, { amountRmb: 'asc' }, { createdAt: 'asc' }],
    });
    return items.map((item: any) => this.serializePackage(item));
  }

  async getPackage(id: string, options: { includeDisabled?: boolean } = {}) {
    if (this.prisma.isMockMode) {
      await this.ensureMockDefaultsSeeded();
      const item = mockRechargePackages.find((pkg) => pkg.id === id && (options.includeDisabled || pkg.status === 'ACTIVE'));
      if (!item) throw new NotFoundException('Recharge package not found');
      return this.serializePackage(item);
    }

    await this.ensureDefaultPackagesSeeded();
    const item = await (this.prisma.db as any).rechargePackage.findFirst({
      where: { id, ...(options.includeDisabled ? {} : { status: 'ACTIVE' }) },
    });
    if (!item) throw new NotFoundException('Recharge package not found');
    return this.serializePackage(item);
  }

  async createPackage(dto: RechargePackageInput) {
    const payload = await this.normalizePackageInput(dto, { creating: true });

    if (this.prisma.isMockMode) {
      await this.ensureMockDefaultsSeeded();
      const now = new Date().toISOString();
      const item = {
        id: `pkg_${Date.now()}`,
        ...payload,
        createdAt: now,
        updatedAt: now,
      };
      mockRechargePackages.push(item as any);
      return this.serializePackage(item);
    }

    await this.ensureDefaultPackagesSeeded();
    const item = await (this.prisma.db as any).rechargePackage.create({ data: payload });
    return this.serializePackage(item);
  }

  async updatePackage(id: string, dto: RechargePackageInput) {
    const current = await this.getPackage(id, { includeDisabled: true });
    const payload = await this.normalizePackageInput(dto, { creating: false, current });

    if (this.prisma.isMockMode) {
      const index = mockRechargePackages.findIndex((pkg) => pkg.id === id);
      if (index === -1) throw new NotFoundException('Recharge package not found');
      mockRechargePackages[index] = {
        ...mockRechargePackages[index],
        ...payload,
        updatedAt: new Date().toISOString(),
      };
      return this.serializePackage(mockRechargePackages[index]);
    }

    try {
      const item = await (this.prisma.db as any).rechargePackage.update({ where: { id }, data: payload });
      return this.serializePackage(item);
    } catch (error: any) {
      if (error?.code === 'P2025') throw new NotFoundException('Recharge package not found');
      throw error;
    }
  }

  async deletePackage(id: string) {
    await this.getPackage(id, { includeDisabled: true });

    if (this.prisma.isMockMode) {
      const index = mockRechargePackages.findIndex((pkg) => pkg.id === id);
      if (index === -1) throw new NotFoundException('Recharge package not found');
      mockRechargePackages.splice(index, 1);
      return { deleted: true, id };
    }

    try {
      await (this.prisma.db as any).rechargePackage.delete({ where: { id } });
      return { deleted: true, id };
    } catch (error: any) {
      if (error?.code === 'P2025') throw new NotFoundException('Recharge package not found');
      throw error;
    }
  }

  async applyDiscount(id: string, dto: { bonusPercent?: number; reset?: boolean }) {
    const item = await this.getPackage(id, { includeDisabled: true });
    const baseTokens = await this.calculateBaseTokens(item.amountRmb);
    const bonusPercent = dto.reset ? 0 : this.normalizeBonusPercent(dto.bonusPercent ?? 0);
    const bonusTokens = Math.round(baseTokens * bonusPercent / 100);

    return this.updatePackage(id, {
      amountRmb: item.amountRmb,
      agentTokens: baseTokens + bonusTokens,
    });
  }

  private async normalizePackageInput(
    dto: RechargePackageInput,
    options: { creating: boolean; current?: RechargePackageRecord },
  ) {
    const amountRmb = dto.amountRmb !== undefined
      ? this.normalizeAmountRmb(dto.amountRmb)
      : options.current?.amountRmb ?? 10;
    const baseTokens = await this.calculateBaseTokens(amountRmb);
    const agentTokens = dto.agentTokens !== undefined
      ? this.normalizeAgentTokens(dto.agentTokens)
      : options.current?.agentTokens ?? baseTokens;
    const bonusTokens = Math.max(agentTokens - baseTokens, 0);

    const payload: Record<string, unknown> = {
      name: dto.name !== undefined ? this.normalizeName(dto.name) : options.current?.name ?? `¥${amountRmb} 套餐`,
      amountRmb,
      baseTokens,
      agentTokens,
      bonusTokens,
      discountPercent: baseTokens > 0 ? Math.round((bonusTokens / baseTokens) * 10000) / 100 : 0,
      status: dto.status !== undefined ? this.normalizeStatus(dto.status) : options.current?.status ?? 'ACTIVE',
      sortOrder: dto.sortOrder !== undefined ? this.normalizeSortOrder(dto.sortOrder) : options.current?.sortOrder ?? 100,
    };

    if (!options.creating && dto.name === undefined) delete payload.name;
    if (!options.creating && dto.status === undefined) delete payload.status;
    if (!options.creating && dto.sortOrder === undefined) delete payload.sortOrder;

    return payload;
  }

  private async calculateBaseTokens(amountRmb: number) {
    const agentTokensPerRmb = await this.pricingRules.numberValue('agentTokensPerRmb', 1000);
    return Math.round(amountRmb * agentTokensPerRmb);
  }

  private async ensureMockDefaultsSeeded() {
    if (mockRechargePackages.length > 0) return;
    const packages = await this.buildDefaultPackagesForCurrentPricing();
    mockRechargePackages.push(...packages as any[]);
  }

  private async ensureDefaultPackagesSeeded() {
    const count = await (this.prisma.db as any).rechargePackage.count();
    if (count > 0) return;
    const packages = await this.buildDefaultPackagesForCurrentPricing();
    await (this.prisma.db as any).rechargePackage.createMany({
      data: packages.map((pkg) => ({
        id: pkg.id,
        name: pkg.name,
        amountRmb: pkg.amountRmb,
        baseTokens: pkg.baseTokens,
        agentTokens: pkg.agentTokens,
        bonusTokens: pkg.bonusTokens,
        discountPercent: pkg.discountPercent,
        status: pkg.status,
        sortOrder: pkg.sortOrder,
        createdAt: new Date(pkg.createdAt),
        updatedAt: new Date(pkg.updatedAt),
      })),
      skipDuplicates: true,
    });
  }

  private async buildDefaultPackagesForCurrentPricing(): Promise<RechargePackageRecord[]> {
    const agentTokensPerRmb = await this.pricingRules.numberValue('agentTokensPerRmb', 1000);
    const now = new Date().toISOString();
    return defaultRechargePackageTemplates.map((template) => {
      const baseTokens = Math.round(template.amountRmb * agentTokensPerRmb);
      return {
        id: template.id,
        name: template.name,
        amountRmb: template.amountRmb,
        baseTokens,
        agentTokens: baseTokens,
        bonusTokens: 0,
        discountPercent: 0,
        status: template.status,
        sortOrder: template.sortOrder,
        createdAt: now,
        updatedAt: now,
      };
    });
  }

  private normalizeName(value: unknown) {
    const name = String(value ?? '').trim();
    if (!name) throw new BadRequestException('Package name is required');
    if (name.length > 128) throw new BadRequestException('Package name is too long');
    return name;
  }

  private normalizeAmountRmb(value: unknown) {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException('amountRmb must be greater than 0');
    return Math.round(amount * 100) / 100;
  }

  private normalizeAgentTokens(value: unknown) {
    const tokens = Number(value);
    if (!Number.isFinite(tokens) || tokens <= 0) throw new BadRequestException('agentTokens must be greater than 0');
    return Math.round(tokens);
  }

  private normalizeBonusPercent(value: unknown) {
    const percent = Number(value);
    if (!Number.isFinite(percent) || percent < 0) throw new BadRequestException('bonusPercent must be greater than or equal to 0');
    return percent;
  }

  private normalizeStatus(value: unknown): RechargePackageStatus {
    if (value === 'ACTIVE' || value === 'DISABLED') return value;
    throw new BadRequestException('Package status is invalid');
  }

  private normalizeSortOrder(value: unknown) {
    const sortOrder = Number(value ?? 100);
    if (!Number.isFinite(sortOrder) || sortOrder < 0) throw new BadRequestException('Package sortOrder is invalid');
    return Math.round(sortOrder);
  }

  private serializePackage(item: any): RechargePackageRecord {
    return {
      id: item.id,
      name: item.name,
      amountRmb: Number(item.amountRmb ?? 0),
      baseTokens: Number(item.baseTokens ?? 0),
      agentTokens: Number(item.agentTokens ?? 0),
      bonusTokens: Number(item.bonusTokens ?? 0),
      discountPercent: Number(item.discountPercent ?? 0),
      status: item.status,
      sortOrder: Number(item.sortOrder ?? 100),
      createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
      updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt,
    };
  }
}
