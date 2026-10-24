import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend, SERVER_API_URL } from '@/lib/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    let backendRes = await forwardToBackend(`/d2c/documents/${id}/download`, {
      method: 'GET',
    });

    // Intelligent dev fallback: If remote cloud server returned 404/error, check local dev server
    if (!backendRes.ok) {
      try {
        const localUrl = `http://127.0.0.1:3000/api/v1/d2c/documents/${id}/download`;
        const localRes = await fetch(localUrl, { method: 'GET', cache: 'no-store' });
        if (localRes.ok) {
          backendRes = localRes;
        }
      } catch {
        // Fallback suppressed
      }
    }

    if (!backendRes.ok) {
      const errText = await backendRes.text();
      return NextResponse.json(
        { error: 'Document not found or inaccessible.', details: errText },
        { status: backendRes.status },
      );
    }

    const arrayBuffer = await backendRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const contentType =
      backendRes.headers.get('content-type') || 'application/octet-stream';
    const contentDisposition =
      backendRes.headers.get('content-disposition') || `attachment; filename="${id}"`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to download document' },
      { status: 500 },
    );
  }
}
