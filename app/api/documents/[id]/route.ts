import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend } from '@/lib/api';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const res = await forwardToBackend(`/admin/documents/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data?.data || data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to update document status' },
      { status: 500 }
    );
  }
}
