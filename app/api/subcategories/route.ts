import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend } from '@/lib/api';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');

    const path = categoryId && categoryId !== 'ALL'
      ? `/admin/catalog/subcategories?categoryId=${encodeURIComponent(categoryId)}`
      : '/admin/catalog/subcategories';

    const res = await forwardToBackend(path, {
      method: 'GET',
    });

    const data = await res.json().catch(() => []);
    const payload = data?.data || data;
    const items = Array.isArray(payload) ? payload : Array.isArray(data?.items) ? data.items : [];
    return NextResponse.json(items, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      [],
      { status: 200 }
    );
  }
}
