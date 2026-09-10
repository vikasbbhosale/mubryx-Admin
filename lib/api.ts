import { cookies } from 'next/headers';

export const SERVER_API_URL =
  process.env.MUBRYX_SERVER_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3000/api/v1';

/**
 * Server-side forwarder from Next.js route handlers to authoritative Mubryx-Server.
 * Injects the admin bearer token stored in the secure HttpOnly cookie.
 */
export async function forwardToBackend(
  endpoint: string,
  options: RequestInit = {},
  explicitToken?: string,
) {
  let token = explicitToken;
  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get('mubryx_admin_token')?.value;
    } catch {
      // In case called from non-request context
    }
  }

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const targetUrl = `${SERVER_API_URL}${cleanEndpoint}`;

  return fetch(targetUrl, {
    ...options,
    headers,
    cache: 'no-store',
  });
}
