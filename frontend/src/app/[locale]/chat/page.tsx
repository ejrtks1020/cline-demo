'use client';

import { useEffect, useState } from 'react';
import { ChatInput } from '@/components/chat-input';
import { ChatMessageList } from '@/components/chat-message-list';
import { ChatSidebar } from '@/components/chat-sidebar';
import { useChatSessions, useChatSession, useCreateChatSession, useDeleteChatSession } from '@/hooks/use-chat-sessions';
import { useChatStream } from '@/hooks/use-chat-stream';
import { useLogout } from '@/hooks/use-auth';
import { useRouter } from '@/i18n/routing';
import { useAuthStore } from '@/stores/auth-store';
import { useChatStore } from '@/stores/chat-store';

export default function ChatPage() {
  const router = useRouter();
  const logout = useLogout();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { isStreaming, error } = useChatStore();
  const [selectedId, setSelectedId] = useState<string>();
  const sessions = useChatSessions();
  const detail = useChatSession(selectedId);
  const createSession = useCreateChatSession();
  const deleteSession = useDeleteChatSession();
  const { sendMessage } = useChatStream();

  useEffect(() => { if (!isAuthenticated) router.push('/login'); }, [isAuthenticated, router]);
  useEffect(() => { if (!selectedId && sessions.data?.[0]) setSelectedId(sessions.data[0].id); }, [selectedId, sessions.data]);

  async function handleCreate() {
    const created = await createSession.mutateAsync({});
    setSelectedId(created.id);
  }

  return <main className="flex h-screen"><ChatSidebar sessions={sessions.data ?? []} selectedId={selectedId} onSelect={setSelectedId} onCreate={handleCreate} onDelete={(id) => deleteSession.mutate(id)} onLogout={logout} /><section className="flex flex-1 flex-col"><ChatMessageList messages={detail.data?.messages ?? []} sessionId={selectedId} />{error && <p className="px-3 text-sm text-red-600">{error}</p>}<ChatInput disabled={!selectedId || isStreaming} onSubmit={(content) => selectedId && sendMessage(selectedId, { content })} /></section></main>;
}
