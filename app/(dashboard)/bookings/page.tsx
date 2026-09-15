"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  CalendarCheck, 
  Search, 
  Filter, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  Wrench, 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  AlertTriangle,
  Eye, 
  Loader2, 
  ChevronRight,
  ShieldCheck, 
  RefreshCw,
  MoreVertical,
  X,
  FileText,
  DollarSign,
  ArrowUpRight
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CaseDrawer } from '@/components/ui/CaseDrawer';
import { DestructiveModal } from '@/components/ui/DestructiveModal';

interface BookingItem {
  id: string;
  serviceTitleSnapshot: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  status: string;
  durationSnapshot?: string;
  service?: { id: string; title: string; price: number; image?: string };
}

interface DispatchItem {
  id: string;
  status: string;
  distanceKm: number;
  technician?: {
    id: string;
    fullName: string | null;
    currentCity: string | null;
    user?: { phone: string };
  };
  technician_profiles?: {
    id: string;
    fullName: string | null;
    contact: string | null;
  };
}

interface StatusHistoryItem {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  changedBy: string | null;
  changedByType: string | null;
  reason: string | null;
  createdAt: string;
}

interface Booking {
  id: string;
  bookingNumber: string;
  bookingType: string;
  status: string;
  snapshotLabel: string;
  snapshotAddress: string;
  snapshotCity: string | null;
  snapshotState: string | null;
  snapshotPostalCode: string | null;
  serviceLatitude: number | null;
  serviceLongitude: number | null;
  scheduledAt: string | null;
  createdAt: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  otp: string | null;
  happyCode: string | null;
  customerNotes: string | null;
  cancellationReason: string | null;
  customer?: {
    id: string;
    name: string | null;
    phone: string;
    email: string | null;
  };
  users?: {
    id: string;
    name: string | null;
    phone: string;
    email: string | null;
  };
  technician?: {
    id: string;
    fullName: string | null;
    currentCity: string | null;
    rating: number | null;
    user?: { phone: string };
  } | null;
  technician_profiles?: {
    id: string;
    fullName: string | null;
    contact: string | null;
    rating: number | null;
  } | null;
  items?: BookingItem[];
  booking_items?: BookingItem[];
  dispatches?: DispatchItem[];
  booking_dispatches?: DispatchItem[];
  statusHistory?: StatusHistoryItem[];
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [drawerBookingDetail, setDrawerBookingDetail] = useState<Booking | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBookings = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setRefreshing(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (activeTab === 'ACTIVE') params.set('tab', 'active');
      else if (activeTab === 'COMPLETED') params.set('tab', 'completed');
      else if (activeTab === 'CANCELLED') params.set('tab', 'cancelled');

      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());
      params.set('limit', '50');

      const res = await fetch(`/api/bookings?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : data?.items || [];
        setBookings(items);

        if (selectedBooking) {
          const updated = items.find((b: Booking) => b.id === selectedBooking.id);
          if (updated) setSelectedBooking(updated);
        }
      } else {
        throw new Error(`Failed to load bookings (${res.status})`);
      }
    } catch (e: any) {
      console.error('Error loading bookings', e);
      setError(e?.message || 'Error fetching bookings from order management API');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, statusFilter, search, selectedBooking]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // When a booking is selected for detailed inspection, fetch full booking details
  const openBookingDrawer = async (b: Booking) => {
    setSelectedBooking(b);
    setDrawerBookingDetail(b);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/bookings/${b.id}`);
      if (res.ok) {
        const full = await res.json();
        setDrawerBookingDetail(full);
      }
    } catch (e) {
      console.error('Failed to load full booking details', e);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCancelBooking = async (reason: string) => {
    if (!cancelTarget) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/bookings/${cancelTarget.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED', reason }),
      });
      if (res.ok) {
        setCancelTarget(null);
        if (selectedBooking?.id === cancelTarget.id) {
          setSelectedBooking(null);
          setDrawerBookingDetail(null);
        }
        fetchBookings();
      }
    } catch (e) {
      console.error('Error cancelling booking', e);
    } finally {
      setActionLoading(false);
    }
  };

  const rawItems = drawerBookingDetail?.items || drawerBookingDetail?.booking_items || [];
  const rawDispatches = drawerBookingDetail?.dispatches || drawerBookingDetail?.booking_dispatches || [];
  const rawHistory = drawerBookingDetail?.statusHistory || [];
  const customer = drawerBookingDetail?.customer || drawerBookingDetail?.users;
  const technician = drawerBookingDetail?.technician || drawerBookingDetail?.technician_profiles;

  return (
    <div className="space-y-4 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-blue-600 dark:text-blue-500" />
            Orders & Dispatches
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Authoritative lifecycle control, fulfillment tracking, and dispute intervention.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => fetchBookings()}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-500 dark:text-blue-400' : ''}`} />
            <span>Sync</span>
          </button>
          <Link
            href="/live-ops"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer shadow-xs"
          >
            <span>Live Ops Board</span>
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
            onClick={() => fetchBookings()}
            className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium text-[11px] transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. Operational Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
          {(['ALL', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setStatusFilter('ALL');
              }}
              className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Search & Fine Filter */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order #, customer, phone..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING_MATCHING">Searching</option>
            <option value="TECHNICIAN_ASSIGNED">Assigned</option>
            <option value="TECHNICIAN_ON_THE_WAY">On The Way</option>
            <option value="SERVICE_STARTED">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* 3. High-Density Operational Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-4">Order ID</th>
                <th className="py-2.5 px-4">Customer</th>
                <th className="py-2.5 px-4">Location</th>
                <th className="py-2.5 px-4">Technician</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Payment</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600 dark:text-blue-500" />
                    <span>Loading operational orders...</span>
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => {
                  const cust = b.customer || b.users;
                  const tech = b.technician || b.technician_profiles;
                  return (
                    <tr
                      key={b.id}
                      onClick={() => openBookingDrawer(b)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                    >
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {b.bookingNumber}
                      </td>

                      <td className="py-2.5 px-4 max-w-[160px] truncate">
                        <span className="font-semibold text-slate-900 dark:text-slate-200 block truncate">
                          {cust?.name || 'Customer'}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-500 font-mono block truncate">
                          {cust?.phone || 'No phone'}
                        </span>
                      </td>

                      <td className="py-2.5 px-4 max-w-[160px] truncate">
                        <span className="truncate block font-medium text-slate-800 dark:text-slate-300">
                          {b.snapshotCity || 'Gujarat'}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-500 truncate block">
                          {b.snapshotAddress || 'Address'}
                        </span>
                      </td>

                      <td className="py-2.5 px-4 max-w-[150px] truncate">
                        {tech?.fullName ? (
                          <div>
                            <span className="text-slate-900 dark:text-slate-200 font-medium block truncate">
                              {tech.fullName}
                            </span>
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono block">
                              Assigned
                            </span>
                          </div>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400/80 font-mono text-[11px]">
                            Unassigned
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <StatusBadge status={b.status} size="sm" />
                      </td>

                      <td className="py-2.5 px-4 whitespace-nowrap font-mono text-[11px]">
                        <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${
                          b.paymentStatus === 'PAID'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        }`}>
                          {b.paymentStatus}
                        </span>
                      </td>

                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        ₹{(b.totalAmount ?? 0).toFixed(0)}
                      </td>

                      <td className="py-2.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openBookingDrawer(b)}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-blue-600 dark:bg-slate-800 dark:hover:bg-blue-600 text-slate-700 hover:text-white dark:text-slate-200 dark:hover:text-white transition-colors cursor-pointer"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-500">
          <span>Showing {bookings.length} order(s)</span>
          <span className="font-mono text-[11px]">Page 1 of 1</span>
        </div>
      </div>

      {/* 4. Slide-Over Investigation Case Drawer */}
      <CaseDrawer
        isOpen={!!selectedBooking}
        onClose={() => {
          setSelectedBooking(null);
          setDrawerBookingDetail(null);
        }}
        title={drawerBookingDetail ? `Order ${drawerBookingDetail.bookingNumber}` : ''}
        subtitle={drawerBookingDetail?.snapshotCity || 'Operations Investigation'}
        badge={drawerBookingDetail && <StatusBadge status={drawerBookingDetail.status} size="sm" />}
        footer={
          drawerBookingDetail && (
            <>
              {drawerBookingDetail.status !== 'CANCELLED' && drawerBookingDetail.status !== 'COMPLETED' && (
                <button
                  onClick={() => setCancelTarget(drawerBookingDetail)}
                  className="px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel Booking
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedBooking(null);
                  setDrawerBookingDetail(null);
                }}
                className="px-4 py-1.5 text-xs font-bold text-slate-700 dark:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Close Drawer
              </button>
            </>
          )
        }
      >
        {detailLoading ? (
          <div className="py-16 text-center text-slate-400 dark:text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600 dark:text-blue-500" />
            <span>Loading complete case context...</span>
          </div>
        ) : drawerBookingDetail && (
          <div className="space-y-6">
            {/* Customer Snapshot */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Customer Information
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                  VERIFIED CUSTOMER
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-900 dark:text-white font-bold text-sm">{customer?.name || 'Customer'}</span>
                <a
                  href={`tel:${customer?.phone}`}
                  className="font-mono text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Phone className="w-3 h-3" />
                  {customer?.phone || 'No phone'}
                </a>
              </div>
              <div className="text-slate-600 dark:text-slate-400 text-xs flex items-start gap-1.5 pt-1 border-t border-slate-200 dark:border-slate-800/60">
                <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0 mt-0.5" />
                <span>{drawerBookingDetail.snapshotAddress}</span>
              </div>
            </div>

            {/* Technician Snapshot */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Assigned Workforce Partner
              </span>
              {technician?.fullName ? (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-900 dark:text-white font-bold block">{technician.fullName}</span>
                      <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {(technician as any).user?.phone || (technician as any).contact || 'Field Contact'}
                      </span>
                    </div>
                    <span className="text-amber-500 dark:text-amber-400 font-mono font-bold text-xs bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      ★ {technician.rating ?? '4.8'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-700 dark:text-amber-300">
                  No technician currently locked for this dispatch.
                </div>
              )}
            </div>

            {/* Service Items Snapshot */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Service Package Items
              </span>
              <div className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs">
                {rawItems.length === 0 ? (
                  <p className="text-slate-400 dark:text-slate-500">No specific line items cataloged.</p>
                ) : (
                  rawItems.map((item) => (
                    <div key={item.id} className="py-2 flex items-center justify-between">
                      <div>
                        <span className="text-slate-900 dark:text-white font-medium block">
                          {item.serviceTitleSnapshot || item.service?.title || 'Service Item'}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-500">
                          Qty: {item.quantity} • {item.durationSnapshot || '45 mins'}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        ₹{(item.lineTotal ?? 0).toFixed(0)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Financial Ledger & Pricing Breakdown */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                Financial Breakdown
              </span>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal</span>
                <span className="font-mono">₹{(drawerBookingDetail.subtotal ?? 0).toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Discount / Coupon</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">-₹{(drawerBookingDetail.discount ?? 0).toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>GST Tax</span>
                <span className="font-mono">₹{(drawerBookingDetail.tax ?? 0).toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-slate-900 dark:text-white font-bold text-sm pt-2 border-t border-slate-200 dark:border-slate-800">
                <span>Total Amount</span>
                <span className="font-mono">₹{(drawerBookingDetail.totalAmount ?? 0).toFixed(0)}</span>
              </div>
            </div>

            {/* Booking Lifecycle History Timeline */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Lifecycle Status Timeline
              </span>
              <div className="relative pl-5 space-y-4 border-l border-slate-200 dark:border-slate-800 text-xs">
                {rawHistory.length === 0 ? (
                  <div className="relative">
                    <span className="absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="text-slate-900 dark:text-white font-semibold block">{drawerBookingDetail.status}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-500 font-mono">
                      {new Date(drawerBookingDetail.createdAt).toLocaleString('en-IN')}
                    </span>
                  </div>
                ) : (
                  rawHistory.map((h) => (
                    <div key={h.id} className="relative">
                      <span className="absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 dark:text-white font-bold">{h.toStatus.replace(/_/g, ' ')}</span>
                        <span className="text-[9px] font-mono px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase">
                          {h.changedByType || 'SYSTEM'}
                        </span>
                      </div>
                      {h.reason && (
                        <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">{h.reason}</p>
                      )}
                      <span className="text-[10px] text-slate-500 dark:text-slate-500 font-mono mt-0.5 block">
                        {new Date(h.createdAt).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </CaseDrawer>

      {/* Destructive Cancel Modal */}
      <DestructiveModal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelBooking}
        title={`Cancel Order ${cancelTarget?.bookingNumber}`}
        description="Are you sure you want to cancel this booking? This will cancel all line items and emit realtime notifications."
        confirmKeyword="CANCEL"
        confirmText="Cancel Order"
        isLoading={actionLoading}
        consequences={[
          'All pending technician dispatches will be revoked',
          'A status audit record will be logged with your administrator identity',
          'Customer and technician will receive push notifications',
        ]}
      />
    </div>
  );
}
