import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const endpoint = `/admin/technicians${queryString ? `?${queryString}` : ''}`;

    const res = await forwardToBackend(endpoint, { method: 'GET' });
    const data = await res.json().catch(() => ({ items: [] }));

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    const payload = data?.data || data;
    const items = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(data?.items)
      ? data.items
      : [];

    const mapped = items.map((t: any) => ({
      id: t.id,
      fullName: t.fullName || t.user?.name || 'Technician',
      phone: t.user?.phone || t.contact || '',
      email: t.user?.email || '',
      dateOfBirth: t.dateOfBirth || '',
      gender: t.gender || 'MALE',
      profilePhoto:
        t.profilePhoto ||
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&h=200&auto=format&fit=crop',
      currentCity: t.currentCity || '',
      pinCode: t.pinCode || '',
      bio: t.bio || '',
      experienceYears: t.experienceYears || 0,
      onboardingStatus: t.onboardingStatus,
      reviewNotes: t.currentState || '',
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
        status: 'PENDING',
        rejectionReason: '',
        previewUrl: `https://mubryx-technician-private.s3.ap-southeast-1.wasabisys.com/${d.objectKey}`,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })),

      skills: (t.skills || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        description: c.description || '',
      })),

      experiences: (t.experiences || []).map((e: any) => ({
        id: e.id,
        role: e.role,
        companyName: e.companyName,
        startDate: e.startDate,
        endDate: e.endDate,
        responsibilities: e.responsibilities || '',
      })),
    }));

    return NextResponse.json(mapped);
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || 'Failed to fetch technicians' },
      { status: 500 },
    );
  }
}
