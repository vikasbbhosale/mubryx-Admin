"use client";

import { useState, useEffect } from 'react';
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
  Key, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Eye, 
  Loader2, 
  ChevronRight,
  ShieldCheck,
  Send,
  X
} from 'lucide-react';

interface BookingItem {
  id: string;
  serviceTitleSnapshot: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  status: string;
}

interface DispatchItem {
  id: string;
  status: string;
  distanceKm: number;
  technician_profiles?: {
    id: string;
    fullName: string | null;
    contact: string | null;
  };
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
  users?: {
    id: string;
    name: string | null;
    phone: string;
    email: string | null;
  };
  technician_profiles?: {
    id: string;
    fullName: string | null;
    contact: string | null;
    rating: number | null;
  } | null;
  booking_items: BookingItem[];
  booking_dispatches: DispatchItem[];
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (statusFilter !== 'ALL') queryParams.append('status', statusFilter);
      if (search) queryParams.append('search', search);

      const res = await fetch(`/api/bookings?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
        if (selectedBooking) {
          const updated = data.find((b: Booking) => b.id === selectedBooking.id);
          if (updated) setSelectedBooking(updated);
        }
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBookings();
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: string, reason?: string) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reason: reason || cancelReason })
      });

      if (res.ok) {
        setShowCancelModal(false);
        setCancelReason('');
        await fetchBookings();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to update booking status');
      }
    } catch (error) {
      console.error('Failed to update status', error);
      alert('Network error updating status');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'SERVICE_STARTED':
      case 'TECHNICIAN_ARRIVED':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'TECHNICIAN_ASSIGNED':
      case 'TECHNICIAN_ACCEPTED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'TECHNICIAN_SEARCHING':
      case 'PENDING_MATCHING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CANCELLED':
      case 'FAILED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const totalCount = bookings.length;
  const searchingCount = bookings.filter(b => b.status === 'TECHNICIAN_SEARCHING' || b.status === 'PENDING_MATCHING').length;
  const activeCount = bookings.filter(b => ['TECHNICIAN_ASSIGNED', 'TECHNICIAN_ACCEPTED', 'TECHNICIAN_ON_THE_WAY', 'TECHNICIAN_ARRIVED', 'SERVICE_STARTED'].includes(b.status)).length;
  const completedCount = bookings.filter(b => b.status === 'COMPLETED').length;

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Bookings & Dispatch</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Live Orders
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Real-time tracking of customer bookings, technician dispatches, OTPs, and payment settlements.
          </p>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Orders</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-medium text-amber-600 uppercase tracking-wider">Searching Technician</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{searchingCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-medium text-blue-600 uppercase tracking-wider">In Progress</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{activeCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Completed</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{completedCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {[
            { label: 'All Orders', val: 'ALL' },
            { label: 'Searching Tech', val: 'TECHNICIAN_SEARCHING' },
            { label: 'Assigned', val: 'TECHNICIAN_ASSIGNED' },
            { label: 'Started', val: 'SERVICE_STARTED' },
            { label: 'Completed', val: 'COMPLETED' },
            { label: 'Cancelled', val: 'CANCELLED' },
          ].map(tab => (
            <button
              key={tab.val}
              onClick={() => setStatusFilter(tab.val)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                statusFilter === tab.val
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72 flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search booking, customer, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs font-medium rounded-xl pl-9 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); fetchBookings(); }}
              className="absolute right-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>

      {/* Bookings Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Bookings Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            No bookings matched the selected status or search criteria.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Booking No. & Type</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Location Snapshot</th>
                  <th className="px-5 py-3.5">Items & Amount</th>
                  <th className="px-5 py-3.5">Technician</th>
                  <th className="px-5 py-3.5">OTP & Security</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Booking No */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 font-mono text-[13px]">
                        {b.bookingNumber}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${b.bookingType === 'ASAP' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'}`}>
                          {b.bookingType}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{b.users?.name || 'Customer'}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {b.users?.phone}
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-5 py-4 max-w-[200px]">
                      <div className="truncate text-slate-800 font-medium" title={b.snapshotAddress}>
                        {b.snapshotAddress}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {b.snapshotCity || 'Ahmedabad'}, {b.snapshotPostalCode}
                      </div>
                    </td>

                    {/* Items & Amount */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 text-sm">
                        ₹{b.totalAmount.toFixed(2)}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[140px]">
                        {b.booking_items.length} item(s): {b.booking_items[0]?.serviceTitleSnapshot}
                      </div>
                    </td>

                    {/* Technician */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {b.technician_profiles ? (
                        <div>
                          <div className="font-bold text-slate-900">
                            {b.technician_profiles.fullName || 'Assigned Tech'}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {b.technician_profiles.contact}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-amber-600 font-medium">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                          <span>Searching...</span>
                        </div>
                      )}
                    </td>

                    {/* OTP */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {b.otp ? (
                        <div className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-mono text-xs font-bold border border-slate-200">
                          <Key className="w-3 h-3 text-blue-600" />
                          OTP: {b.otp}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                      {b.happyCode && (
                        <div className="text-[10px] text-emerald-600 font-mono mt-0.5">
                          Happy Code: {b.happyCode}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadge(b.status)}`}>
                        {b.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => setSelectedBooking(b)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-blue-200"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspect Booking Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 font-mono">
                    {selectedBooking.bookingNumber}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(selectedBooking.status)}`}>
                    {selectedBooking.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Placed on {new Date(selectedBooking.createdAt).toLocaleString('en-IN')}
                </p>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Customer & Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    Customer Details
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {selectedBooking.users?.name || 'Customer'}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Phone: <span className="font-mono font-semibold">{selectedBooking.users?.phone}</span>
                  </div>
                  {selectedBooking.users?.email && (
                    <div className="text-xs text-slate-500 mt-0.5">
                      Email: {selectedBooking.users.email}
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    Service Location
                  </div>
                  <div className="text-xs text-slate-800 leading-relaxed font-medium">
                    {selectedBooking.snapshotAddress}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    City: {selectedBooking.snapshotCity || 'Ahmedabad'} | PIN: {selectedBooking.snapshotPostalCode}
                  </div>
                </div>
              </div>

              {/* Service Items */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                  Ordered Services & Pricing
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                  {selectedBooking.booking_items.map((item) => (
                    <div key={item.id} className="p-3.5 flex items-center justify-between bg-white">
                      <div>
                        <div className="font-bold text-slate-900">{item.serviceTitleSnapshot}</div>
                        <div className="text-slate-500 text-[11px]">Qty: {item.quantity} × ₹{item.unitPrice}</div>
                      </div>
                      <div className="font-bold text-slate-900 text-sm">
                        ₹{item.lineTotal.toFixed(2)}
                      </div>
                    </div>
                  ))}
                  <div className="p-3.5 bg-slate-50/70 flex flex-col gap-1 text-slate-600">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₹{selectedBooking.subtotal.toFixed(2)}</span>
                    </div>
                    {selectedBooking.discount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount</span>
                        <span>-₹{selectedBooking.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Tax / GST</span>
                      <span>₹{selectedBooking.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                      <span>Total Amount</span>
                      <span className="text-blue-600">₹{selectedBooking.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security & Verification Tokens */}
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 text-white rounded-lg">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Job Start OTP</div>
                    <div className="text-lg font-extrabold font-mono text-blue-700">
                      {selectedBooking.otp || 'N/A'}
                    </div>
                  </div>
                </div>
                {selectedBooking.happyCode && (
                  <div>
                    <div className="text-xs font-bold text-slate-900">Completion Happy Code</div>
                    <div className="text-lg font-extrabold font-mono text-emerald-600">
                      {selectedBooking.happyCode}
                    </div>
                  </div>
                )}
              </div>

              {/* Dispatches */}
              {selectedBooking.booking_dispatches && selectedBooking.booking_dispatches.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Recent Dispatch Attempts
                  </h4>
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                    {selectedBooking.booking_dispatches.map((d) => (
                      <div key={d.id} className="p-3 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-800">
                            {d.technician_profiles?.fullName || 'Technician'}
                          </span>
                          <span className="text-slate-400 ml-2">({d.distanceKm.toFixed(1)} km away)</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {d.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
                <div className="flex gap-2">
                  {selectedBooking.status !== 'CANCELLED' && selectedBooking.status !== 'COMPLETED' && (
                    <button
                      disabled={actionLoading}
                      onClick={() => setShowCancelModal(true)}
                      className="px-3.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold border border-rose-200 transition-colors cursor-pointer"
                    >
                      Cancel Booking
                    </button>
                  )}
                  {selectedBooking.status !== 'COMPLETED' && selectedBooking.status !== 'CANCELLED' && (
                    <button
                      disabled={actionLoading}
                      onClick={() => handleUpdateStatus(selectedBooking.id, 'COMPLETED')}
                      className="px-3.5 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      Force Complete Order
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setSelectedBooking(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && selectedBooking && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Confirm Booking Cancellation
            </h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to cancel booking <span className="font-mono font-bold">{selectedBooking.bookingNumber}</span>? Please provide a reason for the audit trail.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cancellation Reason
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="E.g., Customer requested cancellation, technician unavailable..."
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Go Back
              </button>
              <button
                disabled={actionLoading || !cancelReason.trim()}
                onClick={() => handleUpdateStatus(selectedBooking.id, 'CANCELLED')}
                className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"
              >
                {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
