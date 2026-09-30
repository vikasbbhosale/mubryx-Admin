import { NextResponse } from 'next/server';
import { forwardToBackend } from '@/lib/api';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const res = await forwardToBackend(`/admin/bookings/${id}`, {
      method: 'GET',
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    const payload = data?.data || data;

    // Normalize property aliases for UI compatibility
    const normalized = {
      ...payload,
      customer: payload.customer || payload.users,
      technician: payload.technician || payload.technician_profiles,
      items: payload.items || payload.booking_items || [],
      dispatches: payload.dispatches || payload.booking_dispatches || [],
    };

    return NextResponse.json(normalized);
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || 'Failed to fetch booking details' },
      { status: 500 },
    );
  }
}
