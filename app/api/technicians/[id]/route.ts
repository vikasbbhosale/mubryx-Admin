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

      bankDetails: t.bankDetails || null,
      wallet: t.wallet || null,
    };

    return NextResponse.json(mapped);
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || 'Failed to fetch technician details' },
      { status: 500 },
    );
  }
}
