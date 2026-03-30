import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  const isDev = process.env.NODE_ENV !== 'production';

  const apiOrigin = process.env.NEXT_PUBLIC_API_URL
    ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
    : '';
  const wsOrigin = process.env.NEXT_PUBLIC_WS_URL
    ? process.env.NEXT_PUBLIC_WS_URL.replace(/^http/, 'ws')
    : '';

  const csp = [
    "default-src 'self'",
    // nonce covers Next.js/Turbopack inline scripts; 'strict-dynamic' propagates trust to dynamically loaded scripts
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://maps.googleapis.com https://maps.google.com`,
    `connect-src 'self' ${apiOrigin} ${wsOrigin} https://maps.googleapis.com${isDev ? ' ws://localhost:* wss://localhost:*' : ''}`,
    "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://*.googleapis.com https://*.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    'worker-src blob:',
    "manifest-src 'self'",
  ].join('; ');

  const requestHeaders = new Headers(request.headers);
  // Pass nonce to Server Components via a request header
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set('Content-Security-Policy', csp);

  return response;
}

export const config = {
  matcher: [
    {
      // Apply to all routes except static assets
      source: '/((?!_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
