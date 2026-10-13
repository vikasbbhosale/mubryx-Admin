"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  ExternalLink, 
  Loader2, 
  RefreshCw, 
  ChevronRight,
  Eye,
  Clock,
  MapPin,
  Phone,
  Wrench,
  Car,
  Check,
  Copy,
  Ban,
  RotateCcw,
  User,
  Shield,
  Layers,
  Activity,
  Maximize2,
  Calendar,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CaseDrawer } from '@/components/ui/CaseDrawer';
import { DestructiveModal } from '@/components/ui/DestructiveModal';

export interface D2cTechnicianItem {
  id: string;
  userId: string;
  fullName: string;
  alternatePhone?: string;
  phone: string;
  operatingCity: string;
  localityArea?: string;
  servicePincode: string;
  experienceYears: string;
  selectedSkills: string[];
  hasOwnVehicle: boolean;
  hasOwnToolkit: boolean;
  onboardingStatus: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  isOnline: boolean;
  currentLatitude?: number | null;
  currentLongitude?: number | null;
  lastActiveAt?: string | null;
  submittedAt?: string | null;
  approvedAt?: string | null;
  approvedByAdminId?: string | null;
  profilePhotoUrl?: string | null;
  aadhaarPhotoUrl?: string | null;
  drivingLicenseUrl?: string | null;
  createdAt: string;
  updatedAt?: string;
  assignedJobsCount?: number;
  assignedJobs?: Array<{
    id: string;
    jobTicketNumber: string;
    brandName: string;
    status: string;
    appointmentDate: string;
    customerName: string;
  }>;
  user?: {
    id: string;
    phone: string;
    name: string | null;
    createdAt: string;
  } | null;
}

interface MetricsData {
  total: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  suspendedCount: number;
  onlineCount: number;
}

function TechAvatar({
  url,
  name,
  size = 'md',
  onClick,
}: {
  url?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}) {
  const [error, setError] = useState(false);
  const sizeClasses =
    size === 'lg'
      ? 'w-14 h-14 text-lg'
      : size === 'sm'
      ? 'w-8 h-8 text-xs'
      : 'w-10 h-10 text-sm';
  const initials = (name || 'T').trim().slice(0, 2).toUpperCase();

  useEffect(() => {
    setError(false);
  }, [url]);

  if (url && !error) {
    return (
      <img
        src={url}
        alt={name}
        className={`${sizeClasses} rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-xs cursor-pointer hover:opacity-90 flex-shrink-0`}
        onError={() => setError(true)}
        onClick={onClick}
      />
    );
  }

  return (
    <div
      onClick={onClick}
      className={`${sizeClasses} rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs cursor-pointer flex-shrink-0 select-none`}
    >
      {initials}
    </div>
  );
}

function DocPreviewCard({
  title,
  icon: Icon,
  url,
  onFullscreen,
}: {
  title: string;
  icon: any;
  url?: string | null;
  onFullscreen: (url: string, title: string) => void;
}) {
  const [loadError, setLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(Boolean(url));

  useEffect(() => {
    setLoadError(false);
    setIsLoading(Boolean(url));
  }, [url]);

  return (
    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-blue-600" />
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">{title}</h4>
        </div>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
            url
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
          }`}
        >
          {url ? 'Submitted' : 'Missing'}
        </span>
      </div>

      {url ? (
        <div className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 aspect-video flex items-center justify-center">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 z-10">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            </div>
          )}

          {loadError ? (
            <div className="flex flex-col items-center justify-center p-4 text-center text-slate-300 text-xs space-y-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>Image preview not direct streamable</span>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 text-[11px] font-bold rounded bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 shadow-xs transition-colors"
              >
                <ExternalLink className="w-3 h-3" /> View in New Tab
              </a>
            </div>
          ) : (
            <>
              <img
                src={url}
                alt={title}
                className="w-full h-full object-contain"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setLoadError(true);
                }}
              />
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => onFullscreen(url, title)}
                  className="px-2.5 py-1.5 rounded-lg bg-white/95 text-slate-900 text-xs font-bold flex items-center gap-1 shadow-lg hover:bg-white transition-colors cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" /> Fullscreen
                </button>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-white/95 text-slate-900 text-xs font-bold flex items-center gap-1 shadow-lg hover:bg-white transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Direct Link
                </a>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="h-32 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 text-xs">
          <AlertTriangle className="w-6 h-6 mb-1 text-amber-500" />
          Document has not been uploaded yet.
        </div>
      )}
    </div>
  );
}

export default function D2cVerificationsPage() {
  const [technicians, setTechnicians] = useState<D2cTechnicianItem[]>([]);
  const [metrics, setMetrics] = useState<MetricsData>({
    total: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    suspendedCount: 0,
    onlineCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED' | 'ALL'>('PENDING');
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [dutyFilter, setDutyFilter] = useState<'ALL' | 'ONLINE' | 'OFFLINE'>('ALL');

  // Drawer / Inspection
  const [selectedTech, setSelectedTech] = useState<D2cTechnicianItem | null>(null);
  const [drawerTab, setDrawerTab] = useState<'DOCUMENTS' | 'CAPABILITY' | 'OPERATIONS'>('DOCUMENTS');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modals
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [approveNotes, setApproveNotes] = useState('');
  const [lightboxUrl, setLightboxUrl] = useState<{ url: string; title: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const selectedTechIdRef = useRef<string | null>(null);
  selectedTechIdRef.current = selectedTech?.id || null;

  const fetchTechnicians = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setRefreshing(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('limit', '100');
      if (selectedCity !== 'ALL') params.set('city', selectedCity);

      const res = await fetch(`/api/d2c/technicians?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load D2C technicians (${res.status})`);
      }
      const json = await res.json();
      const items = json?.items || [];
      setTechnicians(items);

      if (json?.metrics) {
        setMetrics(json.metrics);
      } else {
        // Fallback computation
        setMetrics({
          total: items.length,
          pendingCount: items.filter((t: D2cTechnicianItem) => ['SUBMITTED', 'UNDER_REVIEW'].includes(t.onboardingStatus)).length,
          approvedCount: items.filter((t: D2cTechnicianItem) => t.onboardingStatus === 'APPROVED').length,
          rejectedCount: items.filter((t: D2cTechnicianItem) => t.onboardingStatus === 'REJECTED').length,
          suspendedCount: items.filter((t: D2cTechnicianItem) => t.onboardingStatus === 'SUSPENDED').length,
          onlineCount: items.filter((t: D2cTechnicianItem) => Boolean(t.isOnline)).length,
        });
      }

      // Update currently open drawer item if refreshed without wiping media URLs
      if (selectedTechIdRef.current) {
        const updated = items.find((t: D2cTechnicianItem) => t.id === selectedTechIdRef.current);
        if (updated) {
          setSelectedTech((prev) => prev ? {
            ...prev,
            ...updated,
            profilePhotoUrl: updated.profilePhotoUrl || prev.profilePhotoUrl,
            aadhaarPhotoUrl: updated.aadhaarPhotoUrl || prev.aadhaarPhotoUrl,
            drivingLicenseUrl: updated.drivingLicenseUrl || prev.drivingLicenseUrl,
          } : updated);
        }
      }
    } catch (err: any) {
      console.error('[D2C Verifications] Error fetching queue:', err);
      setError(err?.message || 'Error fetching verification records from backend');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCity]);

  useEffect(() => {
    fetchTechnicians();
  }, [selectedCity, fetchTechnicians]);

  // Fetch single technician details with assigned jobs on selection
  const handleOpenDossier = async (tech: D2cTechnicianItem) => {
    setSelectedTech(tech);
    setDrawerTab('DOCUMENTS');
    setActionSuccess(null);
    try {
      const res = await fetch(`/api/d2c/technicians/${tech.id}`);
      if (res.ok) {
        const json = await res.json();
        if (json?.data && json.data.id) {
          // Merge detailed record with existing row data to ensure complete state
          setSelectedTech((prev) => ({
            ...prev,
            ...json.data,
            fullName: json.data.fullName || prev?.fullName || tech.fullName,
            phone: json.data.phone || prev?.phone || tech.phone,
            profilePhotoUrl: json.data.profilePhotoUrl || prev?.profilePhotoUrl || tech.profilePhotoUrl,
            aadhaarPhotoUrl: json.data.aadhaarPhotoUrl || prev?.aadhaarPhotoUrl || tech.aadhaarPhotoUrl,
            drivingLicenseUrl: json.data.drivingLicenseUrl || prev?.drivingLicenseUrl || tech.drivingLicenseUrl,
          }));
        }
      }
    } catch (err) {
      console.warn('[Dossier] Could not load detailed job history:', err);
    }
  };

  // Status Change API Caller
  const handleUpdateStatus = async (
    status: 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'UNDER_REVIEW',
    remarks?: string
  ) => {
    if (!selectedTech) return;
    setActionLoading(true);
    setActionSuccess(null);
    try {
      const res = await fetch(`/api/d2c/technicians/${selectedTech.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          adminRemarks: remarks || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.message || `Failed to update status to ${status}`);
      }

      setActionSuccess(`Technician status successfully updated to ${status}`);
      // Refresh list
      await fetchTechnicians(true);
      // Close destructive modals if open
      setRejectModalOpen(false);
      setSuspendModalOpen(false);
    } catch (err: any) {
      alert(`Action Failed: ${err?.message || 'Network error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter computation
  const filteredTechnicians = technicians.filter((t) => {
    // 1. Tab filter
    const isPending = ['SUBMITTED', 'UNDER_REVIEW'].includes(t.onboardingStatus);
    const matchesTab =
      tab === 'PENDING' ? isPending :
      tab === 'APPROVED' ? t.onboardingStatus === 'APPROVED' :
      tab === 'SUSPENDED' ? t.onboardingStatus === 'SUSPENDED' :
      tab === 'REJECTED' ? t.onboardingStatus === 'REJECTED' : true;

    // 2. Duty filter
    const matchesDuty =
      dutyFilter === 'ALL' ? true :
      dutyFilter === 'ONLINE' ? t.isOnline :
      !t.isOnline;

    // 3. Search filter
    const s = search.toLowerCase().trim();
    const matchesSearch = !s || (
      (t.fullName && t.fullName.toLowerCase().includes(s)) ||
      (t.phone && t.phone.includes(s)) ||
      (t.alternatePhone && t.alternatePhone.includes(s)) ||
      (t.id && t.id.toLowerCase().includes(s)) ||
      (t.operatingCity && t.operatingCity.toLowerCase().includes(s)) ||
      (t.localityArea && t.localityArea.toLowerCase().includes(s)) ||
      (t.servicePincode && t.servicePincode.includes(s))
    );

    return matchesTab && matchesDuty && matchesSearch;
  });

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-5 pb-16">
      {/* ─── 1. Header & Live Telemetry Bar ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                D2C Field Technician Onboarding & KYC Hub
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  OEM Fleet
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Audit government identities, skills certifications, and grant dispatch authorization across operating cities.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchTechnicians()}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 shadow-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : 'text-slate-400'}`} />
            Refresh Queue
          </button>
        </div>
      </div>

      {/* ─── 2. KPI Metrics Banner ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Workforce</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {metrics.total}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Registered fleet</div>
        </div>

        {/* Pending Approvals */}
        <div 
          onClick={() => setTab('PENDING')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            tab === 'PENDING'
              ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 ring-2 ring-amber-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Pending Review
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-900 dark:text-amber-200 mt-2">
            {metrics.pendingCount}
          </div>
          <div className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">Awaiting KYC audit</div>
        </div>

        {/* Approved Active */}
        <div 
          onClick={() => setTab('APPROVED')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            tab === 'APPROVED'
              ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Authorized & Active</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-900 dark:text-emerald-200 mt-2">
            {metrics.approvedCount}
          </div>
          <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">Ready for dispatches</div>
        </div>

        {/* Suspended */}
        <div 
          onClick={() => setTab('SUSPENDED')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            tab === 'SUSPENDED'
              ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800 ring-2 ring-rose-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">Suspended</span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 flex items-center justify-center">
              <Ban className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-900 dark:text-rose-200 mt-2">
            {metrics.suspendedCount}
          </div>
          <div className="text-[11px] text-rose-700/80 dark:text-rose-400/80 mt-0.5">Compliance hold</div>
        </div>

        {/* Live Online */}
        <div 
          onClick={() => setDutyFilter((prev) => prev === 'ONLINE' ? 'ALL' : 'ONLINE')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            dutyFilter === 'ONLINE'
              ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800 ring-2 ring-blue-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              On-Duty Live
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-900 dark:text-blue-200 mt-2">
            {metrics.onlineCount}
          </div>
          <div className="text-[11px] text-blue-700/80 dark:text-blue-400/80 mt-0.5">Currently online</div>
        </div>
      </div>

      {/* ─── 3. Toolbar & Multi-Filters ───────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
          {[
            { id: 'PENDING', label: 'Pending Review', count: metrics.pendingCount },
            { id: 'APPROVED', label: 'Approved', count: metrics.approvedCount },
            { id: 'SUSPENDED', label: 'Suspended', count: metrics.suspendedCount },
            { id: 'REJECTED', label: 'Rejected', count: metrics.rejectedCount },
            { id: 'ALL', label: 'All Records', count: metrics.total },
          ].map((tabItem) => (
            <button
              key={tabItem.id}
              onClick={() => setTab(tabItem.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                tab === tabItem.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tabItem.label}
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                tab === tabItem.id
                  ? 'bg-slate-700 text-slate-200 dark:bg-slate-200 dark:text-slate-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}>
                {tabItem.count}
              </span>
            </button>
          ))}
        </div>

        {/* Right Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Operating City Selector */}
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Operating Cities</option>
            <option value="AHMEDABAD">Ahmedabad</option>
            <option value="GANDHINAGAR">Gandhinagar</option>
            <option value="MUMBAI">Mumbai</option>
            <option value="CHENNAI">Chennai</option>
          </select>

          {/* Duty State Filter */}
          <select
            value={dutyFilter}
            onChange={(e) => setDutyFilter(e.target.value as any)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Duty States</option>
            <option value="ONLINE">Online (Ready)</option>
            <option value="OFFLINE">Offline</option>
          </select>

          {/* Search Box */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, city..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* ─── 4. Technician Queue Table ────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
            <p className="text-xs font-medium">Loading D2C technician fleet from authoritative registry...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-rose-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
            <p className="text-sm font-semibold">{error}</p>
            <button
              onClick={() => fetchTechnicians()}
              className="mt-3 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-200"
            >
              Retry Connection
            </button>
          </div>
        ) : filteredTechnicians.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No technician records found</h3>
            <p className="text-xs text-slate-500 mt-1">Try adjusting the filter criteria or search keyword.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider select-none">
                <tr>
                  <th className="py-3 px-4">Technician Details</th>
                  <th className="py-3 px-4">Operating Territory</th>
                  <th className="py-3 px-4">KYC Documents</th>
                  <th className="py-3 px-4">Status & Presence</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredTechnicians.map((tech) => {
                  const hasPhoto = Boolean(tech.profilePhotoUrl);
                  const hasAadhaar = Boolean(tech.aadhaarPhotoUrl);
                  const hasDl = Boolean(tech.drivingLicenseUrl);
                  const allDocsPresent = hasPhoto && hasAadhaar && hasDl;

                  return (
                    <tr 
                      key={tech.id} 
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => handleOpenDossier(tech)}
                    >
                      {/* Column 1: Technician Details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {/* Avatar with live status dot */}
                          <div className="relative flex-shrink-0">
                            <TechAvatar
                              url={tech.profilePhotoUrl}
                              name={tech.fullName}
                              size="md"
                            />
                            <span 
                              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                                tech.isOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                              }`} 
                              title={tech.isOnline ? 'Online on duty' : 'Offline'}
                            />
                          </div>

                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                              {tech.fullName || 'Unnamed Technician'}
                              {tech.onboardingStatus === 'APPROVED' && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {tech.phone || tech.user?.phone || 'No Phone'}
                              </span>
                              {tech.alternatePhone && (
                                <span className="text-[10px] text-slate-400">
                                  Alt: {tech.alternatePhone}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5 flex items-center gap-1">
                              ID: {tech.id.slice(0, 12)}...
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(tech.id, tech.id);
                                }}
                                className="hover:text-blue-600 transition-colors"
                              >
                                {copiedId === tech.id ? (
                                  <Check className="w-2.5 h-2.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-2.5 h-2.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Operating Territory */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 w-fit">
                            <MapPin className="w-3 h-3" />
                            {tech.operatingCity}
                          </span>
                          <span className="text-xs text-slate-700 dark:text-slate-300">
                            {tech.localityArea || 'Pincode Area'} ({tech.servicePincode})
                          </span>
                          {tech.currentLatitude && tech.currentLongitude && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                              GPS: {tech.currentLatitude.toFixed(3)}, {tech.currentLongitude.toFixed(3)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 4: KYC Documents */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              hasPhoto 
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            }`}>
                              Photo {hasPhoto ? '✓' : '✗'}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              hasAadhaar 
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            }`}>
                              Aadhaar {hasAadhaar ? '✓' : '✗'}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              hasDl 
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            }`}>
                              License {hasDl ? '✓' : '✗'}
                            </span>
                          </div>
                          
                          <span className={`text-[10px] font-medium ${allDocsPresent ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {allDocsPresent ? 'All 3 documents submitted' : 'Pending document uploads'}
                          </span>
                        </div>
                      </td>

                      {/* Column 5: Status & Presence */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          <StatusBadge status={tech.onboardingStatus} size="sm" />
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                            <span className={`w-1.5 h-1.5 rounded-full ${tech.isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {tech.isOnline ? 'Online (Accepting jobs)' : 'Offline'}
                          </div>
                        </div>
                      </td>

                      {/* Column 6: Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenDossier(tech)}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-1 shadow-xs"
                          >
                            <Eye className="w-3 h-3 text-slate-400" />
                            Audit
                          </button>

                          {['SUBMITTED', 'UNDER_REVIEW', 'DRAFT'].includes(tech.onboardingStatus) && (
                            <button
                              onClick={() => {
                                setSelectedTech(tech);
                                handleUpdateStatus('APPROVED');
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors inline-flex items-center gap-1 shadow-xs"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Approve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── 5. Deep-Audit Dossier Drawer (CaseDrawer) ────────────────────── */}
      <CaseDrawer
        isOpen={Boolean(selectedTech)}
        onClose={() => setSelectedTech(null)}
        title={selectedTech?.fullName || 'Technician Dossier'}
        subtitle={`ID: ${selectedTech?.id || ''} • Registered ${selectedTech?.createdAt ? new Date(selectedTech.createdAt).toLocaleDateString() : ''}`}
        status={selectedTech?.onboardingStatus}
        width="xl"
        actions={
          <div className="flex items-center gap-2">
            {selectedTech?.onboardingStatus !== 'APPROVED' ? (
              <button
                disabled={actionLoading}
                onClick={() => handleUpdateStatus('APPROVED', approveNotes)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Authorize & Approve
              </button>
            ) : null}

            {selectedTech?.onboardingStatus !== 'SUSPENDED' && (
              <button
                disabled={actionLoading}
                onClick={() => setSuspendModalOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <Ban className="w-3.5 h-3.5 text-rose-600" />
                Suspend
              </button>
            )}

            {selectedTech?.onboardingStatus !== 'REJECTED' && (
              <button
                disabled={actionLoading}
                onClick={() => setRejectModalOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5 text-slate-500" />
                Reject
              </button>
            )}
          </div>
        }
      >
        {selectedTech && (
          <div className="space-y-6">
            {/* Action Feedback Banner */}
            {actionSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {actionSuccess}
              </div>
            )}

            {/* Quick Profile Summary Card */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <TechAvatar
                  url={selectedTech.profilePhotoUrl}
                  name={selectedTech.fullName}
                  size="lg"
                  onClick={() => {
                    if (selectedTech.profilePhotoUrl) {
                      setLightboxUrl({
                        url: selectedTech.profilePhotoUrl,
                        title: `${selectedTech.fullName} - Profile Photo`,
                      });
                    }
                  }}
                />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {selectedTech.fullName}
                    <StatusBadge status={selectedTech.onboardingStatus} size="sm" />
                  </h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {selectedTech.phone}
                    </span>
                    {selectedTech.alternatePhone && (
                      <span>Alt: {selectedTech.alternatePhone}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {selectedTech.operatingCity} ({selectedTech.servicePincode})
                    </span>
                  </div>
                </div>
              </div>

              {/* Duty Toggle Live Indicator */}
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${selectedTech.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {selectedTech.isOnline ? 'LIVE ON DUTY' : 'OFF DUTY'}
                  </span>
                </div>
                {selectedTech.lastActiveAt && (
                  <span className="text-[10px] text-slate-400">
                    Last active: {new Date(selectedTech.lastActiveAt).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Dossier Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
              {[
                { id: 'DOCUMENTS', label: 'Government Documents & KYC' },
                { id: 'CAPABILITY', label: 'Territory, Skills & Gear' },
                { id: 'OPERATIONS', label: 'Telemetry & Job History' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setDrawerTab(t.id as any)}
                  className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors ${
                    drawerTab === t.id
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Documents & KYC Inspection */}
            {drawerTab === 'DOCUMENTS' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DocPreviewCard
                    title="Aadhaar Identity Card"
                    icon={FileText}
                    url={selectedTech.aadhaarPhotoUrl}
                    onFullscreen={(url, title) => setLightboxUrl({ url, title })}
                  />
                  <DocPreviewCard
                    title="Driving License / Vehicle Proof"
                    icon={Car}
                    url={selectedTech.drivingLicenseUrl}
                    onFullscreen={(url, title) => setLightboxUrl({ url, title })}
                  />
                </div>

                {/* Audit Checklist Guide for Admin */}
                <div className="bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800 text-xs space-y-2">
                  <h5 className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-blue-600" />
                    Government Verification Protocol:
                  </h5>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-300">
                    <li>Confirm full legal name on Aadhaar matches {selectedTech.fullName}.</li>
                    <li>Ensure photo on ID is clear, unmanipulated, and matches the live selfie.</li>
                    <li>Verify address falls within authorized territory: {selectedTech.operatingCity}.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Tab 2: Territory, Skills & Gear */}
            {drawerTab === 'CAPABILITY' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Territory Details */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      Authorized Operating Zone
                    </h4>
                    <div className="text-xs space-y-1.5">
                      <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-slate-500">Operating City:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{selectedTech.operatingCity}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-slate-500">Locality / Area:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{selectedTech.localityArea || 'Central Zone'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-slate-500">Service Pincode:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{selectedTech.servicePincode}</span>
                      </div>
                      {selectedTech.currentLatitude && selectedTech.currentLongitude && (
                        <div className="flex justify-between py-1 items-center">
                          <span className="text-slate-500">Live GPS Coordinates:</span>
                          <a
                            href={`https://www.google.com/maps?q=${selectedTech.currentLatitude},${selectedTech.currentLongitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                          >
                            {selectedTech.currentLatitude.toFixed(4)}, {selectedTech.currentLongitude.toFixed(4)}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Skills & Experience */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Wrench className="w-4 h-4 text-emerald-600" />
                      Technical Experience & Skills
                    </h4>
                    <div className="text-xs space-y-1.5">
                      <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-slate-500">Field Experience:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{selectedTech.experienceYears}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-slate-500">Personal Vehicle:</span>
                        <span className={`font-bold ${selectedTech.hasOwnVehicle ? 'text-emerald-600' : 'text-slate-500'}`}>
                          {selectedTech.hasOwnVehicle ? 'Yes (Has Vehicle)' : 'No Personal Vehicle'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Professional Toolkit:</span>
                        <span className={`font-bold ${selectedTech.hasOwnToolkit ? 'text-emerald-600' : 'text-slate-500'}`}>
                          {selectedTech.hasOwnToolkit ? 'Yes (Toolkit Ready)' : 'No Toolkit'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">Certified Skills:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedTech.selectedSkills && selectedTech.selectedSkills.length > 0 ? (
                          selectedTech.selectedSkills.map((s, idx) => (
                            <span 
                              key={idx}
                              className="text-xs px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200 shadow-2xs"
                            >
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">None selected</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Operations & History */}
            {drawerTab === 'OPERATIONS' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] text-slate-500 block">Total Assigned Jobs</span>
                    <span className="text-lg font-bold text-slate-900 dark:text-white mt-1 block">
                      {selectedTech.assignedJobsCount || selectedTech.assignedJobs?.length || 0}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] text-slate-500 block">Current Status</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white mt-1.5 block">
                      <StatusBadge status={selectedTech.onboardingStatus} size="sm" />
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] text-slate-500 block">Approved At</span>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-1 block">
                      {selectedTech.approvedAt ? new Date(selectedTech.approvedAt).toLocaleDateString() : 'Not Approved'}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] text-slate-500 block">Approved By Admin</span>
                    <span className="text-xs font-mono text-slate-700 dark:text-slate-300 mt-1 block truncate">
                      {selectedTech.approvedByAdminId || '—'}
                    </span>
                  </div>
                </div>

                {/* Assigned Jobs Table */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Recent Service Dispatches</h4>
                    <span className="text-[11px] text-slate-500">Showing last 10 assignments</span>
                  </div>
                  {selectedTech.assignedJobs && selectedTech.assignedJobs.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/40 text-[10px] text-slate-500 uppercase">
                          <tr>
                            <th className="py-2 px-3">Ticket #</th>
                            <th className="py-2 px-3">Brand</th>
                            <th className="py-2 px-3">Customer</th>
                            <th className="py-2 px-3">Appointment</th>
                            <th className="py-2 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {selectedTech.assignedJobs.map((job) => (
                            <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="py-2 px-3 font-mono font-bold text-blue-600">{job.jobTicketNumber}</td>
                              <td className="py-2 px-3 font-semibold">{job.brandName}</td>
                              <td className="py-2 px-3">{job.customerName}</td>
                              <td className="py-2 px-3">{new Date(job.appointmentDate).toLocaleDateString()}</td>
                              <td className="py-2 px-3"><StatusBadge status={job.status} size="sm" /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No service dispatches have been assigned to this technician yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CaseDrawer>

      {/* ─── 6. High-Res Image Lightbox Modal ─────────────────────────────── */}
      {lightboxUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <div 
            className="relative bg-slate-900 rounded-2xl max-w-4xl max-h-[90vh] overflow-hidden border border-slate-700 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3.5 border-b border-slate-800 bg-slate-900 text-white">
              <span className="text-xs font-bold tracking-wide">{lightboxUrl.title}</span>
              <button 
                onClick={() => setLightboxUrl(null)}
                className="w-7 h-7 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-black/50 overflow-auto max-h-[calc(90vh-60px)]">
              <img
                src={lightboxUrl.url}
                alt={lightboxUrl.title}
                className="max-h-[75vh] w-auto object-contain rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── 7. Rejection Reason Modal (DestructiveModal) ──────────────────── */}
      <DestructiveModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject D2C Technician Onboarding"
        description={`Are you sure you want to reject the application for ${selectedTech?.fullName}? The technician will be notified to review and re-submit corrected KYC documents.`}
        confirmText="Confirm Rejection"
        reasonPlaceholder="Specify reason (e.g. Blurry Aadhaar card, invalid license, out-of-boundary city)..."
        requireReason={true}
        isLoading={actionLoading}
        onConfirm={(reason) => handleUpdateStatus('REJECTED', reason)}
        consequences={[
          'Technician will be blocked from receiving service jobs until re-submission.',
          'Rejection remarks will be logged permanently in the compliance audit trail.',
        ]}
      />

      {/* ─── 8. Account Suspension Modal (DestructiveModal) ────────────────── */}
      <DestructiveModal
        isOpen={suspendModalOpen}
        onClose={() => setSuspendModalOpen(false)}
        title="Suspend D2C Technician Access"
        description={`Suspend ${selectedTech?.fullName}'s field access immediately. This will force the technician offline and block all active job dispatches.`}
        confirmText="Suspend Technician"
        confirmKeyword="SUSPEND"
        reasonPlaceholder="Mandatory reason for suspension (compliance violation, fraud, customer dispute)..."
        requireReason={true}
        isLoading={actionLoading}
        onConfirm={(reason) => handleUpdateStatus('SUSPENDED', reason)}
        consequences={[
          'Technician will be forced OFFLINE immediately.',
          'Technician cannot log in to accept new service jobs.',
          'Pending job dispatches may need to be reassigned to other fleet engineers.',
        ]}
      />
    </div>
  );
}
