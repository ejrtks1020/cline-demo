'use client';

import { AuthForm, AuthFormValues } from '@/components/auth-form';
import { useSignup } from '@/hooks/use-auth';

export default function SignupPage() {
  const signup = useSignup();
  return <main className="grid min-h-screen place-items-center"><AuthForm mode="signup" onSubmit={(values: AuthFormValues) => signup.mutate(values)} /></main>;
}
