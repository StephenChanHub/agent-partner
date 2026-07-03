const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://192.168.64.2:3000/api';

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: { code?: string; message?: string; details?: Record<string, unknown> };
};

type ApiError = Error & { status?: number; code?: string; details?: Record<string, unknown> };

async function apiRequest<T>(method: 'GET' | 'POST' | 'DELETE', path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const envelope = (await res.json().catch(() => ({}))) as ApiEnvelope<T> & Record<string, any>;
  if (!res.ok || envelope.success === false) {
    const rawMessage = envelope.error?.message || envelope.message || envelope.response?.message;
    const nestedMessage = typeof rawMessage === 'object' && rawMessage !== null && 'message' in rawMessage
      ? String((rawMessage as { message?: unknown }).message ?? '')
      : '';
    const message = typeof rawMessage === 'string'
      ? rawMessage
      : nestedMessage || `API ${path} failed: ${res.status}`;
    const error = new Error(message) as ApiError;
    error.status = res.status;
    error.code = envelope.error?.code || envelope.response?.code || (typeof rawMessage === 'object' && rawMessage !== null && 'code' in rawMessage ? String((rawMessage as { code?: unknown }).code ?? '') : undefined);
    error.details = envelope.error?.details || envelope.response || envelope;
    throw error;
  }

  return envelope.data as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>('GET', path);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>('POST', path, body ?? {});
}

export async function apiDelete<T>(path: string): Promise<T> {
  return apiRequest<T>('DELETE', path);
}
