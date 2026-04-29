'use client';

import { useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/api';
import { parseSseBuffer } from '@/lib/stream-parser';
import { getAccessToken } from '@/stores/auth-store';
import { useChatStore } from '@/stores/chat-store';
import { SendChatMessageParams } from '@/types';
import { chatQueryKeys } from './chat-query-keys';

export function useChatStream() {
  const queryClient = useQueryClient();
  const { startStreaming, appendChunk, completeStreaming, setError } = useChatStore();

  async function sendMessage(sessionId: string, params: SendChatMessageParams): Promise<void> {
    startStreaming(sessionId);
    const token = getAccessToken();
    if (!token) { setError('Authentication required'); return; }

    const response = await fetch(`${API_BASE_URL}/api/v1/chats/${sessionId}/messages/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(params),
    });
    if (!response.ok || !response.body) { setError('Stream request failed'); return; }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parsed = parseSseBuffer(buffer);
      buffer = parsed.remainingBuffer;
      for (const event of parsed.events) {
        if (event.type === 'chunk') appendChunk(event.data);
        if (event.type === 'error') setError(event.data);
        if (event.type === 'done') {
          completeStreaming(event.messageId);
          await queryClient.invalidateQueries({ queryKey: chatQueryKeys.detail(sessionId) });
          await queryClient.invalidateQueries({ queryKey: chatQueryKeys.sessions() });
        }
      }
    }
  }

  return { sendMessage };
}
