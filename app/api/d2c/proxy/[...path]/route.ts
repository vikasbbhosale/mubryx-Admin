import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend } from '@/lib/api';

async function handleProxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await params;
    const subPath = path.join('/');
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const endpoint = `/d2c/admin/${subPath}${queryString ? `?${queryString}` : ''}`;

    const method = request.method;
    let body: string | undefined = undefined;

    if (method !== 'GET' && method !== 'HEAD') {
      const text = await request.text();
      if (text) body = text;
    }

    const res = await forwardToBackend(endpoint, {
      method,
      body,
    });

    const contentType = res.headers.get('content-type') || '';
    const contentDisposition = res.headers.get('content-disposition');

    // If binary download / streaming
    if (contentDisposition || contentType.includes('pdf') || contentType.includes('image')) {
      const buffer = await res.arrayBuffer();
      const headers = new Headers();
      if (contentType) headers.set('Content-Type', contentType);
      if (contentDisposition) headers.set('Content-Disposition', contentDisposition);
      return new NextResponse(buffer, { status: res.status, headers });
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Proxy error' },
      { status: 500 },
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PATCH = handleProxy;
export const PUT = handleProxy;
export const DELETE = handleProxy;
