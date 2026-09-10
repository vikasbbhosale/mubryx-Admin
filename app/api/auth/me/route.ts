import { NextResponse } from 'next/server';
import { forwardToBackend } from '@/lib/api';

export async function GET() {
  try {
    const res = await forwardToBackend('/admin/auth/me', {
      method: 'GET',
    });

    const data = await res.json().catch(() => ({}));
    const payload = data?.data || data;
    return NextResponse.json(payload, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || 'Failed to fetch administrator profile' },
      { status: 500 },
    );
  }
}
