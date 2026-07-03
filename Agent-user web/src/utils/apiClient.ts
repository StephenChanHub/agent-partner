function normalizeApiBase(base: string) {
  return base.replace(/\/+$/, '');
}

function isLocalHost(hostname: string) {
  return ['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(hostname);
}

function browserHostname() {
  if (typeof window === 'undefined') return '';
  return window.location.hostname;
}

function resolveApiBase() {
  const explicitBase = String(import.meta.env.VITE_API_BASE_URL || '').trim();
  const apiPort = String(import.meta.env.VITE_API_PORT || '3000').trim();
  const apiPrefix = String(import.meta.env.VITE_API_PREFIX || 'api').replace(/^\/+|\/+$/g, '') || 'api';
  const hostFromBrowser = browserHostname();

  if (explicitBase) {
    if (explicitBase.startsWith('/')) return normalizeApiBase(explicitBase);

    try {
      const parsed = new URL(explicitBase);
      // A local API address works only on the developer's own machine. When the client is opened
      // through a VM/server IP, transparently bind the API host to that same visible host so the
      // user web always talks to the server instead of the visitor browser's localhost.
      if (hostFromBrowser && !isLocalHost(hostFromBrowser) && isLocalHost(parsed.hostname)) {
        parsed.hostname = hostFromBrowser;
        return normalizeApiBase(parsed.toString());
      }
    } catch {
      return normalizeApiBase(explicitBase);
    }

    return normalizeApiBase(explicitBase);
  }

  if (typeof window !== 'undefined' && hostFromBrowser) {
    return `${window.location.protocol}//${hostFromBrowser}:${apiPort}/${apiPrefix}`;
  }

  return `http://192.168.64.2:${apiPort}/${apiPrefix}`;
}

export const API_BASE = resolveApiBase();

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: { code?: string; message?: string; details?: Record<string, unknown> };
};

type ApiError = Error & { status?: number; code?: string; details?: Record<string, unknown> };

async function apiRequest<T>(method: 'GET' | 'POST' | 'DELETE', path: string, body?: unknown): Promise<T> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const res = await fetch(`${API_BASE}${normalizedPath}`, {
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
