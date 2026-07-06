let _apiBase: string | null = null;

function getApiBase(): string {
  if (_apiBase) return _apiBase;

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // LAN / server access — keep API on the same VM/server IP, port 3000.
    if (
      hostname &&
      hostname !== 'localhost' &&
      hostname !== '127.0.0.1' &&
      !hostname.startsWith('192.168.64.')
    ) {
      _apiBase = `${window.location.protocol}//${hostname}:3000/api`;
      return _apiBase;
    }
  }

  _apiBase =
    (typeof import.meta !== 'undefined' &&
      (import.meta as any).env?.VITE_API_BASE_URL) ||
    'http://192.168.64.2:3000/api';
  return _apiBase as string;
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('agent-user-web:user-session');
    if (!raw) return null;
    const session = JSON.parse(raw) as { accessToken?: string };
    return session.accessToken || null;
  } catch {
    return null;
  }
}

async function parseApiResponse<T>(res: Response, path: string): Promise<T> {
  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    // ignore non-json responses
  }

  if (!res.ok) {
    const message =
      payload?.message ||
      payload?.error?.message ||
      (Array.isArray(payload?.errors) ? payload.errors.join('\n') : '') ||
      `API ${path} failed: ${res.status}`;
    throw new Error(message);
  }

  if (payload?.success === false) {
    throw new Error(payload?.message || payload?.error?.message || 'API error');
  }

  return (payload?.success === true ? payload.data : payload) as T;
}

function buildHeaders(body?: unknown): HeadersInit {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export function getApiAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function resolveApiUrl(path?: string): string {
  if (!path) return '';
  if (/^(https?:|blob:)/i.test(path)) return path;

  const base = getApiBase().replace(/\/$/, '');
  if (path.startsWith('/api/')) {
    return `${base}${path.slice('/api'.length)}`;
  }
  if (path.startsWith('/')) {
    return `${base}${path}`;
  }
  return `${base}/${path}`;
}

export async function apiGet<T>(path: string): Promise<T> {
  const base = getApiBase();
  const res = await fetch(`${base}${path}`, { headers: buildHeaders() });
  return parseApiResponse<T>(res, path);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const base = getApiBase();
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: buildHeaders(body),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return parseApiResponse<T>(res, path);
}
