import { NextResponse } from 'next/server';
import { forwardToBackend } from '@/lib/api';

export async function GET() {
  try {
    const res = await forwardToBackend('/admin/dashboard/stats', {
      method: 'GET',
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    const payload = data?.data || data || {};

    const normalizedStats = {
      totalTechs: payload.techniciansCount ?? payload.totalTechs ?? 0,
      approvedCount: payload.activeTechniciansCount ?? payload.approvedCount ?? 0,
      pendingCount: payload.pendingVerificationsCount ?? payload.pendingCount ?? 0,
      totalDocs: payload.totalDocumentsCount ?? payload.totalDocs ?? 0,
      totalBookings: payload.totalBookingsCount ?? payload.totalBookings ?? 0,
      activeBookings: payload.activeBookingsCount ?? payload.activeBookings ?? 0,
      completedBookings: payload.completedBookingsCount ?? payload.completedBookings ?? 0,
      totalServices: payload.totalServicesCount ?? payload.totalServices ?? 0,
      totalCustomers: payload.totalUsersCount ?? payload.totalCustomers ?? 0,
      grossRevenue: payload.totalRevenue ?? payload.grossRevenue ?? 0,
      totalCommission: payload.totalCommission ?? 0,
      adminWalletBalance: payload.adminWalletBalance ?? 0,
    };

    return NextResponse.json(normalizedStats);
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || 'Failed to fetch dashboard statistics' },
      { status: 500 },
    );
  }
}
