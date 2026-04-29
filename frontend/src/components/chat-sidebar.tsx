'use client';

import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ChatSession } from '@/types';
import { Button } from './ui/button';

export function ChatSidebar({ sessions, selectedId, onSelect, onCreate, onDelete, onLogout }: { sessions: ChatSession[]; selectedId?: string; onSelect: (id: string) => void; onCreate: () => void; onDelete: (id: string) => void; onLogout: () => void }) {
  const t = useTranslations('chat');
  return <aside className="flex w-72 flex-col border-r bg-white p-3"><Button onClick={onCreate}>{t('newChat')}</Button><div className="mt-3 flex-1 space-y-2 overflow-y-auto">{sessions.map((session) => <div key={session.id} className={`flex items-center gap-2 rounded-md p-2 ${selectedId === session.id ? 'bg-slate-100' : ''}`}><button className="flex-1 truncate text-left" onClick={() => onSelect(session.id)}>{session.title}</button><button aria-label={t('delete')} onClick={() => onDelete(session.id)}><Trash2 size={16} /></button></div>)}</div><Button className="bg-slate-500" onClick={onLogout}>{t('logout')}</Button></aside>;
}
