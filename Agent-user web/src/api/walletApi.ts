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

export type ApiBillingPricing = {
  currency: 'AGENT_TOKENS' | string;
  agentTokensPerRmb: number;
  billingMultiplier: number;
  minimumTextBalance: number;
  minimumVoiceBalance: number;
  minimumBalance?: { text: number; voice: number };
  voiceReplyMaxChars: number;
  llm?: {
    provider: string;
    mode: string;
    inputCacheHitRmbPerMillion: number;
    inputCacheMissRmbPerMillion: number;
    outputRmbPerMillion: number;
  };
  tts?: {
    provider: string;
    mode: string;
    rmbPer100kCharacters: number;
    chargedAgentTokensPerCharacter: number;
  };
};

export const walletApi = {
  getPackages: () => apiGet<ApiRechargePackage[]>('/billing/packages'),
  getPricing: () => apiGet<ApiBillingPricing>('/billing/pricing'),
};

/**
 * Wallet API readiness layer.
 *
 * V1.8.34 — packages and pricing snapshot are wired to the backend so admin pricing-rule CRUD
 * immediately affects the client-visible pricing information and backend usage metering.
 */
export const walletApiContract = {
  getBalance: 'GET /me/usage',
  getPricing: 'GET /billing/pricing',
  getPackages: 'GET /billing/packages',
  createRechargeOrder: 'POST /billing/recharge-orders',
  listRechargeOrders: 'GET /billing/recharge-orders',
  mockPayRechargeOrder: 'POST /billing/recharge-orders/{id}/mock-pay',
  listTokenTransactions: 'GET /billing/transactions',
} as const;

export type WalletApiContract = typeof walletApiContract;
