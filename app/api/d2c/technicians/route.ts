import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend, SERVER_API_URL } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const endpoint = `/d2c/admin/technicians${queryString ? `?${queryString}` : ''}`;

    const res = await forwardToBackend(endpoint, { method: 'GET' });
    const data = await res.json().catch(() => ({ items: [] }));

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    // Support both direct payload and NestJS TransformInterceptor wrapped payload { success: true, data: [...] }
    const rawData = data?.data !== undefined ? data.data : data;
    const items = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.data)
      ? rawData.data
      : Array.isArray(data?.items)
      ? data.items
      : [];

    // Resolve media URLs through secure proxy
    const resolveMediaUrl = (url?: string | null) => {
      if (!url) return null;
      return `/api/d2c/documents?url=${encodeURIComponent(url)}`;
    };

    const mapped = items.map((t: any) => ({
      id: t.id,
      userId: t.userId,
      fullName: t.fullName || t.user?.name || 'Technician',
      alternatePhone: t.alternatePhone || '',
      phone: t.user?.phone || '',
      operatingCity: t.operatingCity || '',
      localityArea: t.localityArea || '',
      servicePincode: t.servicePincode || '',
      experienceYears: t.experienceYears || '0 Years',
      selectedSkills: Array.isArray(t.selectedSkills) ? t.selectedSkills : [],
      hasOwnVehicle: Boolean(t.hasOwnVehicle),
      hasOwnToolkit: Boolean(t.hasOwnToolkit),
      onboardingStatus: t.onboardingStatus,
      isOnline: Boolean(t.isOnline),
      currentLatitude: t.currentLatitude ?? null,
      currentLongitude: t.currentLongitude ?? null,
      lastActiveAt: t.lastActiveAt ?? null,
      submittedAt: t.submittedAt ?? null,
      approvedAt: t.approvedAt ?? null,
      approvedByAdminId: t.approvedByAdminId ?? null,
      profilePhotoUrl: resolveMediaUrl(t.profilePhotoUrl),
      aadhaarPhotoUrl: resolveMediaUrl(t.aadhaarPhotoUrl),
      drivingLicenseUrl: resolveMediaUrl(t.drivingLicenseUrl),
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      assignedJobsCount: t._count?.assignedJobs ?? 0,
      user: t.user
        ? {
            id: t.user.id,
            phone: t.user.phone,
            name: t.user.name,
            createdAt: t.user.createdAt,
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      items: mapped,
      meta: rawData?.meta || data?.meta,
      metrics: rawData?.metrics || data?.metrics,
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || 'Failed to fetch D2C technicians' },
      { status: 500 },
    );
  }
}
