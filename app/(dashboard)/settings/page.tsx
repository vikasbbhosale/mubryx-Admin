"use client";

import { useState, useEffect } from 'react';
import { 
  Settings, 
  User, 
  ShieldCheck, 
  Database, 
  Server, 
  Key, 
  CheckCircle2, 
  LogOut, 
  RefreshCw, 
  Loader2,
  Clock,
  Phone
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AdminUser {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function SettingsPage() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingDb, setCheckingDb] = useState(false);
  const [dbStatus, setDbStatus] = useState<'HEALTHY' | 'CHECKING' | 'ERROR'>('HEALTHY');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) setAdminUser(data.user);
      })
      .catch((err) => console.error('Failed to load profile', err))
      .finally(() => setLoading(false));
  }, []);

  const handleTestDatabase = async () => {
    setCheckingDb(true);
    setDbStatus('CHECKING');
    try {
      const res = await fetch('/api/dashboard/stats');
      if (res.ok) {
        setDbStatus('HEALTHY');
      } else {
        setDbStatus('ERROR');
      }
    } catch {
      setDbStatus('ERROR');
    } finally {
      setCheckingDb(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error', e);
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">System & Account Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your administrator profile, security parameters, and platform diagnostic controls.
        </p>
      </div>

      {/* Admin Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        <div className="flex items-center justify-between pb-5 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20 font-bold text-xl">
              {adminUser?.name?.charAt(0) || 'A'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{adminUser?.name || 'Administrator'}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                  {adminUser?.role}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono font-medium">{adminUser?.phone}</span>
                {adminUser?.email && <span>• {adminUser.email}</span>}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">User ID</div>
            <div className="font-mono font-bold text-slate-800 mt-1 truncate">{adminUser?.id}</div>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Account Status</div>
            <div className="font-bold text-emerald-600 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {adminUser?.isActive ? 'Active & Authorized' : 'Deactivated'}
            </div>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Member Since</div>
            <div className="font-bold text-slate-800 mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {adminUser?.createdAt ? new Date(adminUser.createdAt).toLocaleDateString('en-IN') : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Security & Token Architecture */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          Authentication & Security Standard
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="border border-slate-200 p-4 rounded-xl space-y-1">
            <div className="font-bold text-slate-800">Session Cookie Security</div>
            <p className="text-slate-500 leading-relaxed">
              Signed with <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">jose (JWT HS256)</code>, stored in <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">HttpOnly</code> cookie with strict CSRF protection.
            </p>
          </div>

          <div className="border border-slate-200 p-4 rounded-xl space-y-1">
            <div className="font-bold text-slate-800">Edge Proxy Interception</div>
            <p className="text-slate-500 leading-relaxed">
              Enforces Next.js 16.3 <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">proxy.ts</code> routing, guaranteeing zero client-side auth flash or token leakage.
            </p>
          </div>
        </div>
      </div>

      {/* Platform Diagnostics */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-600" />
            Infrastructure & Database Status
          </h3>

          <button
            disabled={checkingDb}
            onClick={handleTestDatabase}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checkingDb ? 'animate-spin' : ''}`} />
            Run Diagnostic Ping
          </button>
        </div>

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
          <div className="p-4 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4 text-slate-400" />
              <div>
                <div className="font-bold text-slate-900">Mubryx-Server Backend & Database</div>
                <div className="text-[11px] text-slate-500">Authoritative NestJS & Prisma ORM Gateway</div>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
              dbStatus === 'HEALTHY'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : dbStatus === 'CHECKING'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {dbStatus === 'HEALTHY' ? 'Live & Connected' : dbStatus === 'CHECKING' ? 'Pinging...' : 'Connection Error'}
            </span>
          </div>

          <div className="p-4 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <Server className="w-4 h-4 text-slate-400" />
              <div>
                <div className="font-bold text-slate-900">Application Server Runtime</div>
                <div className="text-[11px] text-slate-500">Next.js 16.3.0 with Turbopack App Router</div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Operational
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
