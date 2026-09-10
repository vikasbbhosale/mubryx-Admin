"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2,
  ShieldCheck,
  Phone,
  ArrowRight,
  Lock,
  Sparkles,
  KeyRound,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams?.get('from') || '/';

  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    const cleanPhone = digits.length > 10 ? digits.slice(-10) : digits;

    if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit authorized admin mobile number.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setStep('OTP');
        setSuccessMessage('OTP sent to your authorized mobile number.');
        setTimer(60); // 60 seconds cooldown for resend
      } else {
        // Enforce Step-1 rejection: prevent progression to OTP step
        setStep('PHONE');
        setError(data.message || 'Access Denied: You are not authorized to access the Admin Portal.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error requesting administrator OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    const cleanPhone = digits.length > 10 ? digits.slice(-10) : digits;
    const cleanOtp = otpCode.replace(/\D/g, '').trim();

    if (!cleanOtp || cleanOtp.length < 4 || cleanOtp.length > 6) {
      setError('Please enter a valid 4 to 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          code: cleanOtp,
          adminPin: adminPin.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        router.push(returnTo);
      } else {
        setError(data.message || 'Invalid or expired verification code.');
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md relative z-10">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/30 mb-4">
          <Sparkles className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Mubryx <span className="text-blue-500">Admin</span>
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Secure Administrator Portal Access
        </p>
      </div>

      {/* Card */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/50">
        {error && (
          <div className="mb-5 bg-rose-950/80 border border-rose-500/50 text-rose-200 px-4 py-3 rounded-2xl text-xs font-medium flex items-start gap-2.5 animate-fadeIn">
            <Lock className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-2xl text-xs font-medium flex items-start gap-2.5 animate-fadeIn">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {step === 'PHONE' ? (
          <form className="space-y-6" onSubmit={handleRequestOtp}>
            <div>
              <label
                htmlFor="phone"
                className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2"
              >
                Admin Mobile Number
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-400 flex items-center gap-1.5 text-xs font-semibold select-none border-r border-slate-700 pr-2.5">
                  <Phone className="w-3.5 h-3.5 text-blue-400" />
                  <span>+91</span>
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  autoFocus
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/[^\d\s+-]/g, ''));
                    if (error) setError('');
                  }}
                  className="w-full bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm font-medium rounded-xl pl-20 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all caret-blue-500"
                  placeholder="Enter 10-digit authorized number"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full group relative flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/25 transition-all"
            >
              {loading ? (
                <Loader2 className="animate-spin h-5 w-5 text-white" />
              ) : (
                <span className="flex items-center gap-2">
                  Send Verification OTP <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </form>
        ) : (
          <form className="space-y-5" onSubmit={handleVerifyOtp}>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setStep('PHONE');
                  setError('');
                  setSuccessMessage('');
                }}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Phone
              </button>
              <span className="text-xs text-slate-400 font-mono">+91 {phone}</span>
            </div>

            <div>
              <label
                htmlFor="otpCode"
                className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2"
              >
                6-Digit OTP Code
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-400 flex items-center">
                  <KeyRound className="w-4 h-4 text-blue-400" />
                </div>
                <input
                  id="otpCode"
                  name="otpCode"
                  type="text"
                  required
                  autoFocus
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value.replace(/\D/g, ''));
                    if (error) setError('');
                  }}
                  className="w-full bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm font-bold tracking-widest rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all caret-blue-500"
                  placeholder="Enter 6-digit OTP"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="adminPin"
                className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1"
              >
                Security PIN <span className="text-slate-600 font-normal">(Optional if configured)</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-500 flex items-center">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <input
                  id="adminPin"
                  name="adminPin"
                  type="password"
                  maxLength={8}
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-600 text-xs font-medium rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Enter security PIN"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              {timer > 0 ? (
                <span className="text-xs text-slate-500">Resend in {timer}s</span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleRequestOtp()}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                >
                  <RefreshCw className="w-3 h-3" /> Resend OTP
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length < 4}
              className="w-full group relative flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/25 transition-all"
            >
              {loading ? (
                <Loader2 className="animate-spin h-5 w-5 text-white" />
              ) : (
                <span className="flex items-center gap-2">
                  Verify & Authenticate <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Footer info */}
      <p className="mt-8 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Mubryx Home Services Platform. Confidential & Restricted.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      {/* Background Ambient Glow Lights */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      <Suspense
        fallback={
          <div className="flex items-center justify-center p-8">
            <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
