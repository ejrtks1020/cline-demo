'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAuthStore } from '@/stores/auth-store';

export default function HomePage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(useAuthStore.persist.hasHydrated());
    return useAuthStore.persist.onFinishHydration(() => setIsHydrated(true));
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    // 인증 상태는 localStorage persist 복원 이후에만 판단해 오탐 리다이렉트를 막는다.
    router.replace(isAuthenticated ? '/chat' : '/login');
  }, [isAuthenticated, isHydrated, router]);

  return null;
}
