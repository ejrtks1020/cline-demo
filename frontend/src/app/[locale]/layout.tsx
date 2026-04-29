import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import '../globals.css';
import { Providers } from '@/components/providers';

export default async function LocaleLayout({ children }: { children: React.ReactNode }) {
  const messages = await getMessages();
  return <html><body><NextIntlClientProvider messages={messages}><Providers>{children}</Providers></NextIntlClientProvider></body></html>;
}
