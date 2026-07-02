const API_BASE = 'http://localhost:3000/v1';

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  const envelope = await res.json();
  if (!envelope.success) throw new Error(envelope.message ?? 'API error');
  return envelope.data as T;
}
