import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = `/${routing.defaultLocale}`;

    // src/app 구조에서는 middleware도 src 아래에 있어야 루트 요청에 적용된다.
    return NextResponse.redirect(url);
  }

  return intlMiddleware(request);
}

export const config = { matcher: ['/', '/(ko|en)/:path*'] };