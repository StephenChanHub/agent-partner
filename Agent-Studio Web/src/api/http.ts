import axios from 'axios';
import type { ApiEnvelope, PageResult } from '../types/api';
import { getAccessToken, useAuthStore } from '../store/auth.store';
import { API_TIMEOUT_MS, APP_ENV, APP_NAME, makeRequestId } from '../config/runtime';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.64.2:3000/api';

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
});

http.interceptors.request.use((config) => {
  const token = getAccessToken();
  const headers = config.headers as Record<string, string>;
  headers['X-Request-ID'] = makeRequestId();
  headers['X-Client-App'] = APP_NAME;
  headers['X-Client-Env'] = APP_ENV;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      useAuthStore.getState().clearSession();
    }
    const requestId = error?.config?.headers?.['X-Request-ID'];
    const apiMessage = error?.response?.data?.error?.message || error?.response?.data?.message;
    const status = error?.response?.status;
    const fallback = status ? `API 请求失败：HTTP ${status}` : 'API 请求失败，请确认 Core 沙盒是否启动。';
    const enriched = new Error(apiMessage || fallback) as Error & { requestId?: string; status?: number };
    enriched.requestId = requestId;
    enriched.status = status;
    return Promise.reject(enriched);
  },
);

export function unwrap<T>(envelope: ApiEnvelope<T>): T {
  if (!envelope.success) {
    throw new Error(envelope.error?.message || envelope.message || 'API request failed');
  }
  return envelope.data as T;
}

export async function getData<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const { data } = await http.get<ApiEnvelope<T>>(url, { params });
  return unwrap<T>(data);
}

export async function postData<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await http.post<ApiEnvelope<T>>(url, body ?? {});
  return unwrap<T>(data);
}

export async function patchData<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await http.patch<ApiEnvelope<T>>(url, body ?? {});
  return unwrap<T>(data);
}

export async function getPage<T>(url: string, params?: Record<string, unknown>): Promise<PageResult<T>> {
  return getData<PageResult<T>>(url, params);
}

export async function deleteData<T>(url: string): Promise<T> {
  const { data } = await http.delete<ApiEnvelope<T>>(url);
  return unwrap<T>(data);
}
