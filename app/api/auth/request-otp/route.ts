import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend } from '@/lib/api';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawPhone = String(body?.phone || '').trim();

    // Enforce strict regex validation FIRST so injection payloads are not stripped into valid numbers
    if (!/^(\+?91[\-\s]?)?[6-9]\d{9}$/.test(rawPhone)) {
      return NextResponse.json(
        { message: 'Please enter a valid 10-digit authorized Indian mobile number.' },
        { status: 400 },
      );
    }

    const digits = rawPhone.replace(/\D/g, '');
    const cleanPhone = digits.length > 10 ? digits.slice(-10) : digits;

    // Forward to authoritative Mubryx-Server
    const res = await forwardToBackend('/admin/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ phone: cleanPhone }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { message: data.message || 'Access Denied: Not an authorized administrator.' },
        { status: res.status },
      );
    }

    return NextResponse.json({
      success: true,
      requireOtp: true,
      message: data.message || 'OTP sent to authorized administrator mobile number.',
      expiresIn: data.expiresIn || 300,
    });
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || 'Connection error requesting administrator OTP.' },
      { status: 500 },
    );
  }
}
