const API_BASE =
  (typeof import.meta !== 'undefined' &&
    (import.meta as any).env?.VITE_API_BASE_URL) ||
  'http://localhost:3000/api';

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  const envelope = await res.json();
  if (!envelope.success) throw new Error(envelope.message ?? 'API error');
  return envelope.data as T;
}
