import { apiGet, apiPost } from '../utils/apiClient';

export type AuthUser = {
  id: string;
  email: string;
  nickname: string;
  role: 'USER' | 'ADMIN';
  avatarUrl?: string | null;
  balanceTokens?: number;
  usedTokens?: number;
  initials?: string;
};

export type AuthSessionResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export type SendEmailCodeResponse = {
  email: string;
  ttlSeconds: number;
  message: string;
  mockCode?: string;
};

export const authApi = {
  sendRegisterCode: (email: string) =>
    apiPost<SendEmailCodeResponse>('/auth/email-code/send', { email, purpose: 'REGISTER' }),
  register: (input: { email: string; password: string; nickname: string; verificationCode: string }) =>
    apiPost<AuthSessionResponse>('/auth/register', input),
  login: (input: { email: string; password: string }) =>
    apiPost<AuthSessionResponse>('/auth/login', input),
  logout: () => apiPost<{ loggedOut: boolean }>('/auth/logout'),
  me: () => apiGet<AuthUser>('/me'),
};
