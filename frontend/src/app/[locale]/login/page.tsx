'use client';

import { AuthForm, AuthFormValues } from '@/components/auth-form';
import { useLogin } from '@/hooks/use-auth';

export default function LoginPage() {
  const login = useLogin();
  return <main className="grid min-h-screen place-items-center"><AuthForm mode="login" onSubmit={(values: AuthFormValues) => login.mutate({ loginId: values.loginId, password: values.password })} /></main>;
}
