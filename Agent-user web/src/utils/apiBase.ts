function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function inferApiBaseUrl() {
  if (typeof window === 'undefined') return 'http://127.0.0.1:3000/api';

  const { protocol, hostname, port, origin } = window.location;
  const devPorts = new Set(['5173', '5174', '4173', '4174']);
  const scheme = protocol === 'https:' ? 'https' : 'http';
  const host = hostname || '127.0.0.1';

  if (devPorts.has(port)) return `${scheme}://${host}:3000/api`;
  if (port === '3000') return `${origin}/api`;
  return `${origin}/api`;
}

export function getApiBaseUrl() {
  const configured = String(import.meta.env.VITE_API_BASE_URL ?? '').trim();
  return trimTrailingSlash(configured || inferApiBaseUrl());
}

export const API_BASE_URL = getApiBaseUrl();

export function resolveApiAssetUrl(url?: string) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
}
