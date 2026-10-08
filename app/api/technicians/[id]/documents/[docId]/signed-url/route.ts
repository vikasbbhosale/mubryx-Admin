import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend } from '@/lib/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> },
) {
  try {
    const { id, docId } = await params;
    const res = await forwardToBackend(
      `/admin/technicians/${id}/documents/${docId}/signed-url`,
      { method: 'GET' },
    );
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}
