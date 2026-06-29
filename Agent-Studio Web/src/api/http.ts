import axios from 'axios';
import type { ApiEnvelope, PageResult } from '../types/api';
import { getAccessToken, useAuthStore } from '../store/auth.store';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.64.2:3000/api';

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
});

http.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      useAuthStore.getState().clearSession();
    }
    return Promise.reject(error);
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
