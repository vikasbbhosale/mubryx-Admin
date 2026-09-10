import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { forwardToBackend } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '100';

    const params = new URLSearchParams();
    if (categoryId && categoryId !== 'ALL') {
      params.set('categoryId', categoryId);
    }
    if (search) {
      params.set('search', search);
    }
    params.set('page', page);
    params.set('limit', limit);

    const res = await forwardToBackend(`/admin/catalog/services?${params.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { message: err.message || 'Failed to fetch services' },
        { status: res.status }
      );
    }

    const data = await res.json().catch(() => ({}));
    const payload = data?.data || data;
    const items = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(data?.items)
      ? data.items
      : [];

    return NextResponse.json(items);
  } catch (error) {
    console.error('Failed to proxy services fetch:', error);
    return NextResponse.json(
      { message: 'Internal server error fetching services' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await forwardToBackend('/admin/catalog/services', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Failed to proxy service creation:', error);
    return NextResponse.json(
      { message: 'Internal server error creating service' },
      { status: 500 }
    );
  }
}
