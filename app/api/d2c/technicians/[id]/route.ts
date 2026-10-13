import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend, SERVER_API_URL } from '@/lib/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const res = await forwardToBackend(`/d2c/admin/technicians/${id}`, { method: 'GET' });
    const data = await res.json().catch(() => null);

    if (!res.ok || !data) {
      return NextResponse.json(
        data || { message: 'D2C Technician not found' },
        { status: res.status || 404 },
      );
    }

    let raw = data;
    while (raw && typeof raw === 'object' && raw.data !== undefined) {
      raw = raw.data;
    }
    const t = raw;

    const resolveMediaUrl = (url?: string | null) => {
      if (!url) return null;
      return `/api/d2c/documents?url=${encodeURIComponent(url)}`;
    };

    const mapped = {
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
      assignedJobs: t.assignedJobs || [],
      user: t.user
        ? {
            id: t.user.id,
            phone: t.user.phone,
            name: t.user.name,
            createdAt: t.user.createdAt,
          }
        : null,
    };

    return NextResponse.json({
      success: true,
      data: mapped,
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || 'Failed to fetch technician details' },
      { status: 500 },
    );
  }
}
