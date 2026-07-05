import { deleteData, getData, getPage, http, patchData, postData, unwrap } from './http';
import type {
  AdminUser,
  AgentRecord,
  DashboardSummary,
  ModelProfile,
  PageResult,
  PricingRule,
  RechargeOrder,
  RechargePackage,
  StudioUser,
  TokenTransaction,
  UsageRecord,
  VoiceProfile,
  MediaFile,
  TtsSettings,
} from '../types/api';

export const studioApi = {
  login: async (email: string, password: string) =>
    postData<{ user: AdminUser; accessToken: string; refreshToken: string }>('/auth/login', { email, password }),
  me: async () => getData<AdminUser>('/me'),
  dashboard: async () => getData<DashboardSummary>('/studio/dashboard'),
  health: async () => getData<Record<string, unknown>>('/health'),
  ready: async () => getData<Record<string, unknown>>('/ready'),

  users: async (params?: Record<string, unknown>) => getPage<StudioUser>('/studio/users', params),
  user: async (id: string) => getData<StudioUser>(`/studio/users/${id}`),
  adjustTokens: async (id: string, amountAgentTokens: number, reason: string) =>
    postData<{ userId: string; balanceBefore: number; amountTokens: number; balanceAfter: number }>(
      `/studio/users/${id}/tokens/adjust`,
      { amountAgentTokens, reason },
    ),
  userTransactions: async (id: string) => getPage<TokenTransaction>(`/studio/users/${id}/transactions`),
  userRechargeOrders: async (id: string) => getPage<RechargeOrder>(`/studio/users/${id}/recharge-orders`),
  userUsageRecords: async (id: string) => getPage<UsageRecord>(`/studio/users/${id}/usage-records`),

  agents: async (params?: Record<string, unknown>) => getPage<AgentRecord>('/studio/agents', params),
  agent: async (id: string) => getData<AgentRecord>(`/studio/agents/${id}`),
  createAgent: async (payload: unknown) => postData<AgentRecord>('/studio/agents', payload),
  updateAgent: async (id: string, payload: unknown) => patchData<AgentRecord>(`/studio/agents/${id}`, payload),
  publishAgent: async (id: string) => postData<AgentRecord>(`/studio/agents/${id}/publish`),
  disableAgent: async (id: string) => postData<AgentRecord>(`/studio/agents/${id}/disable`),
  deleteAgent: async (id: string) => deleteData<{ deleted: boolean; id: string }>(`/studio/agents/${id}`),

  modelProfiles: async (params?: Record<string, unknown>) => getPage<ModelProfile>('/studio/model-profiles', params),
  createModelProfile: async (payload: unknown) => postData<ModelProfile>('/studio/model-profiles', payload),
  updateModelProfile: async (id: string, payload: unknown) => patchData<ModelProfile>(`/studio/model-profiles/${id}`, payload),
  testModelProfile: async (id: string, prompt: string) => postData(`/studio/model-profiles/${id}/test`, { prompt }),
  setDefaultModelProfile: async (id: string) => postData<ModelProfile>(`/studio/model-profiles/${id}/set-default`),
  enableModelProfile: async (id: string) => postData<ModelProfile>(`/studio/model-profiles/${id}/enable`),
  disableModelProfile: async (id: string) => postData<ModelProfile>(`/studio/model-profiles/${id}/disable`),
  deleteModelProfile: async (id: string) => deleteData<{ deleted: boolean; id: string }>(`/studio/model-profiles/${id}`),

  voiceProfiles: async (params?: Record<string, unknown>) => getPage<VoiceProfile>('/studio/voice-profiles', params),
  voiceProfile: async (id: string) => getData<VoiceProfile>(`/studio/voice-profiles/${id}`),
  createVoiceProfile: async (payload: unknown) => postData<VoiceProfile>('/studio/voice-profiles', payload),
  updateVoiceProfile: async (id: string, payload: unknown) => patchData<VoiceProfile>(`/studio/voice-profiles/${id}`, payload),
  testVoiceProfile: async (id: string, text: string) => postData(`/studio/voice-profiles/${id}/test`, { text }),
  setDefaultVoiceProfile: async (id: string) => postData<VoiceProfile>(`/studio/voice-profiles/${id}/set-default`),
  publishVoiceProfile: async (id: string) => postData<VoiceProfile>(`/studio/voice-profiles/${id}/publish`),
  disableVoiceProfile: async (id: string) => postData<VoiceProfile>(`/studio/voice-profiles/${id}/disable`),
  deleteVoiceProfile: async (id: string) => deleteData<{ deleted: boolean; id: string }>(`/studio/voice-profiles/${id}`),

  ttsSettings: async () => getData<TtsSettings>('/studio/tts/settings'),
  updateTtsSettings: async (payload: { apiKey: string }) => patchData<TtsSettings>('/studio/tts/settings', payload),
  deleteTtsSettings: async () => deleteData<TtsSettings>('/studio/tts/settings'),

  uploadMedia: async (file: File, kind: 'agent-image' | 'agent-video' | 'voice-preview' | 'agent-avatar') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('kind', kind);
    const { data } = await http.post('/studio/media/upload', formData, {
      params: { kind },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrap<MediaFile>(data);
  },
  mediaFiles: async (kind?: string) => getPage<MediaFile>('/studio/media/files', kind ? { kind } : undefined),

  rechargeOrders: async (params?: Record<string, unknown>) => getPage<RechargeOrder>('/studio/recharge-orders', params),
  confirmRechargeOrder: async (id: string) => postData<{ order: RechargeOrder; alreadyPaid: boolean }>(`/studio/recharge-orders/${id}/confirm`),
  deleteRechargeOrder: async (id: string) => deleteData<{ deleted: boolean; id: string }>(`/studio/recharge-orders/${id}`),
  tokenTransactions: async (params?: Record<string, unknown>) => getPage<TokenTransaction>('/studio/token-transactions', params),
  usageRecords: async (params?: Record<string, unknown>) => getPage<UsageRecord>('/studio/usage-records', params),
  pricing: async () => getData<Record<string, unknown>>('/billing/pricing'),
  pricingRules: async () => getData<PricingRule[]>('/studio/billing/pricing-rules'),
  pricingRule: async (id: string) => getData<PricingRule>(`/studio/billing/pricing-rules/${id}`),
  createPricingRule: async (payload: Partial<PricingRule>) => postData<PricingRule>('/studio/billing/pricing-rules', payload),
  updatePricingRule: async (id: string, payload: Partial<PricingRule>) => patchData<PricingRule>(`/studio/billing/pricing-rules/${id}`, payload),
  deletePricingRule: async (id: string) => deleteData<{ deleted: boolean; id: string }>(`/studio/billing/pricing-rules/${id}`),
  packages: async () => getData<RechargePackage[]>('/studio/billing/packages'),
  createPackage: async (payload: Partial<RechargePackage>) => postData<RechargePackage>('/studio/billing/packages', payload),
  updatePackage: async (id: string, payload: Partial<RechargePackage>) => patchData<RechargePackage>(`/studio/billing/packages/${id}`, payload),
  deletePackage: async (id: string) => deleteData<{ deleted: boolean; id: string }>(`/studio/billing/packages/${id}`),
  applyPackageDiscount: async (id: string, payload: { bonusPercent?: number; reset?: boolean }) => postData<RechargePackage>(`/studio/billing/packages/${id}/discount`, payload),
};

export type ListResponse<T> = PageResult<T>;
