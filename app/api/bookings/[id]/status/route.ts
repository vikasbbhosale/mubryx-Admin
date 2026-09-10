import { NextResponse } from 'next/server';
import { forwardToBackend } from '@/lib/api';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const res = await forwardToBackend(`/admin/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: body.status,
        reason: body.reason,
      }),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || 'Failed to update booking status' },
      { status: 500 },
    );
  }
}
