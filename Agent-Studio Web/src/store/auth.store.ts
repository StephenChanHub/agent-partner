import { create } from 'zustand';
import type { AdminUser } from '../types/api';

const TOKEN_KEY = 'jarvis_studio_access_token';
const USER_KEY = 'jarvis_studio_admin_user';

type AuthState = {
  accessToken: string | null;
  admin: AdminUser | null;
  setSession: (input: { accessToken: string; admin: AdminUser }) => void;
  clearSession: () => void;
};

function readUser(): AdminUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AdminUser) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: localStorage.getItem(TOKEN_KEY),
  admin: readUser(),
  setSession: ({ accessToken, admin }) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(admin));
    set({ accessToken, admin });
  },
  clearSession: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ accessToken: null, admin: null });
  },
}));

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}
