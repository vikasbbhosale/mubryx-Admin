import { NextResponse } from 'next/server';
import { forwardToBackend } from '@/lib/api';

export async function GET() {
  try {
    const res = await forwardToBackend('/admin/finance/overview');
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { message: err.message || 'Failed to fetch finance data' },
        { status: res.status }
      );
    }

    const data = await res.json().catch(() => ({}));
    const payload = data?.data || data || {};

    // Map response structure to client frontend expectations
    const wallet = {
      id: payload.wallet?.id || 'admin_wallet_default',
      availableBalance: payload.wallet?.availableBalance || 0.0,
      currency: payload.wallet?.currency || 'INR',
      totalCommission: payload.wallet?.totalCommission || 0.0,
      totalGstCollected: payload.wallet?.totalGstCollected || 0.0,
      updatedAt: payload.wallet?.updatedAt || new Date().toISOString(),
      admin_wallet_transactions: payload.transactions || [],
    };

    const metrics = {
      grossVolume: payload.grossRevenue || 0,
      gstCollected: payload.wallet?.totalGstCollected || 0,
      completedOrdersCount: payload.completedBookingsCount || 0,
    };

    return NextResponse.json({
      wallet,
      metrics,
    });
  } catch (error) {
    console.error('Failed to proxy finance metrics:', error);
    return NextResponse.json(
      { message: 'Internal server error fetching finance data' },
      { status: 500 }
    );
  }
}
