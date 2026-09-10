import { NextResponse } from 'next/server';
import { forwardToBackend } from '@/lib/api';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('mubryx_admin_refresh')?.value;

    await forwardToBackend('/admin/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }).catch(() => null);

    const response = NextResponse.json({ message: 'Logged out successfully' });

    // Clear session cookies
    response.cookies.delete('mubryx_admin_token');
    response.cookies.delete('mubryx_admin_refresh');
    response.cookies.delete('mubryx_admin_session'); // Legacy cookie

    return response;
  } catch (err: any) {
    const response = NextResponse.json({ message: 'Logged out' });
    response.cookies.delete('mubryx_admin_token');
    response.cookies.delete('mubryx_admin_refresh');
    response.cookies.delete('mubryx_admin_session');
    return response;
  }
}
