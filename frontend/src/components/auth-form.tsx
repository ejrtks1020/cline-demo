'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from './ui/button';
import { Input } from './ui/input';

const authSchema = z.object({ loginId: z.string().min(3), password: z.string().min(8).regex(/^\S+$/), name: z.string().max(50).optional() });
export type AuthFormValues = z.infer<typeof authSchema>;

export function AuthForm({ mode, onSubmit }: { mode: 'login' | 'signup'; onSubmit: (values: AuthFormValues) => void }) {
  const t = useTranslations('auth');
  const form = useForm<AuthFormValues>({ resolver: zodResolver(authSchema), defaultValues: { loginId: '', password: '', name: '' } });
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto flex max-w-sm flex-col gap-3 rounded-xl bg-white p-6 shadow">
      <h1 className="text-xl font-semibold">{mode === 'login' ? t('login') : t('signup')}</h1>
      <Input placeholder={t('loginId')} {...form.register('loginId')} />
      <Input placeholder={t('password')} type="password" {...form.register('password')} />
      {mode === 'signup' && <Input placeholder={t('name')} {...form.register('name')} />}
      <Button type="submit">{t('submit')}</Button>
    </form>
  );
}
