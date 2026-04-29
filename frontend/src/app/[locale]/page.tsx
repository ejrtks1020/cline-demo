import { redirect } from '@/i18n/routing';

export default function HomePage() {
  redirect({ href: '/chat', locale: 'ko' });
}
