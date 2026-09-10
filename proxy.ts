import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const jwtAccessSecret = process.env.JWT_ACCESS_SECRET;
if (!jwtAccessSecret) {
  throw new Error('JWT_ACCESS_SECRET environment variable is missing.');
}
const JWT_SECRET = new TextEncoder().encode(jwtAccessSecret);

/**
 * Validates the JWT cryptographically and ensures role is ADMIN or SUPER_ADMIN.
 * Prevents forged, invalid, expired, or tampered tokens from gaining access.
 */
async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload?.role;
    return role === 'ADMIN' || role === 'SUPER_ADMIN';
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets, internal Next.js paths, and public auth endpoints
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/request-otp') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('mubryx_admin_token')?.value;

  // If visiting login page while already having an active verified token, redirect to dashboard
  if (pathname === '/login') {
    if (token) {
      const isValid = await verifyAdminToken(token);
      if (isValid) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
    return NextResponse.next();
  }

  // All other dashboard pages require a cryptographically verified administrator session
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isValid = await verifyAdminToken(token);
  if (!isValid) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    const res = NextResponse.redirect(loginUrl);
    // Invalidate forged/expired/tampered cookie
    res.cookies.delete('mubryx_admin_token');
    return res;
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth/login
     * - api/auth/request-otp
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth/login|api/auth/request-otp|_next/static|_next/image|favicon.ico).*)',
  ],
};
