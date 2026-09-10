import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { forwardToBackend } from '@/lib/api';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const res = await forwardToBackend(`/admin/catalog/services/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to update service' },
        { status: res.status }
      );
    }

    return NextResponse.json({
      message: 'Service updated successfully',
      service: data,
    });
  } catch (error) {
    console.error('Failed to proxy service update:', error);
    return NextResponse.json(
      { message: 'Internal server error updating service' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const res = await forwardToBackend(`/admin/catalog/services/${id}`, {
      method: 'DELETE',
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Failed to proxy service deletion:', error);
    return NextResponse.json(
      { message: 'Internal server error deleting service' },
      { status: 500 }
    );
  }
}
