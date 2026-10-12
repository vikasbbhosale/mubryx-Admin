import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend } from '@/lib/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const res = await forwardToBackend(`/admin/technicians/${id}`, { method: 'GET' });
    const data = await res.json().catch(() => null);

    if (!res.ok || !data) {
      return NextResponse.json(
        data || { message: 'Technician not found' },
        { status: res.status || 404 },
      );
    }

    const t = data?.data || data;

    const mapped = {
      id: t.id,
      fullName: t.fullName || t.user?.name || 'Technician',
      phone: t.user?.phone || t.contact || '',
      contact: t.user?.phone || t.contact || '',
      email: t.user?.email || '',
      user: t.user ? {
        id: t.user.id,
        phone: t.user.phone || t.contact || '',
        name: t.user.name || t.fullName,
        email: t.user.email || null,
        isActive: t.user.isActive ?? true,
        role: t.user.role || 'TECHNICIAN',
      } : {
        id: t.userId || t.id,
        phone: t.contact || '',
        name: t.fullName,
        email: null,
        isActive: true,
        role: 'TECHNICIAN',
      },
      dateOfBirth: t.dateOfBirth || '',
      gender: t.gender || 'MALE',
      profilePhoto:
        (t.profilePhoto && !t.profilePhoto.startsWith('mock://') && (t.profilePhoto.startsWith('http://') || t.profilePhoto.startsWith('https://')))
          ? t.profilePhoto
          : null,
      currentCity: t.currentCity || '',
      currentState: t.currentState || '',
      pinCode: t.pinCode || '',
      bio: t.bio || '',
      experienceYears: t.experienceYears || 0,
      onboardingStatus: t.onboardingStatus,
      reviewNotes: t.currentState || '',
      rating: t.rating || 5.0,
      totalRatings: t.totalRatings || 0,
      isOnline: t.isOnline || false,
      lastLocationUpdatedAt: t.lastLocationUpdatedAt || null,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      submittedAt: t.submittedAt,

      documents: (t.documents || []).map((d: any) => ({
        id: d.id,
        type: d.type,
        documentNumber: d.objectKey?.split('/').pop() || 'N/A',
        objectKey: d.objectKey,
        fileSize: d.fileSize,
        mimeType: d.mimeType,
        status: t.onboardingStatus === 'APPROVED' ? 'VERIFIED' : 'PENDING',
        rejectionReason: '',
        signedUrl: d.signedUrl || null,
        previewUrl: d.signedUrl || `/api/documents/${d.id}/view`,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })),

      skills: (t.skills || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        image: c.image,
        description: c.description || '',
      })),

      experiences: (t.experiences || []).map((e: any) => ({
        id: e.id,
        role: e.role,
        companyName: e.companyName,
        totalExperience: e.totalExperience,
        startDate: e.startDate,
        endDate: e.endDate,
        responsibilities: e.responsibilities || '',
      })),

      bankDetails: t.bankDetails || null,
      wallet: t.wallet || null,
      metrics: t.metrics || {
        totalJobs: (t.bookings || []).length,
        completedJobs: (t.bookings || []).filter((b: any) => ['COMPLETED', 'SERVICE_COMPLETED'].includes(b.status)).length,
        activeJobs: (t.bookings || []).filter((b: any) => !['COMPLETED', 'SERVICE_COMPLETED', 'CANCELLED'].includes(b.status)).length,
        totalDispatches: (t.dispatches || []).length,
        walletBalance: t.wallet?.availableBalance || 0,
      },
      bookings: t.bookings || [],
      dispatches: t.dispatches || [],
    };

    return NextResponse.json(mapped);
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || 'Failed to fetch technician details' },
      { status: 500 },
    );
  }
}
