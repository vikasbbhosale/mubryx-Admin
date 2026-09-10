import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { forwardToBackend } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const endpoint = `/admin/audit-logs${queryString ? `?${queryString}` : ''}`;

    const res = await forwardToBackend(endpoint, { method: 'GET' });
    const data = await res.json().catch(() => ({ items: [], total: 0 }));

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    const payload = data?.data || data;
    return NextResponse.json(payload);
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || 'Failed to fetch audit logs' },
      { status: 500 },
    );
  }
}
