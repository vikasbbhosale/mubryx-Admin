"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { 
  Users, 
  UserCheck, 
  FileCheck, 
  CalendarCheck, 
  Wallet, 
  TrendingUp, 
  Layers, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  ArrowUpRight, 
  ShieldCheck, 
  Shield, 
  ExternalLink, 
  ChevronRight, 
  MapPin, 
  Phone,
  FileText,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { TechnicianMock, getStatusBadgeColor } from '@/lib/mock-data';

interface DashboardStats {
  totalTechs: number;
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
  users?: {
    name: string | null;
    phone: string;
  };
}

interface AuditItem {
  id: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  status: string;
  createdAt: string;
  userPhone?: string | null;
  reason?: string | null;
  user?: {
    name: string | null;
    phone: string;
    role: string;
  } | null;
}

type OperationalDomain = 'ALL' | 'DISPATCH' | 'WORKFORCE' | 'FINANCE' | 'SECURITY';

export default function DashboardPage() {
  const [adminName, setAdminName] = useState('Administrator');
  const [adminRole, setAdminRole] = useState('ADMIN');
  const [selectedDomain, setSelectedDomain] = useState<OperationalDomain>('ALL');
  
  const [technicians, setTechnicians] = useState<TechnicianMock[]>([]);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [auditStream, setAuditStream] = useState<AuditItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<DashboardStats>({
    totalTechs: 0,
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

  const loadDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    setError(null);

    try {
      // 1. Fetch authenticated admin profile
      fetch('/api/auth/me')
        .then((res) => res.json())
        .then((data) => {
          if (data?.user) {
            if (data.user.name) setAdminName(data.user.name);
            if (data.user.role) setAdminRole(data.user.role);
          }
        })
        .catch(() => {});

      // 2. Fetch platform aggregates and recent items in parallel
      const [techsRes, statsRes, bookingsRes, auditRes] = await Promise.all([
        fetch('/api/technicians').then((r) => (r.ok ? r.json() : [])).catch(() => []),
        fetch('/api/dashboard/stats').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/bookings').then((r) => (r.ok ? r.json() : [])).catch(() => []),
        fetch('/api/audit-logs?limit=5').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);

      // Normalize technicians list
      if (techsRes) {
        const techList = Array.isArray(techsRes)
          ? techsRes
          : Array.isArray(techsRes?.data?.items)
          ? techsRes.data.items
          : Array.isArray(techsRes?.data)
          ? techsRes.data
          : Array.isArray(techsRes?.items)
          ? techsRes.items
          : [];
        setTechnicians(techList);
      }

      // Normalize stats
      if (statsRes) {
        const payload = statsRes?.data || statsRes;
        if (payload && typeof payload === 'object') {
          setStats({
            totalTechs: Number(payload.totalTechs ?? payload.techniciansCount ?? 0),
            approvedCount: Number(payload.approvedCount ?? payload.activeTechniciansCount ?? 0),
            pendingCount: Number(payload.pendingCount ?? payload.pendingVerificationsCount ?? 0),
            totalDocs: Number(payload.totalDocs ?? payload.totalDocumentsCount ?? 0),
            totalBookings: Number(payload.totalBookings ?? payload.totalBookingsCount ?? 0),
            activeBookings: Number(payload.activeBookings ?? payload.activeBookingsCount ?? 0),
            completedBookings: Number(payload.completedBookings ?? payload.completedBookingsCount ?? 0),
            totalServices: Number(payload.totalServices ?? payload.totalServicesCount ?? 0),
            totalCustomers: Number(payload.totalCustomers ?? payload.totalUsersCount ?? 0),
            grossRevenue: Number(payload.grossRevenue ?? payload.totalRevenue ?? 0),
            totalCommission: Number(payload.totalCommission ?? 0),
            adminWalletBalance: Number(payload.adminWalletBalance ?? 0),
          });
        }
      }

      // Normalize recent bookings
      if (bookingsRes) {
        const bookingList = Array.isArray(bookingsRes)
          ? bookingsRes
          : Array.isArray(bookingsRes?.data?.items)
          ? bookingsRes.data.items
          : Array.isArray(bookingsRes?.data)
          ? bookingsRes.data
          : Array.isArray(bookingsRes?.items)
          ? bookingsRes.items
          : [];
        setRecentBookings(bookingList.slice(0, 6));
      }

      // Normalize audit stream
      if (auditRes) {
        const auditList = Array.isArray(auditRes?.items)
          ? auditRes.items
          : Array.isArray(auditRes?.data?.items)
          ? auditRes.data.items
          : Array.isArray(auditRes)
          ? auditRes
          : [];
        setAuditStream(auditList.slice(0, 5));
      }

      setLastSynced(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err: any) {
      setError(err?.message || 'Error connecting to management services');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Status Chip helper
  const getBookingStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
      case 'SERVICE_COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'TECHNICIAN_ASSIGNED':
      case 'TECHNICIAN_ACCEPTED':
      case 'TECHNICIAN_ON_THE_WAY':
      case 'TECHNICIAN_ARRIVED':
      case 'SERVICE_STARTED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PENDING_MATCHING':
      case 'TECHNICIAN_SEARCHING':
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Full Skeleton Loader
  if (loading) {
    return (
      <div className="space-y-6 pb-12 max-w-7xl mx-auto animate-pulse">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center pb-4 border-b border-white/5">
          <div className="space-y-2">
            <div className="h-6 w-56 bg-white/5 rounded" />
            <div className="h-3 w-80 bg-white/5 rounded" />
          </div>
          <div className="h-8 w-24 bg-white/5 rounded" />
        </div>

        {/* Attention Skeleton */}
        <div className="h-12 bg-white/5 rounded-xl border border-white/5" />

        {/* KPI Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((k) => (
            <div key={k} className="p-4 bg-slate-900/40 rounded-xl border border-white/5 space-y-4">
              <div className="flex justify-between">
                <div className="h-3 w-24 bg-white/5 rounded" />
                <div className="h-4 w-4 bg-white/5 rounded-full" />
              </div>
              <div className="h-8 w-20 bg-white/10 rounded" />
              <div className="h-2.5 w-36 bg-white/5 rounded" />
            </div>
          ))}
        </div>

        {/* Feeds Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-900/40 rounded-xl border border-white/5 p-4" />
          <div className="h-80 bg-slate-900/40 rounded-xl border border-white/5 p-4" />
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="py-20 text-center max-w-md mx-auto relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(225,29,72,0.2)]">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-white tracking-wide">Dashboard Connectivity Issue</h2>
        <p className="text-sm text-slate-400 mt-2 mb-6 leading-relaxed">{error}</p>
        <button
          onClick={() => loadDashboardData(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 hover:bg-slate-200 text-sm font-bold rounded-xl transition-all shadow-lg hover:shadow-white/20 hover:-translate-y-0.5 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* 1. Operational Overview Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5 relative z-10">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              Operations & Governance
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-widest">
              {adminRole}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1.5">
            Production environment telemetry, active dispatches, compliance audits, and security logs.
          </p>
        </div>

        {/* Sync Status & Manual Refresh */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          {lastSynced && (
            <span className="text-[11px] font-mono font-medium text-slate-500">
              Synced {lastSynced}
            </span>
          )}
          <button
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
            className="group inline-flex items-center gap-2 px-4 py-2 bg-slate-900/50 hover:bg-slate-800/80 text-white text-xs font-bold rounded-xl border border-white/10 shadow-lg transition-all hover:border-white/20 cursor-pointer backdrop-blur-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-400' : 'text-slate-400 group-hover:text-white transition-colors'}`} />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>
        </div>
      </div>

      {/* 2. Multi-Team Operational Domain Switcher */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/5 text-xs font-bold tracking-wide relative z-10 custom-scrollbar">
        {[
          { id: 'ALL', label: 'All Operations', count: undefined },
          { id: 'DISPATCH', label: 'Dispatch & Orders', count: stats.activeBookings },
          { id: 'WORKFORCE', label: 'Workforce & KYC', count: stats.pendingCount },
          { id: 'FINANCE', label: 'Financials & Wallets', count: undefined },
          { id: 'SECURITY', label: 'Security & Audits', count: auditStream.length },
        ].map((domain) => {
          const isActive = selectedDomain === domain.id;
          return (
            <button
              key={domain.id}
              onClick={() => setSelectedDomain(domain.id as OperationalDomain)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer border ${
                isActive
                  ? 'bg-blue-600/10 text-blue-400 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                  : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/5 hover:border-white/10'
              }`}
            >
              <span>{domain.label}</span>
              {domain.count !== undefined && domain.count > 0 && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md font-bold ${
                    isActive
                      ? 'bg-blue-500/20 text-blue-300'
                      : domain.id === 'WORKFORCE'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {domain.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Attention Queue Banner (Actionable & Contextual) */}
      <div className="relative z-10">
        {stats.pendingCount > 0 ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gradient-to-r from-amber-500/10 to-amber-900/10 border border-amber-500/20 rounded-2xl text-xs shadow-lg shadow-amber-900/10 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <span className="font-bold text-amber-500 tracking-wide block text-sm mb-0.5">
                  Compliance Review Queue: {stats.pendingCount} action(s) pending audit.
                </span>
                <span className="text-amber-500/70">
                  KYC and identity uploads require verification before field dispatch access.
                </span>
              </div>
            </div>
            <Link
              href="/verifications"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-xl text-xs transition-all self-start sm:self-auto shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:shadow-[0_0_25px_rgba(245,158,11,0.6)]"
            >
              Review Queue <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : stats.activeBookings > 0 ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border border-blue-500/20 rounded-2xl text-xs shadow-lg shadow-blue-900/10 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 relative">
                <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-20"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,1)]"></div>
              </div>
              <div>
                <span className="font-bold text-blue-400 tracking-wide block text-sm mb-0.5">
                  {stats.activeBookings} active customer dispatches in progress
                </span>
                <span className="text-blue-400/70">Real-time matching and technician fulfillment ongoing.</span>
              </div>
            </div>
            <Link href="/bookings" className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl text-xs transition-all self-start sm:self-auto shadow-[0_0_15px_rgba(59,130,246,0.4)]">
              Monitor Live Orders <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl text-sm text-slate-400 shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="font-medium tracking-wide">Operational queues nominal • Zero pending verifications • All systems synchronized</span>
          </div>
        )}
      </div>

      {/* 4. High-Density KPI Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {/* Metric 1: Orders & Dispatches */}
        <Link
          href="/bookings"
          className="group p-5 bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/5 shadow-lg hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-500/30 transition-all hover:-translate-y-1 duration-300 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-[10px] uppercase tracking-widest text-slate-500 group-hover:text-blue-400 transition-colors">Active Dispatches</span>
              <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                <CalendarCheck className="w-4 h-4 text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-white font-mono group-hover:text-blue-50 transition-colors">
                {stats.activeBookings}
              </span>
              <span className="text-xs text-slate-400 font-medium">in field</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>{stats.totalBookings} total orders placed</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 transition-colors" />
          </div>
        </Link>

        {/* Metric 2: Workforce & Verification */}
        <Link
          href="/verifications"
          className="group p-5 bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/5 shadow-lg hover:shadow-2xl hover:shadow-amber-500/10 hover:border-amber-500/30 transition-all hover:-translate-y-1 duration-300 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-[10px] uppercase tracking-widest text-slate-500 group-hover:text-amber-400 transition-colors">Pending KYC Audits</span>
              <div className="p-2 bg-amber-500/10 rounded-lg group-hover:bg-amber-500/20 transition-colors">
                <UserCheck className="w-4 h-4 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-white font-mono group-hover:text-amber-50 transition-colors">
                {stats.pendingCount}
              </span>
              {stats.pendingCount > 0 ? (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/20 uppercase tracking-widest shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                  Action Required
                </span>
              ) : (
                <span className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase">Cleared</span>
              )}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>{stats.approvedCount} approved of {stats.totalTechs}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400 transition-colors" />
          </div>
        </Link>

        {/* Metric 3: Gross Order Volume */}
        <Link
          href="/finance"
          className="group p-5 bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/5 shadow-lg hover:shadow-2xl hover:shadow-emerald-500/10 hover:border-emerald-500/30 transition-all hover:-translate-y-1 duration-300 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-[10px] uppercase tracking-widest text-slate-500 group-hover:text-emerald-400 transition-colors">Gross Volume (GMV)</span>
              <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                <Wallet className="w-4 h-4 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-white font-mono group-hover:text-emerald-50 transition-colors">
                ₹{stats.grossRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>₹{stats.totalCommission.toLocaleString('en-IN', { maximumFractionDigits: 0 })} commission</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 transition-colors" />
          </div>
        </Link>

        {/* Metric 4: Platform Documents & Catalog */}
        <Link
          href="/documents"
          className="group p-5 bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/5 shadow-lg hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 transition-all hover:-translate-y-1 duration-300 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-[10px] uppercase tracking-widest text-slate-500 group-hover:text-indigo-400 transition-colors">KYC Documents</span>
              <div className="p-2 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                <FileCheck className="w-4 h-4 text-indigo-500 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-white font-mono group-hover:text-indigo-50 transition-colors">
                {stats.totalDocs}
              </span>
              <span className="text-xs text-slate-400 font-medium">on file</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>{stats.totalServices} active catalog services</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
          </div>
        </Link>
      </div>

      {/* 5. Production Operational Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        {/* Panel A: Live Customer Orders (Operations Team) */}
        <div className={`bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/5 shadow-lg p-5 flex flex-col justify-between ${
          selectedDomain === 'WORKFORCE' || selectedDomain === 'SECURITY' ? 'opacity-50 hover:opacity-100 transition-opacity' : ''
        }`}>
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-slate-400" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-300">
                  Recent Orders & Dispatches
                </h2>
              </div>
              <Link
                href="/bookings"
                className="text-[11px] font-bold tracking-wide text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1"
              >
                Dispatch Room <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-white/5 mt-2">
              {recentBookings.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs font-medium tracking-wide">
                  No recent bookings recorded in system.
                </div>
              ) : (
                recentBookings.map((b) => (
                  <div key={b.id} className="py-3 flex items-center justify-between text-xs hover:bg-white/5 px-2 -mx-2 rounded-xl transition-all cursor-default">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-white text-[11px] bg-slate-800/80 px-1.5 py-0.5 rounded">
                          {b.bookingNumber}
                        </span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold tracking-widest uppercase border ${
                          b.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          b.status === 'CANCELLED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          {b.status ? b.status.replace(/_/g, ' ') : 'PENDING'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                        <span className="font-medium text-slate-300">{b.users?.name || 'Customer'}</span>
                        <span className="text-slate-600">•</span>
                        <span className="truncate max-w-[140px] text-slate-500 font-mono">{b.snapshotCity || 'Ahmedabad'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-white text-xs bg-slate-800/50 px-2 py-1 rounded-md inline-block">
                        ₹{(b.totalAmount ?? 0).toFixed(0)}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-1">
                        {b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'Recent'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">Live order routing & technician matching</span>
            <Link href="/bookings" className="font-bold tracking-wide text-slate-300 hover:text-white transition-colors">
              Open All Bookings &rarr;
            </Link>
          </div>
        </div>

        {/* Panel B: Technician Compliance Pipeline (Workforce Team) */}
        <div className={`bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/5 shadow-lg p-5 flex flex-col justify-between ${
          selectedDomain === 'DISPATCH' || selectedDomain === 'FINANCE' ? 'opacity-50 hover:opacity-100 transition-opacity' : ''
        }`}>
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-slate-400" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-300">
                  Workforce Verification Pipeline
                </h2>
              </div>
              <Link
                href="/verifications"
                className="text-[11px] font-bold tracking-wide text-amber-500 hover:text-amber-400 transition-colors inline-flex items-center gap-1"
              >
                Verification Hub <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-white/5 mt-2">
              {technicians.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs font-medium tracking-wide">
                  No technician profiles currently registered.
                </div>
              ) : (
                technicians.slice(0, 6).map((tech) => (
                  <div key={tech.id} className="py-3 flex items-center justify-between text-xs hover:bg-white/5 px-2 -mx-2 rounded-xl transition-all cursor-default">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center font-black text-slate-300 text-xs flex-shrink-0">
                        {tech.fullName?.charAt(0) || 'T'}
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs tracking-wide">
                          {tech.fullName || 'Technician'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 bg-slate-800/50 px-1.5 py-0.5 rounded inline-block">
                          {tech.phone || 'No Contact'} <span className="text-slate-600 mx-1">•</span> {tech.currentCity || 'Gujarat'}
                        </div>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase rounded-md border ${
                      tech.onboardingStatus === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      tech.onboardingStatus === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-slate-800/80 text-slate-400 border-white/5'
                    }`}>
                      {tech.onboardingStatus ? tech.onboardingStatus.replace(/_/g, ' ') : 'SUBMITTED'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">{stats.pendingCount} pending compliance verification</span>
            <Link href="/verifications" className="font-bold tracking-wide text-slate-300 hover:text-white transition-colors">
              Audit Pending ({stats.pendingCount}) &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* 6. Live Security & Governance Audit Stream (Platform & Security Team) */}
      <div className={`bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/5 shadow-lg p-5 relative z-10 ${
        selectedDomain === 'DISPATCH' || selectedDomain === 'FINANCE' ? 'opacity-60 hover:opacity-100 transition-opacity' : ''
      }`}>
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-300">
              Security & Administrative Audit Stream
            </h2>
            <span className="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              Live Feed
            </span>
          </div>
          <Link
            href="/audit-logs"
            className="text-[11px] font-bold tracking-wide text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1"
          >
            Complete Audit Log <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-white/5 mt-2">
          {auditStream.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs font-medium tracking-wide">
              No recent audit events captured. Actions by administrators will stream here in real-time.
            </div>
          ) : (
            auditStream.map((event) => (
              <div key={event.id} className="py-3 flex items-center justify-between text-xs hover:bg-white/5 px-2 -mx-2 rounded-xl transition-all cursor-default">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[11px] font-bold text-white bg-slate-800 px-2 py-1 rounded-md">
                    {event.action}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-1 rounded-md bg-white/5 text-slate-400 font-semibold tracking-wide">
                    {event.resourceType}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                    by <span className="text-slate-300">{event.user?.name || event.userPhone || 'Operator'}</span>
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span className={`text-[9px] font-bold tracking-widest uppercase px-2 py-1 rounded-md border ${
                    event.status === 'SUCCESS'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    {event.status}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono font-medium">
                    {new Date(event.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 7. Quick Administrative Shortcuts & Guardrails */}
      <div className="bg-gradient-to-r from-slate-900/60 to-slate-900/40 backdrop-blur-2xl rounded-2xl border border-white/5 p-5 relative z-10 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-500" />
            Operational Fast Paths & Security Guardrails
          </span>
          <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/20 font-mono font-bold tracking-widest uppercase">
            Access Role: {adminRole}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-bold tracking-wide">
          <Link
            href="/verifications"
            className="group p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl text-white transition-all flex items-center justify-between"
          >
            <span className="group-hover:text-amber-400 transition-colors">KYC Approvals</span>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-950/50 px-2 py-0.5 rounded">{stats.pendingCount}</span>
          </Link>
          <Link
            href="/bookings"
            className="group p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl text-white transition-all flex items-center justify-between"
          >
            <span className="group-hover:text-blue-400 transition-colors">Dispatch Control</span>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-950/50 px-2 py-0.5 rounded">{stats.activeBookings}</span>
          </Link>
          <Link
            href="/services"
            className="group p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl text-white transition-all flex items-center justify-between"
          >
            <span className="group-hover:text-indigo-400 transition-colors">Catalog Offerings</span>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-950/50 px-2 py-0.5 rounded">{stats.totalServices}</span>
          </Link>
          <Link
            href="/audit-logs"
            className="group p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl text-white transition-all flex items-center justify-between"
          >
            <span className="group-hover:text-rose-400 transition-colors">Security Logs</span>
            <span className="text-[10px] font-mono text-rose-500/50 bg-rose-500/10 border border-rose-500/10 px-2 py-0.5 rounded uppercase">Live</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
