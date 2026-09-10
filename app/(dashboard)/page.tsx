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
        <div className="flex justify-between items-center pb-4 border-b border-slate-200">
          <div className="space-y-2">
            <div className="h-6 w-56 bg-slate-200 rounded" />
            <div className="h-3 w-80 bg-slate-100 rounded" />
          </div>
          <div className="h-8 w-24 bg-slate-200 rounded" />
        </div>

        {/* Attention Skeleton */}
        <div className="h-12 bg-slate-100 rounded-lg" />

        {/* KPI Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((k) => (
            <div key={k} className="p-4 bg-white rounded-lg border border-slate-200 space-y-3">
              <div className="h-3 w-24 bg-slate-200 rounded" />
              <div className="h-7 w-20 bg-slate-300 rounded" />
              <div className="h-2.5 w-36 bg-slate-100 rounded" />
            </div>
          ))}
        </div>

        {/* Feeds Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-white rounded-lg border border-slate-200 p-4" />
          <div className="h-80 bg-white rounded-lg border border-slate-200 p-4" />
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="py-20 text-center max-w-md mx-auto">
        <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-semibold text-slate-900">Dashboard Connectivity Issue</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">{error}</p>
        <button
          onClick={() => loadDashboardData(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* 1. Operational Overview Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Operations & Governance
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
              {adminRole}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Production environment telemetry, active dispatches, compliance audits, and security logs.
          </p>
        </div>

        {/* Sync Status & Manual Refresh */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          {lastSynced && (
            <span className="text-[11px] font-mono text-slate-400">
              Synced {lastSynced}
            </span>
          )}
          <button
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-md border border-slate-200/80 shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-slate-400' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Multi-Team Operational Domain Switcher */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100 text-xs font-medium">
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
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{domain.label}</span>
              {domain.count !== undefined && domain.count > 0 && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                    isActive
                      ? 'bg-slate-700 text-white'
                      : domain.id === 'WORKFORCE'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-200 text-slate-700'
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
      {stats.pendingCount > 0 ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-amber-50/75 border border-amber-200/90 rounded-lg text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <div>
              <span className="font-semibold text-amber-900">
                Compliance Review Queue: {stats.pendingCount} technician application(s) pending audit.
              </span>
              <span className="text-amber-700 hidden md:inline ml-1">
                KYC and identity uploads require verification before field dispatch access.
              </span>
            </div>
          </div>
          <Link
            href="/verifications"
            className="inline-flex items-center gap-1 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded text-xs transition-colors self-start sm:self-auto"
          >
            Review Queue <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : stats.activeBookings > 0 ? (
        <div className="flex items-center justify-between p-3 bg-blue-50/60 border border-blue-200/80 rounded-lg text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="font-semibold">{stats.activeBookings} active customer dispatches</span>
            <span className="text-blue-700 hidden sm:inline">• Real-time matching and technician fulfillment in progress</span>
          </div>
          <Link href="/bookings" className="text-blue-700 font-semibold hover:underline text-xs">
            Monitor Live Orders &rarr;
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-600">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Operational queues nominal • Zero pending verifications • All systems synchronized</span>
        </div>
      )}

      {/* 4. High-Density KPI Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Orders & Dispatches */}
        <Link
          href="/bookings"
          className="group p-4 bg-white rounded-lg border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-medium text-[11px] uppercase tracking-wider text-slate-500">Active Dispatches</span>
              <CalendarCheck className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {stats.activeBookings}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">in field</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>{stats.totalBookings} total orders placed</span>
            <span className="text-slate-400 group-hover:text-slate-700 transition-colors">&rarr;</span>
          </div>
        </Link>

        {/* Metric 2: Workforce & Verification */}
        <Link
          href="/verifications"
          className="group p-4 bg-white rounded-lg border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-medium text-[11px] uppercase tracking-wider text-slate-500">Pending KYC Audits</span>
              <UserCheck className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {stats.pendingCount}
              </span>
              {stats.pendingCount > 0 ? (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                  Action Required
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-emerald-600">Cleared</span>
              )}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>{stats.approvedCount} approved of {stats.totalTechs}</span>
            <span className="text-slate-400 group-hover:text-slate-700 transition-colors">&rarr;</span>
          </div>
        </Link>

        {/* Metric 3: Gross Order Volume */}
        <Link
          href="/finance"
          className="group p-4 bg-white rounded-lg border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-medium text-[11px] uppercase tracking-wider text-slate-500">Gross Volume (GMV)</span>
              <Wallet className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                ₹{stats.grossRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>₹{stats.totalCommission.toLocaleString('en-IN', { maximumFractionDigits: 0 })} commission</span>
            <span className="text-slate-400 group-hover:text-slate-700 transition-colors">&rarr;</span>
          </div>
        </Link>

        {/* Metric 4: Platform Documents & Catalog */}
        <Link
          href="/documents"
          className="group p-4 bg-white rounded-lg border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-medium text-[11px] uppercase tracking-wider text-slate-500">KYC Documents</span>
              <FileCheck className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {stats.totalDocs}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">on file</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>{stats.totalServices} active catalog services</span>
            <span className="text-slate-400 group-hover:text-slate-700 transition-colors">&rarr;</span>
          </div>
        </Link>
      </div>

      {/* 5. Production Operational Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel A: Live Customer Orders (Operations Team) */}
        <div className={`bg-white rounded-lg border border-slate-200/80 shadow-2xs p-4 flex flex-col justify-between ${
          selectedDomain === 'WORKFORCE' || selectedDomain === 'SECURITY' ? 'opacity-50 hover:opacity-100 transition-opacity' : ''
        }`}>
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-slate-500" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Recent Orders & Dispatches
                </h2>
              </div>
              <Link
                href="/bookings"
                className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 transition-colors inline-flex items-center gap-0.5"
              >
                Dispatch Room <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 mt-1">
              {recentBookings.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No recent bookings recorded in system.
                </div>
              ) : (
                recentBookings.map((b) => (
                  <div key={b.id} className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/50 px-1 rounded transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-[11px]">
                          {b.bookingNumber}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${getBookingStatusBadge(b.status)}`}>
                          {b.status ? b.status.replace(/_/g, ' ') : 'PENDING'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <span className="font-medium text-slate-700">{b.users?.name || 'Customer'}</span>
                        <span className="text-slate-300">•</span>
                        <span className="truncate max-w-[140px] text-slate-400">{b.snapshotCity || 'Ahmedabad'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-900 text-xs">
                        ₹{(b.totalAmount ?? 0).toFixed(0)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'Recent'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Live order routing & technician matching</span>
            <Link href="/bookings" className="font-semibold text-slate-700 hover:text-slate-900">
              Open All Bookings &rarr;
            </Link>
          </div>
        </div>

        {/* Panel B: Technician Compliance Pipeline (Workforce Team) */}
        <div className={`bg-white rounded-lg border border-slate-200/80 shadow-2xs p-4 flex flex-col justify-between ${
          selectedDomain === 'DISPATCH' || selectedDomain === 'FINANCE' ? 'opacity-50 hover:opacity-100 transition-opacity' : ''
        }`}>
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-slate-500" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Workforce Verification Pipeline
                </h2>
              </div>
              <Link
                href="/verifications"
                className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 transition-colors inline-flex items-center gap-0.5"
              >
                Verification Hub <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 mt-1">
              {technicians.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No technician profiles currently registered.
                </div>
              ) : (
                technicians.slice(0, 6).map((tech) => (
                  <div key={tech.id} className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/50 px-1 rounded transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-[11px] flex-shrink-0">
                        {tech.fullName?.charAt(0) || 'T'}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-xs leading-none">
                          {tech.fullName || 'Technician'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {tech.phone || 'No Contact'} • {tech.currentCity || 'Gujarat'}
                        </div>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${getStatusBadgeColor(tech.onboardingStatus)}`}>
                      {tech.onboardingStatus ? tech.onboardingStatus.replace(/_/g, ' ') : 'SUBMITTED'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">{stats.pendingCount} pending compliance verification</span>
            <Link href="/verifications" className="font-semibold text-slate-700 hover:text-slate-900">
              Audit Pending ({stats.pendingCount}) &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* 6. Live Security & Governance Audit Stream (Platform & Security Team) */}
      <div className={`bg-white rounded-lg border border-slate-200/80 shadow-2xs p-4 ${
        selectedDomain === 'DISPATCH' || selectedDomain === 'FINANCE' ? 'opacity-60 hover:opacity-100 transition-opacity' : ''
      }`}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Security & Administrative Audit Stream
            </h2>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
              Live Feed
            </span>
          </div>
          <Link
            href="/audit-logs"
            className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 transition-colors inline-flex items-center gap-0.5"
          >
            Complete Audit Log <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100 mt-1">
          {auditStream.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No recent audit events captured. Actions by administrators will stream here in real-time.
            </div>
          ) : (
            auditStream.map((event) => (
              <div key={event.id} className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/50 px-1 rounded transition-colors">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] font-semibold text-slate-900">
                    {event.action}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {event.resourceType}
                  </span>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    by {event.user?.name || event.userPhone || 'Operator'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                    event.status === 'SUCCESS'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {event.status}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(event.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 7. Quick Administrative Shortcuts & Guardrails */}
      <div className="bg-slate-50 rounded-lg border border-slate-200/80 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-slate-500" />
            Operational Fast Paths & Security Guardrails
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            Access Role: {adminRole}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-semibold">
          <Link
            href="/verifications"
            className="p-2.5 bg-white hover:bg-slate-100/80 border border-slate-200/90 rounded-md text-slate-800 transition-colors flex items-center justify-between"
          >
            <span>KYC Approvals</span>
            <span className="text-[10px] font-mono text-slate-400">{stats.pendingCount}</span>
          </Link>
          <Link
            href="/bookings"
            className="p-2.5 bg-white hover:bg-slate-100/80 border border-slate-200/90 rounded-md text-slate-800 transition-colors flex items-center justify-between"
          >
            <span>Dispatch Control</span>
            <span className="text-[10px] font-mono text-slate-400">{stats.activeBookings}</span>
          </Link>
          <Link
            href="/services"
            className="p-2.5 bg-white hover:bg-slate-100/80 border border-slate-200/90 rounded-md text-slate-800 transition-colors flex items-center justify-between"
          >
            <span>Catalog Offerings</span>
            <span className="text-[10px] font-mono text-slate-400">{stats.totalServices}</span>
          </Link>
          <Link
            href="/audit-logs"
            className="p-2.5 bg-white hover:bg-slate-100/80 border border-slate-200/90 rounded-md text-slate-800 transition-colors flex items-center justify-between"
          >
            <span>Security Logs</span>
            <span className="text-[10px] font-mono text-slate-400">Live</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
