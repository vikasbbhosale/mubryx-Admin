import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend } from '@/lib/api';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const res = await forwardToBackend(`/admin/catalog/subcategories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data?.data || data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || 'Failed to update subcategory' },
      { status: 500 }
    );
  }
}
