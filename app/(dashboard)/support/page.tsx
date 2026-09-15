"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  LifeBuoy, 
  Search, 
  Filter, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  User, 
  Phone, 
  MapPin, 
  Send, 
  ShieldAlert, 
  Receipt, 
  Calendar, 
  Tag, 
  MessageSquare, 
  ArrowRight,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Loader2,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface SupportIncident {
  id: string;
  bookingNumber: string;
  subject: string;
  category: 'SERVICE_QUALITY' | 'TECHNICIAN_NO_SHOW' | 'BILLING_DISPUTE' | 'CANCELLATION' | 'OPERATIONS';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: string;
  createdAt: string;
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  booking: {
    id: string;
    serviceTitle: string;
    amount: number;
    paymentStatus: string;
    scheduledAt: string;
    status: string;
    address: string;
    city: string;
  };
  technician?: {
    name: string;
    phone: string;
    rating: number;
  };
  notes: string[];
}

export default function SupportPage() {
  const [incidents, setIncidents] = useState<SupportIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [noteText, setNoteText] = useState('');

  const fetchIncidentsFromBookings = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch('/api/bookings?limit=50');
      if (res.ok) {
        const raw = await res.json();
        const bookings = Array.isArray(raw) ? raw : raw?.items || [];

        // Map real bookings into operational support incidents
        const mapped: SupportIncident[] = bookings.map((b: any) => {
          const cust = b.customer || b.users;
          const tech = b.technician || b.technician_profiles;
          const rawItems = b.items || b.booking_items || [];
          const mainServiceTitle = rawItems[0]?.serviceTitleSnapshot || rawItems[0]?.service?.title || 'Service Order';

          let category: SupportIncident['category'] = 'OPERATIONS';
          let priority: SupportIncident['priority'] = 'MEDIUM';
          let subject = `Order ${b.bookingNumber}: ${mainServiceTitle}`;

          if (b.status === 'CANCELLED') {
            category = 'CANCELLATION';
            priority = 'HIGH';
            subject = b.cancellationReason ? `Cancellation: ${b.cancellationReason}` : `Customer cancelled order ${b.bookingNumber}`;
          } else if (b.status === 'PENDING_MATCHING') {
            category = 'TECHNICIAN_NO_SHOW';
            priority = 'CRITICAL';
            subject = `Delayed fulfillment: No provider matched for ${mainServiceTitle}`;
          } else if (b.paymentStatus === 'FAILED' || b.paymentStatus === 'PENDING') {
            category = 'BILLING_DISPUTE';
            priority = 'HIGH';
            subject = `Payment settlement issue: ${b.paymentStatus} on ${b.bookingNumber}`;
          }

          const notes: string[] = [];
          if (b.customerNotes) notes.push(`Customer Note: ${b.customerNotes}`);
          if (b.cancellationReason) notes.push(`Cancellation Reason: ${b.cancellationReason}`);
          notes.push(`Order recorded in system on ${new Date(b.createdAt).toLocaleString('en-IN')}`);

          return {
            id: b.id,
            bookingNumber: b.bookingNumber,
            subject,
            category,
            priority,
            status: b.status,
            createdAt: b.createdAt,
            customer: {
              name: cust?.name || 'Customer',
              phone: cust?.phone || 'No phone',
              email: cust?.email || 'N/A',
            },
            booking: {
              id: b.id,
              serviceTitle: mainServiceTitle,
              amount: b.totalAmount ?? 0,
              paymentStatus: b.paymentStatus || 'PENDING',
              scheduledAt: b.scheduledAt ? new Date(b.scheduledAt).toLocaleString('en-IN') : 'Immediate Dispatch',
              status: b.status,
              address: b.snapshotAddress || 'Address on file',
              city: b.snapshotCity || 'Gujarat',
            },
            technician: tech ? {
              name: tech.fullName || 'Assigned Technician',
              phone: tech.contact || tech.user?.phone || 'No direct phone',
              rating: tech.rating ?? 4.8,
            } : undefined,
            notes,
          };
        });

        setIncidents(mapped);
        if (mapped.length > 0 && !selectedIncidentId) {
          setSelectedIncidentId(mapped[0].id);
        }
      } else {
        throw new Error(`Failed to load incident stream (${res.status})`);
      }
    } catch (err: any) {
      console.error('Error fetching support incidents', err);
      setError(err?.message || 'Error connecting to support incidents stream');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedIncidentId]);

  useEffect(() => {
    fetchIncidentsFromBookings();
  }, [fetchIncidentsFromBookings]);

  const selectedIncident = incidents.find(t => t.id === selectedIncidentId) || incidents[0];

  const handleAddSessionNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() || !selectedIncident) return;

    setIncidents(prev => prev.map(item => {
      if (item.id === selectedIncident.id) {
        return {
          ...item,
          notes: [...item.notes, `Admin Note (${new Date().toLocaleTimeString('en-IN')}): ${noteText.trim()}`],
        };
      }
      return item;
    }));

    setNoteText('');
  };

  const filteredIncidents = incidents.filter(t => {
    const matchesCategory = filterCategory === 'ALL' || t.category === filterCategory;
    const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      t.bookingNumber.toLowerCase().includes(searchLower) ||
      t.subject.toLowerCase().includes(searchLower) ||
      t.customer.name.toLowerCase().includes(searchLower) ||
      t.customer.phone.includes(search);

    return matchesCategory && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-3 pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-blue-600 dark:text-blue-500" />
              Customer Experience & Dispute Triage
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Authoritative Live Dispatch Queue
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Live dispute desk linking order exceptions, customer grievances, provider telemetry, and booking remediation.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => fetchIncidentsFromBookings()}
            disabled={refreshing}
            className="p-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg border border-slate-200 dark:border-slate-800 transition-colors shadow-xs cursor-pointer"
            title="Refresh Incident Stream"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-500' : ''}`} />
          </button>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>{incidents.length} Synced Cases</span>
          </div>
        </div>
      </div>

      {/* Operational Disclaimer Banner */}
      <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-xl text-blue-800 dark:text-blue-300 text-xs flex items-start gap-2.5 shadow-xs">
        <Info className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
        <div>
          <strong className="font-semibold">Authoritative Order Exception Stream:</strong> This console synchronizes directly with backend bookings to identify fulfillment delays, cancellation disputes, and payment friction. Dedicated ticketing models are pending backend schema evolution; all investigations are linked to real orders.
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-center justify-between text-xs text-rose-700 dark:text-rose-400">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchIncidentsFromBookings()}
            className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium text-[11px] transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* 3-Column Operations Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-[600px]">
        {/* COLUMN 1: Incident Queue (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-xs">
          {/* Queue Header & Filters */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50 dark:bg-slate-950/40">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search order #, customer, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
              {['ALL', 'CANCELLED', 'PENDING_MATCHING', 'SERVICE_STARTED', 'COMPLETED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2 py-0.5 rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                    filterStatus === st
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {st.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Incident List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 custom-scrollbar max-h-[620px]">
            {loading && incidents.length === 0 ? (
              <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span>Loading incident stream...</span>
              </div>
            ) : filteredIncidents.length === 0 ? (
              <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                No orders match selected incident filter.
              </div>
            ) : (
              filteredIncidents.map((t) => {
                const isSelected = selectedIncident?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedIncidentId(t.id)}
                    className={`w-full text-left p-3 transition-colors cursor-pointer block ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-600/10 border-l-2 border-blue-500'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <span className="font-mono text-[11px] font-bold text-slate-900 dark:text-white">
                        {t.bookingNumber}
                      </span>
                      <StatusBadge status={t.status} size="sm" />
                    </div>

                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {t.subject}
                    </div>

                    <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{t.customer.name}</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">₹{t.booking.amount.toFixed(0)}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMN 2 & 3: Selected Case Details & Timeline (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-xs">
          {selectedIncident ? (
            <div className="p-4 space-y-4 overflow-y-auto max-h-[700px] custom-scrollbar text-xs">
              {/* Incident Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                      Order Case #{selectedIncident.bookingNumber}
                    </span>
                    <StatusBadge status={selectedIncident.status} size="sm" />
                  </div>
                  <h2 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
                    {selectedIncident.subject}
                  </h2>
                </div>

                <Link
                  href="/bookings"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  <span>Open Full Order</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {/* Grid Context: Customer & Technician */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Customer Snapshot */}
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <User className="w-3 h-3 text-blue-500" />
                    <span>Customer Context</span>
                  </div>
                  <div className="text-slate-900 dark:text-white font-bold">{selectedIncident.customer.name}</div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-mono">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <a href={`tel:${selectedIncident.customer.phone}`} className="hover:underline text-blue-600 dark:text-blue-400">
                      {selectedIncident.customer.phone}
                    </a>
                  </div>
                  <div className="flex items-start gap-1.5 text-slate-500 text-[11px] pt-1">
                    <MapPin className="w-3 h-3 shrink-0 mt-0.5 text-slate-400" />
                    <span>{selectedIncident.booking.address} ({selectedIncident.booking.city})</span>
                  </div>
                </div>

                {/* Technician Snapshot */}
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-emerald-500" />
                    <span>Field Workforce Context</span>
                  </div>
                  {selectedIncident.technician ? (
                    <>
                      <div className="text-slate-900 dark:text-white font-bold">{selectedIncident.technician.name}</div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <a href={`tel:${selectedIncident.technician.phone}`} className="hover:underline text-blue-600 dark:text-blue-400">
                          {selectedIncident.technician.phone}
                        </a>
                      </div>
                      <div className="text-[11px] text-amber-500 dark:text-amber-400 font-mono font-bold pt-1">
                        ★ Partner Rating: {selectedIncident.technician.rating}
                      </div>
                    </>
                  ) : (
                    <div className="text-amber-700 dark:text-amber-400 text-xs py-2">
                      No service partner locked to this order dispatch yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Snapshot */}
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between font-mono">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 block font-sans">Payment Status</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{selectedIncident.booking.paymentStatus}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 block font-sans">Scheduled Slot</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{selectedIncident.booking.scheduledAt}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase text-slate-500 block font-sans">Total Order Value</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">₹{selectedIncident.booking.amount.toFixed(0)}</span>
                </div>
              </div>

              {/* Case Investigation Log & Audit Notes */}
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Case Resolution Notes & Timeline</span>
                </h3>

                <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-950/60 max-h-52 overflow-y-auto custom-scrollbar">
                  {selectedIncident.notes.map((note, idx) => (
                    <div key={idx} className="text-xs text-slate-700 dark:text-slate-300 border-l-2 border-blue-500 pl-2.5 py-0.5">
                      {note}
                    </div>
                  ))}
                </div>

                {/* Add Session Note Form */}
                <form onSubmit={handleAddSessionNote} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add operational investigation note for this case..."
                    className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!noteText.trim()}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    <Send className="w-3 h-3" />
                    <span>Post Note</span>
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-slate-400 dark:text-slate-500">
              Select an incident from the queue to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
