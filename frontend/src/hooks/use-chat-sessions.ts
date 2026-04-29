'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ChatSession, ChatSessionDetail, CreateChatSessionParams } from '@/types';
import { chatQueryKeys } from './chat-query-keys';

export function useChatSessions() {
  return useQuery({ queryKey: chatQueryKeys.sessions(), queryFn: async () => (await api.get<ChatSession[]>('/chats')).data });
}

export function useChatSession(id?: string) {
  return useQuery({ queryKey: chatQueryKeys.detail(id ?? ''), queryFn: async () => (await api.get<ChatSessionDetail>(`/chats/${id}`)).data, enabled: Boolean(id) });
}

export function useCreateChatSession() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: async (params?: CreateChatSessionParams) => (await api.post<ChatSession>('/chats', params ?? {})).data, onSuccess: () => queryClient.invalidateQueries({ queryKey: chatQueryKeys.sessions() }) });
}

export function useDeleteChatSession() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: async (id: string) => { await api.delete(`/chats/${id}`); }, onSuccess: () => queryClient.invalidateQueries({ queryKey: chatQueryKeys.sessions() }) });
}
