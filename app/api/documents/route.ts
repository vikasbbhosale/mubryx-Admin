import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const endpoint = `/admin/documents${queryString ? `?${queryString}` : ''}`;

    const res = await forwardToBackend(endpoint, { method: 'GET' });
    const data = await res.json().catch(() => ({ items: [], metrics: {} }));

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    const payload = data?.data || data;
    const items = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(data?.items)
      ? data.items
      : [];

    return NextResponse.json({
      items,
      total: payload?.total ?? items.length,
      page: payload?.page ?? 1,
      limit: payload?.limit ?? items.length,
      totalPages: payload?.totalPages ?? 1,
      metrics: payload?.metrics ?? {
        total: items.length,
        pending: items.filter((d: any) => d.status === 'PENDING').length,
        verified: items.filter((d: any) => d.status === 'VERIFIED').length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch technician documents' },
      { status: 500 },
    );
  }
}
