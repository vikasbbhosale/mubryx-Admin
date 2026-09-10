import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend } from '@/lib/api';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawPhone = String(body?.phone || '').trim();
    const rawCode = String(body?.code || '').trim();
    const rawPin = body?.adminPin ? String(body.adminPin).trim() : undefined;

    // Validate phone number format strictly before any transformation
    if (!/^(\+?91[\-\s]?)?[6-9]\d{9}$/.test(rawPhone)) {
      return NextResponse.json(
        { message: 'Valid 10-digit administrator mobile number is required.' },
        { status: 400 },
      );
    }

    const digits = rawPhone.replace(/\D/g, '');
    const cleanPhone = digits.length > 10 ? digits.slice(-10) : digits;

    // Validate OTP code (strictly 4-6 digits)
    if (!/^\d{4,6}$/.test(rawCode)) {
      return NextResponse.json(
        { message: 'Valid 4 to 6-digit OTP verification code is required.' },
        { status: 400 },
      );
    }
    const cleanCode = rawCode;

    // Forward verification to authoritative Mubryx-Server
    const res = await forwardToBackend('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        phone: cleanPhone,
        code: cleanCode,
        adminPin: rawPin || undefined,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { message: data.message || data?.error?.message || 'Invalid or expired OTP verification code.' },
        { status: res.status },
      );
    }

    // Support both direct payload and NestJS TransformInterceptor wrapped payload { success: true, data: { ... } }
    const payload = data?.data || data;
    const accessToken = payload?.accessToken;
    const refreshToken = payload?.refreshToken;
    const user = payload?.user;

    const response = NextResponse.json({
      success: true,
      message: payload?.message || 'Logged in successfully',
      user,
      accessToken,
    });

    // Set secure HTTP-only session cookies
    if (accessToken) {
      response.cookies.set('mubryx_admin_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    if (refreshToken) {
      response.cookies.set('mubryx_admin_refresh', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || 'Authentication error processing administrator login.' },
      { status: 500 },
    );
  }
}
