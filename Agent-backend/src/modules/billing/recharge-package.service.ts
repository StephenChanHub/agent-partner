import { Injectable, NotFoundException } from '@nestjs/common';
import { mockRechargePackages } from '../../mock/mock-data';

type RechargePackageInput = {
  name?: string;
  amountRmb?: number;
  agentTokens?: number;
  status?: 'ACTIVE' | 'DISABLED';
  sortOrder?: number;
};

@Injectable()
export class RechargePackageService {
  listPackages() {
    return [...mockRechargePackages]
      .filter((pkg) => pkg.status === 'ACTIVE')
      .sort((a, b) => a.amountRmb - b.amountRmb);
  }

  getPackage(id: string) {
    const item = mockRechargePackages.find((pkg) => pkg.id === id);
    if (!item) throw new NotFoundException('Recharge package not found');
    return item;
  }

  createPackage(dto: RechargePackageInput) {
    const now = new Date().toISOString();
    const amountRmb = Number(dto.amountRmb ?? 10);
    const baseTokens = Math.round(amountRmb * 1000);
    const agentTokens = Math.round(Number(dto.agentTokens ?? baseTokens));
    const item = {
      id: `pkg_${Date.now()}`,
      name: dto.name ?? `¥${amountRmb} 套餐`,
      amountRmb,
      baseTokens,
      agentTokens,
      bonusTokens: Math.max(agentTokens - baseTokens, 0),
      discountPercent: baseTokens > 0 ? Math.round((Math.max(agentTokens - baseTokens, 0) / baseTokens) * 100) : 0,
      status: dto.status ?? 'ACTIVE',
      sortOrder: Number(dto.sortOrder ?? 100),
      createdAt: now,
      updatedAt: now,
    };
    mockRechargePackages.push(item as any);
    return item;
  }

  updatePackage(id: string, dto: RechargePackageInput) {
    const item = this.getPackage(id) as any;
    if (dto.name !== undefined) item.name = dto.name;
    if (dto.amountRmb !== undefined) item.amountRmb = Number(dto.amountRmb);
    const baseTokens = Math.round(Number(item.amountRmb) * 1000);
    item.baseTokens = baseTokens;
    if (dto.agentTokens !== undefined) item.agentTokens = Math.round(Number(dto.agentTokens));
    item.bonusTokens = Math.max(Number(item.agentTokens) - baseTokens, 0);
    item.discountPercent = baseTokens > 0 ? Math.round((item.bonusTokens / baseTokens) * 100) : 0;
    if (dto.status !== undefined) item.status = dto.status;
    if (dto.sortOrder !== undefined) item.sortOrder = Number(dto.sortOrder);
    item.updatedAt = new Date().toISOString();
    return item;
  }

  deletePackage(id: string) {
    const index = mockRechargePackages.findIndex((pkg) => pkg.id === id);
    if (index === -1) throw new NotFoundException('Recharge package not found');
    mockRechargePackages.splice(index, 1);
    return { deleted: true, id };
  }

  applyDiscount(id: string, dto: { bonusPercent?: number; reset?: boolean }) {
    const item = this.getPackage(id) as any;
    const baseTokens = Math.round(Number(item.amountRmb) * 1000);
    if (dto.reset) {
      item.baseTokens = baseTokens;
      item.agentTokens = baseTokens;
      item.bonusTokens = 0;
      item.discountPercent = 0;
      item.updatedAt = new Date().toISOString();
      return item;
    }
    const bonusPercent = Math.max(Number(dto.bonusPercent ?? 0), 0);
    const bonusTokens = Math.round(baseTokens * bonusPercent / 100);
    item.baseTokens = baseTokens;
    item.agentTokens = baseTokens + bonusTokens;
    item.bonusTokens = bonusTokens;
    item.discountPercent = bonusPercent;
    item.updatedAt = new Date().toISOString();
    return item;
  }
}
