let _apiBase: string | null = null;

function getApiBase(): string {
  if (_apiBase) return _apiBase;

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // LAN access (e.g. phone on same network) — route to Mac's port 3000.
    // Requires UTM port forward: Mac-IP:3000 → VM(192.168.64.2):3000
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

  // Local dev on the Mac — talk directly to the UTM VM.
  _apiBase =
    (typeof import.meta !== 'undefined' &&
      (import.meta as any).env?.VITE_API_BASE_URL) ||
    'http://192.168.64.2:3000/api';
  return _apiBase;
}

export async function apiGet<T>(path: string): Promise<T> {
  const base = getApiBase();
  const res = await fetch(`${base}${path}`);
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  const envelope = await res.json();
  if (!envelope.success) throw new Error(envelope.message ?? 'API error');
  return envelope.data as T;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const base = getApiBase();
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  const envelope = await res.json();
  if (!envelope.success) throw new Error(envelope.message ?? 'API error');
  return envelope.data as T;
}
