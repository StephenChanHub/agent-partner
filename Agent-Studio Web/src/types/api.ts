export type ApiMeta = {
  traceId?: string;
  mode?: string;
};

export type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  message?: string;
  meta?: ApiMeta;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type Pagination = {
  page: number;
  pageSize: number;
  total: number;
};

export type PageResult<T> = {
  items: T[];
  pagination: Pagination;
};

export type AdminUser = {
  id: string;
  email: string;
  nickname?: string;
  role: 'ADMIN' | 'USER';
};

export type StudioUser = {
  id: string;
  email: string;
  nickname: string;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'DISABLED' | 'ARCHIVED';
  balanceTokens: number;
  usedTokens: number;
  createdAt: string;
  lastSeenAt?: string;
};

export type AgentRecord = {
  id: string;
  slug: string;
  status: 'DRAFT' | 'PUBLISHED' | 'DISABLED' | 'ARCHIVED' | 'DELETED';
  version: string;
  createdAt: string;
  updatedAt: string;
  manifest: {
    identity: {
      name: string;
      slug?: string;
      description?: string;
      /** Reserved only. v1.7.3 UI does not expose avatar upload/url input. */
      avatarUrl?: string;
    };
    social?: {
      galleryImages?: Array<{ url: string; alt?: string; sortOrder?: number }>;
      galleryVideos?: Array<{ url: string; posterUrl?: string; title?: string; sortOrder?: number }>;
    };
    model?: { profileId?: string };
    voice?: {
      profileId?: string;
      displayName?: string;
      previewAudioUrl?: string;
    };
    config?: { prompt?: string };
  };
};

export type ModelProfile = {
  id: string;
  provider: string;
  displayName: string;
  name?: string;
  modelName: string;
  baseUrl?: string;
  status: 'ACTIVE' | 'DISABLED' | 'ARCHIVED' | 'DELETED' | string;
  isDefault: boolean;
  apiKeyConfigured: boolean;
  apiKeyMasked?: string;
  defaultTemperature?: number;
  defaultMaxTokens?: number;
  defaultTimeoutMs?: number;
  createdAt: string;
  updatedAt: string;
};

export type VoiceProfile = {
  id: string;
  provider: string;
  displayName: string;
  name?: string;
  voiceId: string;
  modelId: string;
  outputFormat: string;
  language: string;
  description?: string;
  /** Formal field: Voice Profile preview sample audio. */
  previewAudioUrl?: string;
  /** Legacy alias retained during migration from previewUrl. */
  previewUrl?: string;
  status: 'ACTIVE' | 'PUBLISHED' | 'DISABLED' | 'ARCHIVED' | 'DELETED';
  isDefault: boolean;
  apiKeyConfigured: boolean;
  defaultSpeed?: number;
  defaultStability?: number;
  defaultSimilarityBoost?: number;
  createdAt: string;
  updatedAt: string;
};

export type PricingRule = {
  id: string;
  key: string;
  label: string;
  group: 'CORE' | 'LLM' | 'TTS' | 'BALANCE' | 'VOICE' | 'SYSTEM';
  valueType: 'NUMBER' | 'STRING' | 'BOOLEAN';
  value: number | string | boolean;
  unit?: string;
  description?: string;
  editable: boolean;
  status: 'ACTIVE' | 'DISABLED';
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type RechargePackage = {
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

export type PackageDiscountAction = {
  bonusPercent?: number;
  reset?: boolean;
};

export type RechargeOrder = {
  id: string;
  orderNo: string;
  userId: string;
  userEmail: string;
  amountRmb: number;
  agentTokens: number;
  status: 'PENDING' | 'PAID' | 'EXPIRED';
  paymentProvider: string;
  paymentMethod: string;
  paymentTradeNo?: string;
  expiresAt: string;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TokenTransaction = {
  id: string;
  userId: string;
  userEmail: string;
  type: 'RECHARGE' | 'USAGE' | 'ADMIN_RECHARGE' | 'ADMIN_ADJUST' | 'REFUND' | 'GIFT';
  direction: 'CREDIT' | 'DEBIT';
  amountTokens: number;
  balanceBefore: number;
  balanceAfter: number;
  relatedOrderId?: string | null;
  relatedUsageRecordId?: string | null;
  operatorAdminId?: string | null;
  description?: string;
  createdAt: string;
};

export type UsageRecord = {
  id: string;
  userId: string;
  userEmail: string;
  agentId: string;
  agentSlug: string;
  mode: 'TEXT' | 'VOICE';
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  ttsCharacters: number;
  costTokens: number;
  createdAt: string;
};


export type StudioReadinessItem = {
  key: string;
  title: string;
  status: 'READY' | 'SANDBOX' | 'RESERVED' | 'BLOCKED';
  description: string;
  owner?: string;
};

export type StudioAuditEvent = {
  id: string;
  actorEmail: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  severity: 'INFO' | 'WARNING' | 'DANGER';
  createdAt: string;
};

export type DashboardSummary = {
  users: { total: number; active: number };
  agents: { total: number; published: number; drafts: number };
  billing: { todayRechargeRmb: number; todayUsedAgentTokens: number; transactionCount: number };
  runtime: { providerMode: string; readyForAdminStudio: boolean };
};
