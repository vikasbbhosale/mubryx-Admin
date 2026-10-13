import { NextRequest, NextResponse } from 'next/server';
import { SERVER_API_URL } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return NextResponse.json({ message: 'Missing document url parameter' }, { status: 400 });
    }

    const baseBackendHost = SERVER_API_URL.replace(/\/api\/v1\/?$/, '');

    // Normalize target URL: If it points to an old/LAN IP or relative path, reroute to authoritative backend
    let resolvedUrl = targetUrl;
    if (resolvedUrl.startsWith('/')) {
      resolvedUrl = `${baseBackendHost}${resolvedUrl}`;
    } else if (resolvedUrl.includes('/public/uploads/')) {
      // Extract the path after domain and map to current backend host
      const pathname = resolvedUrl.substring(resolvedUrl.indexOf('/public/uploads/'));
      resolvedUrl = `${baseBackendHost}${pathname}`;
    }

    const res = await fetch(resolvedUrl, {
      method: 'GET',
      headers: {
        'Accept': 'image/*,application/pdf,*/*',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json(
        { message: `Document unreachable (${res.status})` },
        { status: res.status }
      );
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await res.arrayBuffer();

    return new Response(Buffer.from(arrayBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || 'Error streaming document' },
      { status: 500 }
    );
  }
}
