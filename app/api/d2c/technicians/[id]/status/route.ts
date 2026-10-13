import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend } from '@/lib/api';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    if (!body?.status) {
      return NextResponse.json(
        { message: 'Status is required (APPROVED, REJECTED, SUSPENDED, UNDER_REVIEW)' },
        { status: 400 },
      );
    }

    const res = await forwardToBackend(`/d2c/admin/technicians/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: body.status,
        adminRemarks: body.adminRemarks || undefined,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return NextResponse.json(
        data || { message: 'Failed to update technician onboarding status' },
        { status: res.status },
      );
    }

    return NextResponse.json({
      success: true,
      message: data?.message || `Technician status updated to ${body.status}`,
      data: data?.data || data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || 'Error updating technician status' },
      { status: 500 },
    );
  }
}
