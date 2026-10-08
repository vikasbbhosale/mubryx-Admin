import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const refresh = searchParams.get('refresh');
    const endpoint = `/admin/dashboard/operations-overview${refresh === 'true' ? '?refresh=true' : ''}`;

    const res = await forwardToBackend(endpoint, {
      method: 'GET',
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    const payload = data?.data || data || {};
    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'private, no-cache, no-transform',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || 'Failed to fetch operations overview data' },
      { status: 500 },
    );
  }
}
