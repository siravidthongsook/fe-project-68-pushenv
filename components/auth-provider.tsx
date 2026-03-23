'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  startTransition,
} from 'react';
import { useRouter } from 'next/navigation';
import { AUTH_STORAGE_KEY } from '@/lib/constants';
import { getMe, loginUser, logoutUser, registerUser } from '@/lib/api';
import type { Role, User } from '@/lib/types';

type AuthStatus = 'loading' | 'anonymous' | 'authenticated';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<User>;
  register: (data: {
    name: string;
    telephone: string;
    email: string;
    password: string;
    role: Role;
  }) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredToken() {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage.getItem(AUTH_STORAGE_KEY);
}

function storeToken(token: string | null) {
  if (typeof window === 'undefined') {
    return;
  }

  if (token) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const router = useRouter();

  const hydrate = useCallback(async (nextToken: string | null) => {
    if (!nextToken) {
      setToken(null);
      setUser(null);
      setStatus('anonymous');
      return null;
    }

    try {
      const nextUser = await getMe(nextToken);
      setToken(nextToken);
      setUser(nextUser);
      setStatus('authenticated');
      return nextUser;
    } catch {
      storeToken(null);
      setToken(null);
      setUser(null);
      setStatus('anonymous');
      return null;
    }
  }, []);

  useEffect(() => {
    const existing = readStoredToken();
    void hydrate(existing);
  }, [hydrate]);

  const login = useCallback(async (email: string, password: string) => {
    const nextToken = await loginUser(email, password);
    storeToken(nextToken);
    const nextUser = await hydrate(nextToken);
    if (!nextUser) {
      throw new Error('ไม่สามารถโหลดเซสชันหลังเข้าสู่ระบบได้');
    }
    return nextUser;
  }, [hydrate]);

  const register = useCallback(async (data: {
    name: string;
    telephone: string;
    email: string;
    password: string;
  }) => {
    const nextToken = await registerUser({ ...data, role: 'user' });
    storeToken(nextToken);
    const nextUser = await hydrate(nextToken);
    if (!nextUser) {
      throw new Error('ไม่สามารถโหลดเซสชันหลังลงทะเบียนได้');
    }
    return nextUser;
  }, [hydrate]);

  const logout = useCallback(async () => {
    const currentToken = token ?? readStoredToken();
    try {
      if (currentToken) {
        await logoutUser(currentToken);
      }
    } finally {
      storeToken(null);
      setToken(null);
      setUser(null);
      setStatus('anonymous');
      startTransition(() => {
        router.push('/login');
        router.refresh();
      });
    }
  }, [router, token]);

  const refresh = useCallback(async () => {
    const currentToken = token ?? readStoredToken();
    return hydrate(currentToken);
  }, [hydrate, token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      status,
      login,
      register,
      logout,
      refresh,
    }),
    [login, logout, refresh, register, status, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth ต้องใช้ภายใน AuthProvider');
  }
  return value;
}

export function useOptionalAuth() {
  return useContext(AuthContext) ?? null;
}
