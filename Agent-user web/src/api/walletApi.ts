import { apiGet } from '../utils/apiClient';

export type ApiRechargePackage = {
  id: string;
  name: string;
  amountRmb: number;
  baseTokens: number;
  agentTokens: number;
  bonusTokens: number;
  discountPercent: number;
  status: 'ACTIVE' | 'DISABLED';
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export const walletApi = {
  getPackages: () => apiGet<ApiRechargePackage[]>('/billing/packages'),
};

/**
 * Wallet API readiness layer.
 *
 * V1.8.33 — getPackages is wired to the real backend.
 * Other endpoints are reserved for production hookup.
 */
export const walletApiContract = {
  getBalance: 'GET /me/usage',
  getPackages: 'GET /billing/packages',
  createRechargeOrder: 'POST /billing/recharge-orders',
  listRechargeOrders: 'GET /billing/recharge-orders',
  mockPayRechargeOrder: 'POST /billing/recharge-orders/{id}/mock-pay',
  listTokenTransactions: 'GET /billing/transactions',
} as const;

export type WalletApiContract = typeof walletApiContract;
