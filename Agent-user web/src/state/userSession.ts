import { useEffect, useState } from 'react';

export type UserSession = {
  isLoggedIn: boolean;
  nickname: string;
  email: string;
  initials: string;
  tokens: number;
  language: string;
  appearance: 'light' | 'dark' | 'system';
};

const STORAGE_KEY = 'agent-user-web:user-session';
export const USER_SESSION_EVENT = 'agent-user-web:user-session-change';

export const demoUserSession: UserSession = {
  isLoggedIn: true,
  nickname: 'Stephen',
  email: 'stephen@did.local',
  initials: 'S',
  tokens: 10000,
  language: 'English',
  appearance: 'system',
};

export const guestUserSession: UserSession = {
  isLoggedIn: false,
  nickname: 'Guest',
  email: 'guest@did.local',
  initials: 'G',
  tokens: 10000,
  language: 'English',
  appearance: 'system',
};

function emitUserSessionChange() {
  window.dispatchEvent(new Event(USER_SESSION_EVENT));
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
