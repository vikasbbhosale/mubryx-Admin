import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend } from '@/lib/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const res = await forwardToBackend(`/admin/documents/${id}/signed-url`, { method: 'GET' });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.url) {
      return NextResponse.json(
        { error: 'Document signed URL not available or expired' },
        { status: res.status || 404 },
      );
    }

    // Redirect browser directly to the authenticated Wasabi presigned URL
    return NextResponse.redirect(data.url, { status: 307 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}
