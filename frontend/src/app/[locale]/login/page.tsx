'use client';

import { AuthForm, AuthFormValues } from '@/components/auth-form';
import { useLogin } from '@/hooks/use-auth';
import { Link } from '@/i18n/routing';

export default function LoginPage() {
  const login = useLogin();
  return <main className="grid min-h-screen place-items-center"><div className="flex w-full max-w-sm flex-col gap-3"><AuthForm mode="login" onSubmit={(values: AuthFormValues) => login.mutate({ loginId: values.loginId, password: values.password })} /><Link href="/signup" className="rounded-md border border-slate-300 px-3 py-2 text-center text-sm text-slate-700">회원가입</Link></div></main>;
}
