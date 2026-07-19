import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || '9f8e7d6c5b4a3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b'
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get('pvs_access_token')?.value;
  const refreshToken = request.cookies.get('pvs_refresh_token')?.value;

  const isAuthPage = pathname.startsWith('/login');
  const isApiRoute = pathname.startsWith('/api');
  const isPublicFile = pathname.includes('.') || pathname.startsWith('/_next');

  // Skip public assets/images
  if (isPublicFile) {
    return NextResponse.next();
  }

  // 1. Verify access token
  let isValid = false;
  if (accessToken) {
    try {
      await jwtVerify(accessToken, JWT_SECRET);
      isValid = true;
    } catch (err) {
      // Access token is invalid or expired
    }
  }

  // 2. Routing restrictions
  if (!isValid && !refreshToken && !isAuthPage && !isApiRoute) {
    // Redirect to login if unauthenticated page route access is attempted
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (isValid && isAuthPage) {
    // Redirect already authenticated users away from login page
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
