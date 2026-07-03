import { useEffect, useState } from 'react';
import type { AuthSessionResponse, AuthUser } from '../api/authApi';

export type UserSession = {
  isLoggedIn: boolean;
  userId?: string;
  nickname: string;
  email: string;
  initials: string;
  tokens: number;
  usedTokens?: number;
  language: string;
  appearance: 'light' | 'dark' | 'system';
  accessToken?: string;
  refreshToken?: string;
  role?: 'USER' | 'ADMIN';
};

const STORAGE_KEY = 'agent-user-web:user-session';
export const USER_SESSION_EVENT = 'agent-user-web:user-session-change';
export const USER_AUTH_REQUIRED_EVENT = 'agent-user-web:auth-required';

export const demoUserSession: UserSession = {
  isLoggedIn: true,
  userId: 'demo',
  nickname: 'Stephen',
  email: 'stephen@did.local',
  initials: 'S',
  tokens: 10000,
  usedTokens: 0,
  language: 'English',
  appearance: 'system',
  role: 'USER',
};

export const guestUserSession: UserSession = {
  isLoggedIn: false,
  nickname: 'Guest',
  email: '',
  initials: 'G',
  tokens: 0,
  usedTokens: 0,
  language: 'English',
  appearance: 'system',
  role: 'USER',
};

function emitUserSessionChange() {
  window.dispatchEvent(new Event(USER_SESSION_EVENT));
}

export function requestUserAuth() {
  window.dispatchEvent(new Event(USER_AUTH_REQUIRED_EVENT));
}

export function isUserLoggedIn(session: Pick<UserSession, 'isLoggedIn' | 'accessToken'>) {
  return Boolean(session.isLoggedIn && session.accessToken);
}

function initialsFrom(name: string, email: string) {
  return (name || email || 'U').trim().charAt(0).toUpperCase();
}

export function readUserSession(): UserSession {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return guestUserSession;
    return { ...guestUserSession, ...JSON.parse(raw) } as UserSession;
  } catch {
    return guestUserSession;
  }
}

export function saveUserSession(nextSession: UserSession) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
  emitUserSessionChange();
}

export function saveAuthenticatedSession(payload: AuthSessionResponse) {
  const current = readUserSession();
  const user = payload.user;
  saveUserSession({
    ...current,
    isLoggedIn: true,
    userId: user.id,
    nickname: user.nickname || user.email,
    email: user.email,
    initials: user.initials || initialsFrom(user.nickname, user.email),
    tokens: Number(user.balanceTokens ?? current.tokens ?? 0),
    usedTokens: Number(user.usedTokens ?? current.usedTokens ?? 0),
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    role: user.role,
  });
}

export function updateUserFromApi(user: AuthUser) {
  const current = readUserSession();
  saveUserSession({
    ...current,
    isLoggedIn: true,
    userId: user.id,
    nickname: user.nickname || user.email,
    email: user.email,
    initials: user.initials || initialsFrom(user.nickname, user.email),
    tokens: Number(user.balanceTokens ?? current.tokens ?? 0),
    usedTokens: Number(user.usedTokens ?? current.usedTokens ?? 0),
    role: user.role,
  });
}

export function loginWithDemoAccount() {
  saveUserSession(demoUserSession);
}

export function logoutUserSession() {
  window.localStorage.removeItem(STORAGE_KEY);
  emitUserSessionChange();
}

export function updateUserSession(patch: Partial<UserSession>) {
  const current = readUserSession();
  saveUserSession({ ...current, ...patch });
}

export function useUserSession() {
  const [session, setSession] = useState<UserSession>(() => readUserSession());

  useEffect(() => {
    const sync = () => setSession(readUserSession());
    window.addEventListener(USER_SESSION_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(USER_SESSION_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return session;
}
