'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from './ui/button';
import { Input } from './ui/input';

export function ChatInput({ disabled, onSubmit }: { disabled?: boolean; onSubmit: (content: string) => void }) {
  const t = useTranslations('chat');
  const [content, setContent] = useState('');
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setContent('');
  }
  return <form onSubmit={handleSubmit} className="flex gap-2 border-t bg-white p-3"><Input value={content} onChange={(event) => setContent(event.target.value)} placeholder={t('placeholder')} disabled={disabled} /><Button disabled={disabled}>{t('send')}</Button></form>;
}
