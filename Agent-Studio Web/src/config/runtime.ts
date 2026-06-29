export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Jarvis Studio';
export const APP_ENV = import.meta.env.VITE_APP_ENV || 'sandbox';
export const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 15000);
export const ENABLE_PROD_GUARDS = import.meta.env.VITE_ENABLE_PROD_GUARDS !== 'false';
export const ENABLE_AUDIT_PLACEHOLDERS = import.meta.env.VITE_ENABLE_AUDIT_PLACEHOLDERS !== 'false';
export const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || 'admin@jarvis.local';

export function isSandboxEnv() {
  return APP_ENV === 'sandbox' || APP_ENV === 'local' || APP_ENV === 'development';
}

export function makeRequestId() {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();
  return `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
