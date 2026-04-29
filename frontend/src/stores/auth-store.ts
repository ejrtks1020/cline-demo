'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthResponse, UserPublic } from '@/types';

interface AuthState {
  accessToken: string | null;
  user: UserPublic | null;
  isAuthenticated: boolean;
  setAuth: (auth: AuthResponse) => void;
  clearAuth: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      setAuth: (auth) => set({ accessToken: auth.accessToken, user: auth.user, isAuthenticated: true }),
      clearAuth: () => set({ accessToken: null, user: null, isAuthenticated: false }),
      logout: () => set({ accessToken: null, user: null, isAuthenticated: false }),
    }),
    { name: 'auth-store' },
  ),
);

export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}
