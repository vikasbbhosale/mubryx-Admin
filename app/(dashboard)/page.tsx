"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Users, 
  CalendarCheck, 
  Wallet, 
  AlertTriangle, 
  ShieldCheck, 
  Activity, 
  RefreshCw, 
  Layers,
  CheckCircle2,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  UserCheck,
  LifeBuoy,
  Clock,
  ExternalLink,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface DashboardStats {
  totalTechs: number;
  activeTechs: number;
  pendingCount: number;
  approvedCount: number;
  totalDocs: number;
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  totalServices: number;
  totalCustomers: number;
  grossRevenue: number;
  totalCommission: number;
  adminWalletBalance: number;
}

interface RecentBooking {
  id: string;
  bookingNumber: string;
  totalAmount: number;
  status: string;
  snapshotAddress: string;
  snapshotCity: string | null;
  createdAt: string;
  customer?: {
    name: string | null;
    phone: string;
  };
  users?: {
    name: string | null;
    phone: string;
  };
}

interface TechnicianItem {
  id: string;
  fullName: string | null;
  phone?: string;
  contact?: string;
  currentCity: string | null;
  onboardingStatus: string;
  isOnline?: boolean;
}

interface AuditItem {
  id: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  status: string;
  createdAt: string;
  userPhone?: string | null;
  user?: {
    name: string | null;
    phone: string;
    role: string;
  } | null;
}

export default function DashboardPage() {
  const [adminName, setAdminName] = useState('Administrator');
  const [adminRole, setAdminRole] = useState('ADMIN');
  
  const [technicians, setTechnicians] = useState<TechnicianItem[]>([]);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [auditStream, setAuditStream] = useState<AuditItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<DashboardStats>({
    totalTechs: 0,
    activeTechs: 0,
    pendingCount: 0,
    approvedCount: 0,
    totalDocs: 0,
    totalBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
    totalServices: 0,
    totalCustomers: 0,
    grossRevenue: 0,
    totalCommission: 0,
    adminWalletBalance: 0,
  });

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setRefreshing(true);
    setError(null);

    try {
      // 1. Authenticated Operator Profile
      const meRes = await fetch('/api/auth/me').catch(() => null);
      if (meRes && meRes.ok) {
        const meData = await meRes.json();
        if (meData?.user?.name) setAdminName(meData.user.name);
        if (meData?.user?.role) setAdminRole(meData.user.role);
      }

      // 2. Authoritative Platform Stats
      const statsRes = await fetch('/api/dashboard/stats').catch(() => null);
      if (statsRes && statsRes.ok) {
        const s = await statsRes.json();
        setStats({
          totalTechs: s.techniciansCount ?? 0,
          activeTechs: s.activeTechniciansCount ?? 0,
          pendingCount: s.pendingVerificationsCount ?? 0,
          approvedCount: (s.techniciansCount ?? 0) - (s.pendingVerificationsCount ?? 0),
          totalDocs: s.totalDocumentsCount ?? 0,
          totalBookings: s.totalBookingsCount ?? 0,
          activeBookings: s.activeBookingsCount ?? 0,
          completedBookings: s.completedBookingsCount ?? 0,
          totalServices: s.totalServicesCount ?? 0,
          totalCustomers: s.totalUsersCount ?? 0,
          grossRevenue: s.totalRevenue ?? 0,
          totalCommission: s.totalCommission ?? 0,
          adminWalletBalance: s.adminWalletBalance ?? 0,
        });
      }

      // 3. Live Recent Bookings
      const bookRes = await fetch('/api/bookings?limit=8').catch(() => null);
      if (bookRes && bookRes.ok) {
        const bData = await bookRes.json();
        const items = Array.isArray(bData) ? bData : bData?.items || [];
        setRecentBookings(items.slice(0, 7));
      }

      // 4. Technician Workforce
      const techRes = await fetch('/api/technicians?limit=8').catch(() => null);
      if (techRes && techRes.ok) {
        const tData = await techRes.json();
        const items = Array.isArray(tData) ? tData : tData?.items || [];
        setTechnicians(items.slice(0, 7));
      }

      // 5. Audit Log Stream
      const auditRes = await fetch('/api/audit-logs?limit=6').catch(() => null);
      if (auditRes && auditRes.ok) {
        const aData = await auditRes.json();
        const items = Array.isArray(aData?.items) ? aData.items : [];
        setAuditStream(items.slice(0, 5));
      }

      setLastSynced(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err: any) {
      console.error('Operations fetch error:', err);
      setError('Operational feeds degraded. Connecting to server...');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  return (
    <div className="space-y-5 pb-12">
      {/* 1. Operations Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Operations Control Center
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 font-bold uppercase">
              {adminRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time marketplace monitoring: customer dispatch, field workforce compliance, and platform ledger.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {lastSynced && (
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 hidden md:inline">
              Updated {lastSynced}
            </span>
          )}
          <button
            onClick={() => loadData()}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-500' : ''}`} />
            <span>Sync Feeds</span>
          </button>
          <Link
            href="/live-ops"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer shadow-xs"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Live Ops Board</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => loadData()} className="underline font-bold hover:text-rose-900 dark:hover:text-white cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* 2. Actionable Attention Queue */}
      <div>
        {stats.pendingCount > 0 ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-xs shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <span className="font-bold text-amber-900 dark:text-amber-300 tracking-wide block">
                  Workforce Audit Queue: {stats.pendingCount} technician application(s) awaiting verification.
                </span>
                <span className="text-amber-700 dark:text-amber-400/70 text-[11px]">
                  Pending KYC and identity documents prevent field job dispatches.
                </span>
              </div>
            </div>
            <Link
              href="/verifications"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors self-start sm:self-auto flex-shrink-0 shadow-2xs"
            >
              Audit Queue ({stats.pendingCount}) <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : stats.activeBookings > 0 ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl text-xs shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <span className="font-bold text-blue-900 dark:text-blue-300 tracking-wide block">
                  {stats.activeBookings} active customer job(s) in progress across cities.
                </span>
                <span className="text-blue-700 dark:text-blue-400/70 text-[11px]">
                  Real-time matching, technician arrival, and fulfillment ongoing.
                </span>
              </div>
            </div>
            <Link
              href="/live-ops"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-colors self-start sm:self-auto flex-shrink-0 shadow-2xs"
            >
              Air-Traffic Board <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-400 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span>All operational queues nominal • Zero pending verifications • Services synchronized</span>
          </div>
        )}
      </div>

      {/* 3. High-Density Operational KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Active Dispatches */}
        <Link
          href="/bookings"
          className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-slate-700 transition-colors flex flex-col justify-between shadow-2xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Dispatches
            </span>
            <div className="p-1.5 bg-blue-50 dark:bg-blue-500/10 rounded-md">
              <CalendarCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
              {stats.activeBookings}
            </span>
            <span className="text-[11px] text-slate-500">jobs in field</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>{stats.totalBookings} total orders placed</span>
            <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-blue-500 transition-colors" />
          </div>
        </Link>

        {/* KPI 2: Workforce Readiness */}
        <Link
          href="/technicians"
          className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-slate-700 transition-colors flex flex-col justify-between shadow-2xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Technician Workforce
            </span>
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-md">
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
              {stats.totalTechs}
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              {stats.activeTechs} active
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>{stats.pendingCount} pending KYC audit</span>
            <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-500 transition-colors" />
          </div>
        </Link>

        {/* KPI 3: Gross Volume (GMV) */}
        <Link
          href="/finance"
          className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-slate-700 transition-colors flex flex-col justify-between shadow-2xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Gross Volume (GMV)
            </span>
            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-md">
              <Wallet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
              ₹{stats.grossRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>₹{stats.totalCommission.toLocaleString('en-IN', { maximumFractionDigits: 0 })} commission</span>
            <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-500 transition-colors" />
          </div>
        </Link>

        {/* KPI 4: Catalog & Services */}
        <Link
          href="/services"
          className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 transition-colors flex flex-col justify-between shadow-2xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Catalog Services
            </span>
            <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-md">
              <Layers className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
              {stats.totalServices}
            </span>
            <span className="text-[11px] text-slate-500">active offerings</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>{stats.totalCustomers} registered customers</span>
            <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white transition-colors" />
          </div>
        </Link>
      </div>

      {/* 4. Split Operational Consoles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Console A: Recent Customer Orders */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Recent Orders & Dispatches
                </h2>
              </div>
              <Link
                href="/bookings"
                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                All Orders <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 mt-1">
              {loading ? (
                <div className="py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                  <span>Loading recent orders...</span>
                </div>
              ) : recentBookings.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs">
                  No recent bookings recorded.
                </div>
              ) : (
                recentBookings.map((b) => {
                  const customerName = b.customer?.name || b.users?.name || 'Customer';
                  return (
                    <div
                      key={b.id}
                      className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 px-1 rounded transition-colors"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px]">
                            {b.bookingNumber}
                          </span>
                          <StatusBadge status={b.status} size="sm" />
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 truncate">
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{customerName}</span>
                          <span className="text-slate-400 dark:text-slate-600">•</span>
                          <span className="text-slate-500 truncate">{b.snapshotCity || 'Gujarat'}</span>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                          ₹{(b.totalAmount ?? 0).toFixed(0)}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                          {b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'Today'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>Live order routing and technician dispatch</span>
            <Link href="/bookings" className="font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white">
              Open Dispatch Room &rarr;
            </Link>
          </div>
        </div>

        {/* Console B: Workforce Verification Pipeline */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Technician Workforce Pipeline
                </h2>
              </div>
              <Link
                href="/verifications"
                className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
              >
                Review Hub <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 mt-1">
              {loading ? (
                <div className="py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                  <span>Loading workforce roster...</span>
                </div>
              ) : technicians.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs">
                  No technician profiles registered.
                </div>
              ) : (
                technicians.map((t) => (
                  <div
                    key={t.id}
                    className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 px-1 rounded transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-3">
                      <div className="w-7 h-7 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-xs flex-shrink-0">
                        {t.fullName?.charAt(0) || 'T'}
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-slate-900 dark:text-white text-xs truncate">
                          {t.fullName || 'Technician'}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono truncate">
                          {t.contact || t.phone || 'No phone'} • {t.currentCity || 'Gujarat'}
                        </div>
                      </div>
                    </div>

                    <StatusBadge status={t.onboardingStatus} size="sm" />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>{stats.pendingCount} pending compliance verification</span>
            <Link href="/verifications" className="font-semibold text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-white">
              Open Verification Queue &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* 5. Live Security & Audit Stream */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Security & Administrative Audit Stream
            </h2>
            <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 uppercase">
              LIVE
            </span>
          </div>
          <Link
            href="/audit-logs"
            className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors inline-flex items-center gap-1"
          >
            Audit History <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60 mt-1">
          {loading ? (
            <div className="py-8 text-center text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-slate-400" />
              <span className="text-xs">Loading audit stream...</span>
            </div>
          ) : auditStream.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs">
              No recent audit events captured.
            </div>
          ) : (
            auditStream.map((event) => (
              <div
                key={event.id}
                className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/30 px-1 rounded transition-colors"
              >
                <div className="flex items-center gap-3 truncate pr-3">
                  <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                    {event.action}
                  </span>
                  <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                    {event.resourceType}
                  </span>
                  <span className="text-slate-500 text-[11px] hidden sm:inline truncate">
                    by {event.user?.name || event.userPhone || 'Operator'}
                  </span>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <StatusBadge status={event.status} size="sm" />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    {new Date(event.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 6. Operational Fast-Paths */}
      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            Fast Paths & Emergency Operations
          </span>
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
            Access Role: {adminRole}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <Link
            href="/live-ops"
            className="p-3 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-between shadow-2xs"
          >
            <span className="font-semibold">Live Ops Board</span>
            <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded">
              {stats.activeBookings}
            </span>
          </Link>
          <Link
            href="/verifications"
            className="p-3 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-between shadow-2xs"
          >
            <span className="font-semibold">KYC Queue</span>
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded">
              {stats.pendingCount}
            </span>
          </Link>
          <Link
            href="/finance"
            className="p-3 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-between shadow-2xs"
          >
            <span className="font-semibold">Ledger & Wallets</span>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">
              ₹{(stats.totalCommission / 1000).toFixed(0)}k
            </span>
          </Link>
          <Link
            href="/support"
            className="p-3 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-between shadow-2xs"
          >
            <span className="font-semibold">Support Desk</span>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
              Inbox
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
