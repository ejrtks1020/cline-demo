'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRouter } from '@/i18n/routing';
import { useAuthStore } from '@/stores/auth-store';
import { AuthResponse, LoginParams, SignupParams, UserPublic } from '@/types';

export async function login(params: LoginParams): Promise<AuthResponse> {
  return (await api.post<AuthResponse>('/auth/login', params)).data;
}

export async function signup(params: SignupParams): Promise<AuthResponse> {
  return (await api.post<AuthResponse>('/auth/signup', params)).data;
}

export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();
  return useMutation({ mutationFn: login, onSuccess: (data) => { setAuth(data); router.push('/chat'); } });
}

export function useSignup() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();
  return useMutation({ mutationFn: signup, onSuccess: (data) => { setAuth(data); router.push('/chat'); } });
}

export function useLogout() {
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const router = useRouter();
  return () => { clearAuth(); router.push('/login'); };
}

export function useMe() {
  return useQuery({ queryKey: ['me'], queryFn: async () => (await api.get<UserPublic>('/auth/me')).data, retry: false });
}
