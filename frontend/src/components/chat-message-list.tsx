'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useChatStore } from '@/stores/chat-store';
import { ChatMessage as ChatMessageType } from '@/types';
import { ChatMessage } from './chat-message';
import { ScrollArea } from './ui/scroll-area';

export function ChatMessageList({ messages, sessionId }: { messages: ChatMessageType[]; sessionId?: string }) {
  const t = useTranslations('chat');
  const bottomRef = useRef<HTMLDivElement>(null);
  const { isStreaming, streamContent, activeSessionId } = useChatStore();
  const showStream = isStreaming && activeSessionId === sessionId && streamContent;

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length, streamContent]);

  return <ScrollArea className="flex-1 p-4"><div className="space-y-3">{messages.length === 0 && !showStream && <p className="text-center text-slate-500">{t('empty')}</p>}{messages.map((message) => <ChatMessage key={message.id} message={message} />)}{showStream && <ChatMessage message={{ role: 'assistant', content: streamContent }} />}<div ref={bottomRef} /></div></ScrollArea>;
}
