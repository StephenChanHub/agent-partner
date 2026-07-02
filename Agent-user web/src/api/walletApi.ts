import { apiGet, apiPost } from '../utils/apiClient';

export type ApiPage<T> = {
  items: T[];
  pagination: { page: number; pageSize: number; total: number };
};

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

export type ApiRechargeOrder = {
  id: string;
  orderNo: string;
  userId: string;
  userEmail: string;
  amountRmb: number;
  currency: string;
  agentTokens: number;
  status: 'PENDING' | 'PAID' | 'EXPIRED';
  paymentProvider: string;
  paymentMethod: string;
  paymentTradeNo?: string;
  paymentPayload?: Record<string, unknown> | null;
  expiresAt: string;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiTokenTransaction = {
  id: string;
  userId: string;
  userEmail: string;
  type: 'RECHARGE' | 'USAGE' | 'ADMIN_RECHARGE' | 'ADMIN_ADJUST' | 'REFUND' | 'GIFT';
  direction: 'CREDIT' | 'DEBIT';
  amountTokens: number;
  balanceBefore: number;
  balanceAfter: number;
  relatedOrderId?: string | null;
  description?: string;
  createdAt: string;
};

export type ApiUsageBalance = {
  balanceAgentTokens: number;
  usedAgentTokens: number;
  billingMode: string;
  minimumTextBalance: number;
  minimumVoiceBalance: number;
  canUseTextChat: boolean;
  canUseVoiceChat: boolean;
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
  getBalance: () => apiGet<ApiUsageBalance>('/me/usage'),
  getPackages: () => apiGet<ApiRechargePackage[]>('/billing/packages'),
  getPricing: () => apiGet<ApiBillingPricing>('/billing/pricing'),
  createRechargeOrder: (packageId: string) => apiPost<ApiRechargeOrder>('/billing/recharge-orders', { packageId }),
  listRechargeOrders: () => apiGet<ApiPage<ApiRechargeOrder>>('/billing/recharge-orders'),
  listTokenTransactions: () => apiGet<ApiPage<ApiTokenTransaction>>('/billing/transactions'),
};

/**
 * Wallet API readiness layer.
 *
 * V1.8.35 — recharge orders now use a manual admin confirmation flow:
 * client Payed => PENDING order, admin Confirm => balance credit, pending orders expire after 5 minutes.
 */
export const walletApiContract = {
  getBalance: 'GET /me/usage',
  getPricing: 'GET /billing/pricing',
  getPackages: 'GET /billing/packages',
  createRechargeOrder: 'POST /billing/recharge-orders',
  listRechargeOrders: 'GET /billing/recharge-orders',
  listTokenTransactions: 'GET /billing/transactions',
} as const;

export type WalletApiContract = typeof walletApiContract;
