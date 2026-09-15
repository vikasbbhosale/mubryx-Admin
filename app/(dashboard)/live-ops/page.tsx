"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Activity, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  Wrench, 
  ShieldAlert, 
  RefreshCw, 
  Search, 
  ChevronRight, 
  CheckCircle2, 
  ArrowUpRight,
  ExternalLink,
  Ban,
  Loader2
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CaseDrawer } from '@/components/ui/CaseDrawer';
import { DestructiveModal } from '@/components/ui/DestructiveModal';

interface BookingItem {
  id: string;
  bookingNumber: string;
  status: string;
  totalAmount: number;
  snapshotAddress: string;
  snapshotCity: string | null;
  scheduledAt: string | null;
  createdAt: string;
  customer?: {
    id: string;
    name: string | null;
    phone: string;
  };
  technician?: {
    id: string;
    fullName: string | null;
    currentCity: string | null;
    rating: number | null;
    user?: { phone: string };
  } | null;
  items?: Array<{
    id: string;
    service?: { title: string; price: number };
  }>;
}

export default function LiveOperationsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const [cancelBookingTarget, setCancelBookingTarget] = useState<BookingItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchLiveOps = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setRefreshing(true);
    setError(null);
    try {
      // Fetch active bookings
      const res = await fetch('/api/bookings?tab=active&limit=50');
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : data?.items || [];
        setBookings(items);
        if (selectedBooking) {
          const updated = items.find((b: BookingItem) => b.id === selectedBooking.id);
          if (updated) setSelectedBooking(updated);
        }
      } else {
        throw new Error(`Failed to load live dispatch queue (${res.status})`);
      }
    } catch (e: any) {
      console.error('Failed to fetch live operations', e);
      setError(e?.message || 'Failed to connect to operations dispatch stream.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedBooking]);

  useEffect(() => {
    fetchLiveOps();
    const timer = setInterval(() => fetchLiveOps(true), 20000);
    return () => clearInterval(timer);
  }, [fetchLiveOps]);

  // City list
  const cities = Array.from(
    new Set(bookings.map((b) => b.snapshotCity).filter(Boolean))
  ) as string[];

  // Filtered by search & city
  const filtered = bookings.filter((b) => {
    const matchesSearch =
      b.bookingNumber.toLowerCase().includes(search.toLowerCase()) ||
      b.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.customer?.phone?.includes(search) ||
      b.technician?.fullName?.toLowerCase().includes(search.toLowerCase());
    const matchesCity = selectedCity === 'ALL' || b.snapshotCity === selectedCity;
    return matchesSearch && matchesCity;
  });

  // Calculate live pipeline buckets
  const unassigned = filtered.filter((b) =>
    ['PENDING_MATCHING', 'TECHNICIAN_SEARCHING', 'PARTIALLY_ASSIGNED'].includes(b.status)
  );

  const dispatched = filtered.filter((b) =>
    ['TECHNICIAN_ASSIGNED', 'TECHNICIAN_ACCEPTED'].includes(b.status)
  );

  const enRoute = filtered.filter((b) =>
    ['TECHNICIAN_ON_THE_WAY'].includes(b.status)
  );

  const inService = filtered.filter((b) =>
    ['TECHNICIAN_ARRIVED', 'SERVICE_STARTED'].includes(b.status)
  );

  // At-risk detection (jobs created > 10 mins ago still unassigned, or pending payment)
  const now = new Date().getTime();
  const atRiskJobs = filtered.filter((b) => {
    const ageMins = (now - new Date(b.createdAt).getTime()) / (1000 * 60);
    return (
      (unassigned.some((u) => u.id === b.id) && ageMins > 10) ||
      b.status === 'PAYMENT_PENDING'
    );
  });

  const handleCancelBooking = async (reason: string) => {
    if (!cancelBookingTarget) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/bookings/${cancelBookingTarget.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED', reason }),
      });
      if (res.ok) {
        setCancelBookingTarget(null);
        fetchLiveOps();
      }
    } catch (e) {
      console.error('Cancellation error', e);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-500 animate-pulse" />
              Live Operations & Air-Traffic Control
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold uppercase">
              {bookings.length} Active Jobs
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time technician fulfillment monitoring, SLA compliance, and dispatch resolution.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => fetchLiveOps()}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-500 dark:text-blue-400' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/bookings"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-colors shadow-xs"
          >
            All Bookings &rarr;
          </Link>
        </div>
      </div>

      {/* Error state if failed */}
      {error && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-center justify-between text-xs text-rose-700 dark:text-rose-400">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchLiveOps()}
            className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium text-[11px] transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* 2. Operational Control Tickers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Searching / Unassigned
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-500 dark:text-amber-400 font-mono">
              {loading && bookings.length === 0 ? '-' : unassigned.length}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">jobs</span>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Technician Dispatched
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
              {loading && bookings.length === 0 ? '-' : (dispatched.length + enRoute.length)}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">{enRoute.length} on way</span>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            In Service Execution
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {loading && bookings.length === 0 ? '-' : inService.length}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">at customer</span>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
            At-Risk / SLA Alert
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
              {loading && bookings.length === 0 ? '-' : atRiskJobs.length}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">require action</span>
          </div>
        </div>
      </div>

      {/* 3. At-Risk Alert Banner (if any) */}
      {atRiskJobs.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/25 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>High Priority Intervention Queue ({atRiskJobs.length} Jobs At Risk)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {atRiskJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => setSelectedBooking(job)}
                className="bg-white dark:bg-slate-900/90 border border-rose-200 dark:border-rose-500/30 hover:border-rose-400 rounded-lg p-3 transition-colors cursor-pointer text-xs space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px]">
                    {job.bookingNumber}
                  </span>
                  <StatusBadge status={job.status} size="sm" />
                </div>
                <p className="text-slate-700 dark:text-slate-300 truncate font-medium">
                  {job.customer?.name || 'Customer'} • {job.snapshotCity || 'Gujarat'}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>₹{(job.totalAmount ?? 0).toFixed(0)}</span>
                  <span className="text-rose-600 dark:text-rose-400 font-semibold underline">Investigate &rarr;</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shadow-xs">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search active jobs by number, customer, technician..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {cities.length > 0 && (
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">City:</span>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Cities ({cities.length})</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 5. Kanban Style Dispatch Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Column 1: Unassigned / Matching */}
        <div className="bg-slate-100/70 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 flex flex-col min-h-[450px]">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800 mb-3">
            <span className="font-bold text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse" />
              Searching ({unassigned.length})
            </span>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto custom-scrollbar">
            {loading && bookings.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                <span>Syncing live stream...</span>
              </div>
            ) : unassigned.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                No jobs searching for technicians.
              </div>
            ) : (
              unassigned.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setSelectedBooking(job)}
                  className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500/50 rounded-lg cursor-pointer transition-colors space-y-2 text-xs shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px]">
                      {job.bookingNumber}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-mono text-[10px]">
                      ₹{(job.totalAmount ?? 0).toFixed(0)}
                    </span>
                  </div>
                  <div className="text-slate-700 dark:text-slate-300 font-medium truncate">
                    {job.customer?.name || 'Customer'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                    <MapPin className="w-3 h-3 flex-shrink-0 text-slate-400" />
                    <span>{job.snapshotCity || 'Gujarat'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: Dispatched & Assigned */}
        <div className="bg-slate-100/70 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 flex flex-col min-h-[450px]">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800 mb-3">
            <span className="font-bold text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400" />
              Dispatched ({dispatched.length})
            </span>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto custom-scrollbar">
            {loading && bookings.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span>Syncing live stream...</span>
              </div>
            ) : dispatched.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                No jobs awaiting technician acceptance.
              </div>
            ) : (
              dispatched.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setSelectedBooking(job)}
                  className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500/50 rounded-lg cursor-pointer transition-colors space-y-2 text-xs shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px]">
                      {job.bookingNumber}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-mono text-[10px]">
                      ₹{(job.totalAmount ?? 0).toFixed(0)}
                    </span>
                  </div>
                  <div className="text-slate-700 dark:text-slate-300 font-medium truncate">
                    {job.customer?.name || 'Customer'}
                  </div>
                  <div className="text-[11px] text-blue-600 dark:text-blue-400 truncate flex items-center gap-1 font-mono">
                    <Wrench className="w-3 h-3 flex-shrink-0" />
                    <span>Tech: {job.technician?.fullName || 'Assigned'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: En Route */}
        <div className="bg-slate-100/70 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 flex flex-col min-h-[450px]">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800 mb-3">
            <span className="font-bold text-xs uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500 dark:bg-purple-400 animate-ping" />
              En Route ({enRoute.length})
            </span>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto custom-scrollbar">
            {loading && bookings.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                <span>Syncing live stream...</span>
              </div>
            ) : enRoute.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                No technicians currently travelling to site.
              </div>
            ) : (
              enRoute.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setSelectedBooking(job)}
                  className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500/50 rounded-lg cursor-pointer transition-colors space-y-2 text-xs shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px]">
                      {job.bookingNumber}
                    </span>
                    <StatusBadge status={job.status} size="sm" />
                  </div>
                  <div className="text-slate-700 dark:text-slate-300 font-medium truncate">
                    {job.customer?.name || 'Customer'}
                  </div>
                  <div className="text-[11px] text-purple-600 dark:text-purple-300 truncate font-mono">
                    Tech: {job.technician?.fullName || 'In Transit'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 4: In Progress */}
        <div className="bg-slate-100/70 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 flex flex-col min-h-[450px]">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800 mb-3">
            <span className="font-bold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              In Execution ({inService.length})
            </span>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto custom-scrollbar">
            {loading && bookings.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                <span>Syncing live stream...</span>
              </div>
            ) : inService.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                No jobs actively in progress.
              </div>
            ) : (
              inService.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setSelectedBooking(job)}
                  className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500/50 rounded-lg cursor-pointer transition-colors space-y-2 text-xs shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px]">
                      {job.bookingNumber}
                    </span>
                    <StatusBadge status={job.status} size="sm" />
                  </div>
                  <div className="text-slate-700 dark:text-slate-300 font-medium truncate">
                    {job.customer?.name || 'Customer'}
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 truncate font-mono">
                    Executing: {job.technician?.fullName || 'Technician'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 6. Slide-Over Investigation Case Drawer */}
      <CaseDrawer
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        title={selectedBooking ? `Live Order ${selectedBooking.bookingNumber}` : ''}
        subtitle={selectedBooking?.snapshotCity || 'Operations Room'}
        badge={selectedBooking && <StatusBadge status={selectedBooking.status} size="sm" />}
        footer={
          selectedBooking && (
            <>
              <button
                onClick={() => setCancelBookingTarget(selectedBooking)}
                className="px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-lg transition-colors cursor-pointer"
              >
                Emergency Cancel
              </button>
              <Link
                href={`/bookings`}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors inline-flex items-center gap-1"
              >
                Full Booking View <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )
        }
      >
        {selectedBooking && (
          <div className="space-y-5">
            {/* Customer Snapshot */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Customer Information
              </span>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-900 dark:text-white font-medium">{selectedBooking.customer?.name || 'Customer'}</span>
                <span className="font-mono text-slate-600 dark:text-slate-400">{selectedBooking.customer?.phone || 'No phone'}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">{selectedBooking.snapshotAddress}</p>
            </div>

            {/* Technician Snapshot */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Assigned Technician
              </span>
              {selectedBooking.technician ? (
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-900 dark:text-white font-medium block">
                      {selectedBooking.technician.fullName}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {selectedBooking.technician.user?.phone || 'No direct phone'}
                    </span>
                  </div>
                  <span className="text-amber-500 dark:text-amber-400 font-mono font-bold">
                    ★ {selectedBooking.technician.rating ?? '5.0'}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  No technician assigned yet. System matching in progress.
                </p>
              )}
            </div>

            {/* Financial Overview */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Pricing & Order Value
              </span>
              <div className="flex items-center justify-between text-sm font-bold text-slate-900 dark:text-white font-mono">
                <span>Total Amount:</span>
                <span>₹{(selectedBooking.totalAmount ?? 0).toFixed(0)}</span>
              </div>
            </div>
          </div>
        )}
      </CaseDrawer>

      {/* Destructive Cancel Modal */}
      <DestructiveModal
        isOpen={!!cancelBookingTarget}
        onClose={() => setCancelBookingTarget(null)}
        onConfirm={handleCancelBooking}
        title={`Cancel Order ${cancelBookingTarget?.bookingNumber}`}
        description="Cancelling will immediately notify both customer and technician and release dispatches."
        confirmKeyword="CANCEL"
        confirmText="Cancel Order"
        isLoading={actionLoading}
        consequences={[
          'Releases assigned technician back to the available pool',
          'Triggers automatic customer notification and refund queue',
          'Records authoritative audit event with your administrator identity',
        ]}
      />
    </div>
  );
}
