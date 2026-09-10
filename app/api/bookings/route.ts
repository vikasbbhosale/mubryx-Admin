import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { forwardToBackend } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const endpoint = `/admin/bookings${queryString ? `?${queryString}` : ''}`;

    const res = await forwardToBackend(endpoint, { method: 'GET' });
    const data = await res.json().catch(() => ({ items: [] }));

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

    // Normalize property aliases for UI compatibility
    const normalized = items.map((b: any) => ({
      ...b,
      users: b.customer || b.users,
      technician_profiles: b.technician || b.technician_profiles,
      booking_items: b.items || b.booking_items || [],
      booking_dispatches: b.dispatches || b.booking_dispatches || [],
    }));

    return NextResponse.json(normalized);
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || 'Failed to fetch bookings' },
      { status: 500 },
    );
  }
}
