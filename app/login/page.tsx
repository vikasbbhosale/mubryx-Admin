"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck, Phone, ArrowRight, Lock, Sparkles } from 'lucide-react';

const AUTHORIZED_ADMIN_PHONE = '8080827726';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim();

    if (!cleanPhone) {
      setError('Please enter your authorized admin phone number.');
      return;
    }

    setLoading(true);
    setError('');

    // Smooth transition feedback
    setTimeout(() => {
      if (cleanPhone === AUTHORIZED_ADMIN_PHONE) {
        const adminUser = {
          id: 'admin-001',
          phone: AUTHORIZED_ADMIN_PHONE,
          role: 'ADMIN',
          fullName: 'System Administrator',
        };
        localStorage.setItem('accessToken', 'mubryx-admin-session-token');
        localStorage.setItem('user', JSON.stringify(adminUser));

        router.push('/');
      } else {
        setError('Access Denied: This phone number is not authorized to access the Admin Dashboard.');
        setLoading(false);
      }
    }, 450);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      {/* Background Ambient Glow Lights */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glass Card */}
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
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-rose-950/80 border border-rose-500/50 text-rose-200 px-4 py-3 rounded-2xl text-xs font-medium flex items-start gap-2.5 animate-fadeIn">
                <Lock className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="phone" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Admin Phone Number
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
                    setPhone(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm font-medium rounded-xl pl-20 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all caret-blue-500"
                  placeholder="Enter authorized number"
                />
              </div>
            </div>

            {/* Quick Demo Hint Badge */}
            {/* <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 flex items-center gap-2.5 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Authorized Admin: <code className="text-blue-400 font-mono font-bold">8080827726</code></span>
            </div> */}

            <button
              type="submit"
              disabled={loading}
              className="w-full group relative flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/25 transition-all"
            >
              {loading ? (
                <Loader2 className="animate-spin h-5 w-5 text-white" />
              ) : (
                <span className="flex items-center gap-2">
                  Sign In to Control Panel <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="mt-8 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} Mubryx Home Services Platform. Confidential & Restricted.
        </p>
      </div>
    </div>
  );
}
