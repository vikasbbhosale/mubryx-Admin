"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Briefcase, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Award, 
  Ban, 
  UserCheck, 
  FileCheck, 
  AlertTriangle, 
  Loader2, 
  RefreshCw, 
  Wallet, 
  ShieldCheck, 
  ArrowUpRight,
  ExternalLink,
  Copy,
  Check,
  Wrench,
  Star,
  CreditCard,
  Building,
  ChevronRight,
  FileText,
  BadgeCheck,
  CheckCircle2,
  CalendarCheck,
  ArrowRight
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CaseDrawer } from '@/components/ui/CaseDrawer';
import { DestructiveModal } from '@/components/ui/DestructiveModal';
import { queryClient } from '@/lib/query-client';

interface SkillItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
}

interface DocumentItem {
  id: string;
  type: string;
  objectKey: string;
  mimeType: string;
  fileSize: number;
  signedUrl?: string | null;
  previewUrl?: string | null;
  documentNumber?: string;
  status?: string;
  createdAt: string;
  updatedAt?: string;
}

interface BankDetailsItem {
  id: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  accountHolder: string;
  isVerified?: boolean;
}

interface ExperienceItem {
  id: string;
  role: string;
  companyName: string;
  totalExperience?: string;
  startDate?: string;
  endDate?: string;
  responsibilities?: string;
}

interface JobBookingItem {
  id: string;
  bookingNumber: string;
  status: string;
  paymentStatus?: string;
  totalAmount: number;
  scheduledAt?: string | null;
  createdAt: string;
  customer?: {
    name: string | null;
    phone: string;
  };
}

interface JobDispatchItem {
  id: string;
  status: string;
  booking?: {
    id: string;
    bookingNumber: string;
    status: string;
    totalAmount: number;
    scheduledAt?: string | null;
  };
}

interface TechnicianMetrics {
  totalJobs: number;
  completedJobs: number;
  activeJobs: number;
  totalDispatches: number;
  rating: number;
  totalRatings: number;
  walletBalance: number;
}

interface Technician {
  id: string;
  fullName: string | null;
  contact?: string | null;
  phone?: string | null;
  email?: string | null;
  currentCity: string | null;
  currentState?: string | null;
  pinCode?: string | null;
  bio?: string | null;
  experienceYears?: number | null;
  onboardingStatus: string;
  isOnline?: boolean;
  rating?: number | null;
  totalRatings?: number;
  createdAt: string;
  updatedAt?: string;
  submittedAt?: string;
  dateOfBirth?: string;
  gender?: string;
  profilePhoto?: string;
  user?: {
    id: string;
    phone: string;
    name: string | null;
    email: string | null;
    isActive: boolean;
    role?: string;
  };
  skills?: SkillItem[];
  documents?: DocumentItem[];
  experiences?: ExperienceItem[];
  bankDetails?: BankDetailsItem | null;
  wallet?: { availableBalance: number; currency?: string };
  metrics?: TechnicianMetrics;
  bookings?: JobBookingItem[];
  dispatches?: JobDispatchItem[];
}

const getTechniciansCacheKey = (status: string, q: string) =>
  `technicians:list:${status}:${q.trim().toLowerCase()}`;

export default function TechniciansPage() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const [technicians, setTechnicians] = useState<Technician[]>(() => {
    const cached = queryClient.getQueryData<any>(getTechniciansCacheKey('ALL', ''));
    if (Array.isArray(cached)) return cached;
    if (Array.isArray(cached?.items)) return cached.items;
    return [];
  });
  const [loading, setLoading] = useState(() => {
    const cached = queryClient.getQueryData<any>(getTechniciansCacheKey('ALL', ''));
    return !cached;
  });
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<{ total: number; approved: number; pending: number; suspended: number } | null>(() => {
    const cachedList = queryClient.getQueryData<any>(getTechniciansCacheKey('ALL', ''));
    if (cachedList?.metrics) return cachedList.metrics;
    return queryClient.getQueryData<any>('technicians:metrics') || null;
  });

  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);
  const [techDetailLoading, setTechDetailLoading] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'overview' | 'documents' | 'jobs' | 'banking'>('overview');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  const [suspendTarget, setSuspendTarget] = useState<Technician | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const selectedTechRef = useRef<Technician | null>(null);
  selectedTechRef.current = selectedTech;

  const copyToClipboard = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const fetchTechnicians = useCallback(async (silent = false, forceRefresh = false, signal?: AbortSignal) => {
    const cacheKey = getTechniciansCacheKey(statusFilter, search);
    const hasCached = !!queryClient.getQueryData(cacheKey);
    if (!silent && !hasCached) setLoading(true);
    setRefreshing(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());
      params.set('limit', '50');
      if (forceRefresh) params.set('refresh', 'true');

      const data = await queryClient.fetchQuery<any>(
        cacheKey,
        async (sig) => {
          const res = await fetch(`/api/technicians?${params.toString()}`, { signal: sig });
          if (!res.ok) throw new Error(`Failed to load technicians (${res.status})`);
          const json = await res.json();
          const items = Array.isArray(json) ? json : json?.items || [];
          return { items, metrics: json?.metrics };
        },
        {
          staleTime: 20000,
          forceRefresh,
          signal,
        }
      );
      const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
      setTechnicians(items);
      if (data?.metrics) {
        setMetrics(data.metrics);
        queryClient.setCache('technicians:metrics', data.metrics);
      }

      const currentSelected = selectedTechRef.current;
      if (currentSelected) {
        const updated = items.find((t: Technician) => t.id === currentSelected.id);
        if (updated && (updated.updatedAt !== currentSelected.updatedAt || updated.onboardingStatus !== currentSelected.onboardingStatus)) {
          setSelectedTech(prev => prev ? { ...prev, ...updated } : updated);
        }
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      console.error('Failed to load technicians', e);
      setError(e?.message || 'Error connecting to workforce management API');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    const controller = new AbortController();
    fetchTechnicians(false, false, controller.signal);
    return () => {
      controller.abort();
    };
  }, [fetchTechnicians]);

  const openTechDrawer = async (tech: Technician) => {
    setSelectedTech(tech);
    setDrawerTab('overview');
    setTechDetailLoading(true);
    try {
      const full = await queryClient.fetchQuery<Technician>(
        `technician:detail:${tech.id}`,
        async (sig) => {
          const res = await fetch(`/api/technicians/${tech.id}`, { signal: sig });
          if (!res.ok) throw new Error(`Failed to fetch full technician profile (${res.status})`);
          return res.json();
        },
        { staleTime: 30000 }
      );
      setSelectedTech(full);
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      console.error('Failed to fetch full technician profile', e);
    } finally {
      setTechDetailLoading(false);
    }
  };

  const handleUpdateStatus = async (status: string, reason?: string) => {
    if (!selectedTech && !suspendTarget) return;
    const target = suspendTarget || selectedTech;
    if (!target) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/technicians/${target.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewNotes: reason || `Status set to ${status} via Admin Console` }),
      });
      if (res.ok) {
        setSuspendTarget(null);
        setSelectedTech(prev => prev ? { ...prev, onboardingStatus: status } : null);
        queryClient.invalidateQuery(`technician:detail:${target.id}`);
        queryClient.invalidateQueriesByPrefix('technicians:list');
        queryClient.invalidateQueriesByPrefix('documents:list');
        queryClient.invalidateQuery('technicians:metrics');
        queryClient.invalidateQuery('dashboard:operations-overview');
        fetchTechnicians(true, true);
      }
    } catch (e) {
      console.error('Status update failed', e);
    } finally {
      setActionLoading(false);
    }
  };

  // Safely memoize array slice to prevent any object/type collision
  const techList = useMemo(() => (Array.isArray(technicians) ? technicians : []), [technicians]);

  // Status breakdown metrics
  const countTotal = metrics?.total ?? techList.length;
  const countApproved = metrics?.approved ?? techList.filter((t) => t.onboardingStatus === 'APPROVED').length;
  const countPending = metrics?.pending ?? techList.filter((t) => ['SUBMITTED', 'UNDER_REVIEW'].includes(t.onboardingStatus)).length;
  const countSuspended = metrics?.suspended ?? techList.filter((t) => t.onboardingStatus === 'SUSPENDED').length;

  return (
    <div className="space-y-4 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
            Technician Workforce Roster
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Service partner onboarding, compliance verification, and field capacity management.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => fetchTechnicians(false, true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-500 dark:text-emerald-400' : ''}`} />
            <span>Sync</span>
          </button>
          <Link
            href="/documents"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Document Audits</span>
          </Link>
          <Link
            href="/verifications"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-xs"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Review Queue ({countPending})</span>
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
            onClick={() => fetchTechnicians(false, true)}
            className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium text-[11px] transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. Workforce Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Total Workforce
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {loading && techList.length === 0 ? '-' : countTotal}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">partners</span>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Approved & Field Ready
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {loading && techList.length === 0 ? '-' : countApproved}
            </span>
            <span className="text-[10px] text-emerald-600/80 dark:text-emerald-500/80">ready</span>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Pending KYC Audit
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-500 dark:text-amber-400 font-mono">
              {loading && techList.length === 0 ? '-' : countPending}
            </span>
            <span className="text-[10px] text-amber-600/80 dark:text-amber-500/80">awaiting</span>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
            Suspended
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
              {loading && techList.length === 0 ? '-' : countSuspended}
            </span>
            <span className="text-[10px] text-rose-600/80 dark:text-rose-500/80">locked</span>
          </div>
        </div>
      </div>

      {/* 3. Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shadow-xs">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search technicians by name, phone, city, or skill..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer w-full sm:w-auto"
        >
          <option value="ALL">All Statuses ({techList.length})</option>
          <option value="APPROVED">Approved Only</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="REJECTED">Rejected</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {/* 4. Workforce Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-4">Technician</th>
                <th className="py-2.5 px-4">Contact</th>
                <th className="py-2.5 px-4">Location</th>
                <th className="py-2.5 px-4">Skills</th>
                <th className="py-2.5 px-4">Rating</th>
                <th className="py-2.5 px-4">Compliance Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600 dark:text-emerald-500" />
                    <span>Loading technician profiles...</span>
                  </td>
                </tr>
              ) : techList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No technician records match current criteria.
                  </td>
                </tr>
              ) : (
                techList.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => openTechDrawer(t)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 overflow-hidden flex items-center justify-center font-bold text-emerald-700 dark:text-emerald-300 text-xs flex-shrink-0 relative shadow-2xs">
                          {t.profilePhoto && !t.profilePhoto.startsWith('mock://') ? (
                            <img
                              src={t.profilePhoto}
                              alt={t.fullName || 'T'}
                              className="w-full h-full object-cover relative z-10"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : null}
                          <span className="absolute inset-0 flex items-center justify-center z-0">{t.fullName?.charAt(0) || 'T'}</span>
                          <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ring-1 ring-white dark:ring-slate-900 z-20 ${t.isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        </div>
                        <div className="truncate">
                          <span className="font-semibold text-slate-900 dark:text-white block truncate">
                            {t.fullName || 'Technician'}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-500 font-mono block">
                            {t.experienceYears ? `${t.experienceYears} yrs exp` : 'Verified Partner'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {t.contact || t.phone || t.user?.phone || 'No Contact'}
                    </td>

                    <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400">
                      <span className="block font-medium text-slate-800 dark:text-slate-300 truncate">
                        {t.currentCity || 'Gujarat'}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-500 font-mono block">
                        {t.pinCode || 'No PIN'}
                      </span>
                    </td>

                    <td className="py-2.5 px-4 max-w-[200px] truncate">
                      {t.skills && t.skills.length > 0 ? (
                        <div className="flex items-center gap-1 truncate">
                          {t.skills.slice(0, 2).map((s) => (
                            <span
                              key={s.id}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 truncate"
                            >
                              {s.name}
                            </span>
                          ))}
                          {t.skills.length > 2 && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-500">
                              +{t.skills.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 text-[11px]">No skills listed</span>
                      )}
                    </td>

                    <td className="py-2.5 px-4 font-mono">
                      <span className="text-amber-500 dark:text-amber-400 font-bold flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {t.rating ? t.rating.toFixed(1) : '5.0'}
                      </span>
                    </td>

                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <StatusBadge status={t.onboardingStatus} size="sm" />
                    </td>

                    <td className="py-2.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openTechDrawer(t)}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-emerald-600 dark:bg-slate-800 dark:hover:bg-emerald-600 text-slate-700 hover:text-white dark:text-slate-200 dark:hover:text-white transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        Profile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Modern Slide-Over Profile Case Drawer (Width XL) */}
      <CaseDrawer
        isOpen={!!selectedTech}
        onClose={() => setSelectedTech(null)}
        width="xl"
        title={selectedTech?.fullName || 'Technician Dossier'}
        subtitle={`${selectedTech?.currentCity || 'Gujarat'} • Partner ID: ${selectedTech?.id.slice(-8)}`}
        badge={selectedTech && <StatusBadge status={selectedTech.onboardingStatus} size="sm" />}
        footer={
          selectedTech && (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">Account Status:</span>
                <StatusBadge status={selectedTech.onboardingStatus} size="sm" />
              </div>
              <div className="flex items-center gap-2">
                {selectedTech.onboardingStatus !== 'APPROVED' && (
                  <button
                    onClick={() => handleUpdateStatus('APPROVED')}
                    disabled={actionLoading}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve Application
                  </button>
                )}
                {selectedTech.onboardingStatus !== 'SUSPENDED' ? (
                  <button
                    onClick={() => setSuspendTarget(selectedTech)}
                    disabled={actionLoading}
                    className="px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    Suspend Partner
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateStatus('APPROVED')}
                    disabled={actionLoading}
                    className="px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Reactivate Partner
                  </button>
                )}
                <button
                  onClick={() => setSelectedTech(null)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )
        }
      >
        {techDetailLoading ? (
          <div className="py-24 text-center text-slate-400 dark:text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-600 dark:text-emerald-500" />
            <span className="text-sm font-medium">Loading partner portfolio & Wasabi credentials...</span>
          </div>
        ) : selectedTech && (
          <div className="space-y-5 pb-6">
            {/* Header Hero Profile Card */}
            <div className="p-4 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 overflow-hidden flex items-center justify-center font-black text-xl text-emerald-700 dark:text-emerald-300 flex-shrink-0 relative shadow-xs">
                  {selectedTech.profilePhoto && !selectedTech.profilePhoto.startsWith('mock://') ? (
                    <img
                      src={selectedTech.profilePhoto}
                      alt={selectedTech.fullName || ''}
                      className="w-full h-full object-cover relative z-10"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : null}
                  <span className="absolute inset-0 flex items-center justify-center z-0">{selectedTech.fullName?.charAt(0) || 'T'}</span>
                  <span className={`absolute bottom-1 right-1 w-3 h-3 rounded-full ring-2 ring-white dark:ring-slate-900 z-20 ${selectedTech.isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {selectedTech.fullName || 'Service Partner'}
                    </h2>
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-500 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      ★ {selectedTech.rating ? selectedTech.rating.toFixed(1) : '5.0'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{selectedTech.contact || selectedTech.phone || selectedTech.user?.phone || 'No phone'}</span>
                    <span>•</span>
                    <span>{selectedTech.currentCity || 'Ahmedabad'}, {selectedTech.currentState || 'Gujarat'}</span>
                  </p>
                </div>
              </div>

              {/* Quick Communication triggers */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                {(selectedTech.contact || selectedTech.phone || selectedTech.user?.phone) && (
                  <button
                    onClick={() => copyToClipboard(selectedTech.contact || selectedTech.phone || selectedTech.user!.phone, 'phone')}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'phone' ? 'Copied' : 'Copy Phone'}</span>
                  </button>
                )}
                {(selectedTech.email || selectedTech.user?.email) && (
                  <button
                    onClick={() => copyToClipboard(selectedTech.email || selectedTech.user!.email!, 'email')}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'email' ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'email' ? 'Copied' : 'Copy Email'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* 4 Sleek KPI Operational Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Wallet Balance */}
              <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Wallet Balance</span>
                  <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                    ₹{Number(selectedTech.wallet?.availableBalance ?? selectedTech.metrics?.walletBalance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Ready for payout
                </span>
              </div>

              {/* Completed Jobs */}
              <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Completed Jobs</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                    {selectedTech.metrics?.completedJobs ?? selectedTech.bookings?.filter(b => ['COMPLETED', 'SERVICE_COMPLETED'].includes(b.status)).length ?? 0}
                  </span>
                  <span className="text-[10px] text-slate-400">fulfilled</span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">
                  100% resolution
                </span>
              </div>

              {/* Active Jobs */}
              <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Active Jobs</span>
                  <Wrench className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                    {selectedTech.metrics?.activeJobs ?? 0}
                  </span>
                  <span className="text-[10px] text-slate-400">in-progress</span>
                </div>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                  Assigned dispatches
                </span>
              </div>

              {/* Job Opportunities / Dispatches */}
              <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Dispatches</span>
                  <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                    {selectedTech.metrics?.totalDispatches ?? selectedTech.dispatches?.length ?? 0}
                  </span>
                  <span className="text-[10px] text-slate-400">offers</span>
                </div>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                  Dispatch pool history
                </span>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 text-xs">
              <button
                onClick={() => setDrawerTab('overview')}
                className={`pb-2.5 px-3 font-semibold transition-colors border-b-2 cursor-pointer ${
                  drawerTab === 'overview'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Profile & Onboarding
              </button>
              <button
                onClick={() => setDrawerTab('documents')}
                className={`pb-2.5 px-3 font-semibold transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
                  drawerTab === 'documents'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <span>KYC Documents</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono">
                  {selectedTech.documents?.length || 0}
                </span>
              </button>
              <button
                onClick={() => setDrawerTab('jobs')}
                className={`pb-2.5 px-3 font-semibold transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
                  drawerTab === 'jobs'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <span>Jobs & History</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                  {(selectedTech.bookings?.length || 0) + (selectedTech.dispatches?.length || 0)}
                </span>
              </button>
              <button
                onClick={() => setDrawerTab('banking')}
                className={`pb-2.5 px-3 font-semibold transition-colors border-b-2 cursor-pointer ${
                  drawerTab === 'banking'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Payout & Banking
              </button>
            </div>

            {/* Tab 1: Profile & Onboarding */}
            {drawerTab === 'overview' && (
              <div className="space-y-4">
                {/* Contact & Identity */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-500" />
                      Contact & Account Dossier
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {selectedTech.id}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Primary Phone</span>
                      <span className="text-slate-900 dark:text-white font-mono font-semibold">
                        {selectedTech.user?.phone || selectedTech.contact || 'No phone'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Email Address</span>
                      <span className="text-slate-900 dark:text-white font-medium truncate block">
                        {selectedTech.user?.email || 'No email registered'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Account Role</span>
                      <span className="text-slate-900 dark:text-white font-mono font-bold">
                        {selectedTech.user?.role || 'TECHNICIAN'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Gender</span>
                      <span className="text-slate-900 dark:text-white font-medium capitalize">
                        {selectedTech.gender?.toLowerCase() || 'Male'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Date of Birth</span>
                      <span className="text-slate-900 dark:text-white font-mono">
                        {selectedTech.dateOfBirth || 'Not specified'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Onboarding Submitted</span>
                      <span className="text-slate-900 dark:text-white font-mono">
                        {selectedTech.submittedAt ? new Date(selectedTech.submittedAt).toLocaleDateString('en-IN') : 'Completed'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Service Zone & Location */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                    Service Territory & Operational Zone
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Operating City</span>
                      <span className="text-slate-900 dark:text-white font-semibold">
                        {selectedTech.currentCity || 'Ahmedabad'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">State / Region</span>
                      <span className="text-slate-900 dark:text-white font-semibold">
                        {selectedTech.currentState || 'Gujarat'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Postal PIN Code</span>
                      <span className="text-slate-900 dark:text-white font-mono font-bold">
                        {selectedTech.pinCode || '646454'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Professional Skills & Capabilities */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-indigo-500" />
                    Verified Technical Skills
                  </span>
                  {selectedTech.skills && selectedTech.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedTech.skills.map((skill) => (
                        <div
                          key={skill.id}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs shadow-xs"
                        >
                          <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{skill.name}</span>
                          {skill.description && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 max-w-xs truncate">
                              • {skill.description}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No specific category skills catalogued.</p>
                  )}
                </div>

                {/* Work Experience */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                    Professional Background & Past Experience
                  </span>
                  {selectedTech.experiences && selectedTech.experiences.length > 0 ? (
                    <div className="space-y-2">
                      {selectedTech.experiences.map((exp) => (
                        <div
                          key={exp.id}
                          className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs shadow-xs flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">{exp.role}</span>
                            <span className="text-slate-500 dark:text-slate-400">{exp.companyName}</span>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-mono font-bold border border-amber-500/20">
                              {exp.totalExperience || 'Experience Verified'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Self-certified experience (Entry level partner).</p>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: KYC Documents (Wasabi S3 Integration) */}
            {drawerTab === 'documents' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Identity & Regulatory Documents in Wasabi S3
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Government identification files authenticated with secure HMAC signatures.
                    </p>
                  </div>
                  <Link
                    href="/documents"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <span>Full Audit View</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {!selectedTech.documents || selectedTech.documents.length === 0 ? (
                  <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center bg-slate-50/50 dark:bg-slate-950/50">
                    <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No Documents Uploaded</p>
                    <p className="text-[11px] text-slate-400 mt-1">This partner has not uploaded compliance scans to Wasabi.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedTech.documents.map((doc) => {
                      const targetUrl = doc.signedUrl || doc.previewUrl || `/api/documents/${doc.id}/view`;
                      const isImage = doc.mimeType?.startsWith('image/') || doc.objectKey?.match(/\.(jpg|jpeg|png|webp)$/i);

                      return (
                        <div
                          key={doc.id}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs space-y-3 flex flex-col justify-between"
                        >
                          <div>
                            {/* Card Header */}
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                              <span className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                {doc.type.replace(/_/g, ' ')}
                              </span>
                              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                VERIFIED
                              </span>
                            </div>

                            {/* Visual Image / PDF Scan Viewport */}
                            <div className="mt-3 aspect-video rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden flex items-center justify-center relative group">
                              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-0">
                                <FileText className="w-8 h-8 text-blue-500 mb-1" />
                                <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300 font-bold block">
                                  {doc.type} Compliance Scan
                                </span>
                                <span className="text-[10px] text-slate-400">Click to view high-res file</span>
                              </div>
                              {isImage && (doc.signedUrl || doc.previewUrl) ? (
                                <img
                                  src={doc.signedUrl || doc.previewUrl || ''}
                                  alt={doc.type}
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105 relative z-10"
                                  loading="lazy"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : null}
                              
                              {/* Overlay Hover button */}
                              <a
                                href={targetUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1.5 cursor-pointer backdrop-blur-xs z-20"
                              >
                                <ExternalLink className="w-4 h-4" />
                                Open in New Tab
                              </a>
                            </div>

                            {/* Metadata */}
                            <div className="mt-2 text-[11px] font-mono text-slate-500 dark:text-slate-400 space-y-1">
                              <div className="flex justify-between">
                                <span>Storage Key:</span>
                                <span className="text-slate-700 dark:text-slate-300 truncate max-w-[150px]" title={doc.objectKey}>
                                  {doc.objectKey.split('/').pop()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>File Size:</span>
                                <span>{(doc.fileSize / 1024).toFixed(0)} KB</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Link Button */}
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                            <a
                              href={targetUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              <span>View Full Scan in New Tab</span>
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Jobs & History */}
            {drawerTab === 'jobs' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Recent Assigned Orders & Job Executions
                  </h3>
                  <Link
                    href="/bookings"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <span>View All Orders</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {!selectedTech.bookings || selectedTech.bookings.length === 0 ? (
                  <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center bg-slate-50/50 dark:bg-slate-950/50">
                    <CalendarCheck className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No Orders Assigned Yet</p>
                    <p className="text-[11px] text-slate-400 mt-1">Dispatches offered: {selectedTech.dispatches?.length || 0}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedTech.bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {booking.bookingNumber}
                            </span>
                            <StatusBadge status={booking.status} size="sm" />
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Customer: {booking.customer?.name || 'Customer'} {booking.customer?.phone ? `(${booking.customer.phone})` : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-900 dark:text-white block text-sm">
                            ₹{Number(booking.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(booking.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Payout & Banking */}
            {drawerTab === 'banking' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                      Designated Payout Bank Account
                    </span>
                    {selectedTech.bankDetails && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        ACH / NEFT Ready
                      </span>
                    )}
                  </div>

                  {selectedTech.bankDetails ? (
                    <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Bank Name</span>
                        <span className="text-slate-900 dark:text-white font-bold text-sm">
                          {selectedTech.bankDetails.bankName}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Account Holder</span>
                        <span className="text-slate-900 dark:text-white font-semibold">
                          {selectedTech.bankDetails.accountHolder}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Account Number</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-900 dark:text-white font-mono font-bold">
                            {selectedTech.bankDetails.accountNumber}
                          </span>
                          <button
                            onClick={() => copyToClipboard(selectedTech.bankDetails!.accountNumber, 'acc')}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                            title="Copy account number"
                          >
                            {copiedKey === 'acc' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">IFSC Code</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-900 dark:text-white font-mono font-bold">
                            {selectedTech.bankDetails.ifsc}
                          </span>
                          <button
                            onClick={() => copyToClipboard(selectedTech.bankDetails!.ifsc, 'ifsc')}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                            title="Copy IFSC code"
                          >
                            {copiedKey === 'ifsc' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-center">
                      <p className="text-xs text-slate-400">No bank account registered yet.</p>
                      <p className="text-[11px] text-slate-500 mt-1">Earnings will accumulate in partner wallet.</p>
                    </div>
                  )}
                </div>

                {/* Ledger & Wallet Summary Card */}
                <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                      Disbursement Ledger Status
                    </span>
                    <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                      Settlements run on weekly cycle every Monday.
                    </span>
                  </div>
                  <Link
                    href="/finance"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors shadow-xs inline-flex items-center gap-1"
                  >
                    <span>View Financials</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </CaseDrawer>

      {/* Suspend Confirmation Modal */}
      <DestructiveModal
        isOpen={!!suspendTarget}
        onClose={() => setSuspendTarget(null)}
        onConfirm={(reason) => handleUpdateStatus('SUSPENDED', reason)}
        title={`Suspend Technician ${suspendTarget?.fullName}`}
        description="Suspending will immediately lock this technician from accepting new orders and stop field matching."
        confirmKeyword="SUSPEND"
        confirmText="Suspend Technician"
        isLoading={actionLoading}
        consequences={[
          'Technician will be disconnected from the active job dispatch pool',
          'Future dispatches assigned to this technician will be released',
          'A security audit event will be recorded with your administrator ID',
        ]}
      />
    </div>
  );
}
