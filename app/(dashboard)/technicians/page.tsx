"use client";

import { useState, useEffect, useCallback } from 'react';
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
  AlertCircle,
  Loader2,
  RefreshCw,
  Wallet,
  ShieldCheck,
  ArrowUpRight
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CaseDrawer } from '@/components/ui/CaseDrawer';
import { DestructiveModal } from '@/components/ui/DestructiveModal';

interface SkillItem {
  id: string;
  name: string;
  slug: string;
}

interface DocumentItem {
  id: string;
  type: string;
  objectKey: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}

interface BankDetailsItem {
  id: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  accountHolder: string;
  isVerified: boolean;
  upiId?: string | null;
}

interface Technician {
  id: string;
  fullName: string | null;
  contact?: string | null;
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
  user?: {
    id: string;
    phone: string;
    name: string | null;
    email: string | null;
    isActive: boolean;
  };
  skills?: SkillItem[];
  documents?: DocumentItem[];
  bankDetails?: BankDetailsItem | null;
  wallet?: { availableBalance: number };
}

export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);
  const [techDetailLoading, setTechDetailLoading] = useState(false);
  
  const [suspendTarget, setSuspendTarget] = useState<Technician | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTechnicians = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());
      params.set('limit', '50');

      const res = await fetch(`/api/technicians?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : data?.items || [];
        setTechnicians(items);
        if (selectedTech) {
          const updated = items.find((t: Technician) => t.id === selectedTech.id);
          if (updated) setSelectedTech(updated);
        }
      }
    } catch (e) {
      console.error('Failed to load technicians', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, search, selectedTech]);

  useEffect(() => {
    fetchTechnicians();
  }, [fetchTechnicians]);

  const openTechDrawer = async (tech: Technician) => {
    setSelectedTech(tech);
    setTechDetailLoading(true);
    try {
      const res = await fetch(`/api/technicians/${tech.id}`);
      if (res.ok) {
        const full = await res.json();
        setSelectedTech(full);
      }
    } catch (e) {
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
        fetchTechnicians();
      }
    } catch (e) {
      console.error('Status update failed', e);
    } finally {
      setActionLoading(false);
    }
  };

  // Status breakdown metrics
  const countTotal = technicians.length;
  const countApproved = technicians.filter((t) => t.onboardingStatus === 'APPROVED').length;
  const countPending = technicians.filter((t) => ['SUBMITTED', 'UNDER_REVIEW'].includes(t.onboardingStatus)).length;
  const countSuspended = technicians.filter((t) => t.onboardingStatus === 'SUSPENDED').length;

  return (
    <div className="space-y-4 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-500" />
            Technician Workforce Roster
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Service partner onboarding, compliance verification, and field capacity management.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => fetchTechnicians()}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Sync</span>
          </button>
          <Link
            href="/verifications"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Review Queue ({countPending})</span>
          </Link>
        </div>
      </div>

      {/* 2. Workforce Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Workforce
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">{countTotal}</span>
            <span className="text-[10px] text-slate-500">partners</span>
          </div>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Approved & Field Ready
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400 font-mono">{countApproved}</span>
            <span className="text-[10px] text-emerald-500/80">ready</span>
          </div>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Pending KYC Audit
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400 font-mono">{countPending}</span>
            <span className="text-[10px] text-amber-500/80">awaiting</span>
          </div>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Suspended
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-400 font-mono">{countSuspended}</span>
            <span className="text-[10px] text-rose-500/80">locked</span>
          </div>
        </div>
      </div>

      {/* 3. Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-xs">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search technicians by name, phone, city, or skill..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer w-full sm:w-auto"
        >
          <option value="ALL">All Statuses ({technicians.length})</option>
          <option value="APPROVED">Approved Only</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="REJECTED">Rejected</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {/* 4. Workforce Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-4">Technician</th>
                <th className="py-2.5 px-4">Contact</th>
                <th className="py-2.5 px-4">Location</th>
                <th className="py-2.5 px-4">Skills</th>
                <th className="py-2.5 px-4">Rating</th>
                <th className="py-2.5 px-4">Compliance Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-500" />
                    <span>Loading technician profiles...</span>
                  </td>
                </tr>
              ) : technicians.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No technician records match current criteria.
                  </td>
                </tr>
              ) : (
                technicians.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => openTechDrawer(t)}
                    className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-xs flex-shrink-0">
                          {t.fullName?.charAt(0) || 'T'}
                        </div>
                        <div className="truncate">
                          <span className="font-semibold text-white block truncate">
                            {t.fullName || 'Technician'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            {t.experienceYears ? `${t.experienceYears} yrs exp` : 'Entry Level'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-4 font-mono text-slate-300">
                      {t.contact || t.user?.phone || 'No Contact'}
                    </td>

                    <td className="py-2.5 px-4 text-slate-400">
                      <span className="block font-medium text-slate-300 truncate">
                        {t.currentCity || 'Gujarat'}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono block">
                        {t.pinCode || 'No PIN'}
                      </span>
                    </td>

                    <td className="py-2.5 px-4 max-w-[200px] truncate">
                      {t.skills && t.skills.length > 0 ? (
                        <div className="flex items-center gap-1 truncate">
                          {t.skills.slice(0, 2).map((s) => (
                            <span
                              key={s.id}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 truncate"
                            >
                              {s.name}
                            </span>
                          ))}
                          {t.skills.length > 2 && (
                            <span className="text-[10px] text-slate-500">
                              +{t.skills.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-600 text-[11px]">No skills listed</span>
                      )}
                    </td>

                    <td className="py-2.5 px-4 font-mono">
                      <span className="text-amber-400 font-bold">
                        ★ {t.rating ? t.rating.toFixed(1) : '5.0'}
                      </span>
                    </td>

                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <StatusBadge status={t.onboardingStatus} size="sm" />
                    </td>

                    <td className="py-2.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openTechDrawer(t)}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white transition-colors cursor-pointer"
                      >
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

      {/* 5. Slide-Over Profile Case Drawer */}
      <CaseDrawer
        isOpen={!!selectedTech}
        onClose={() => setSelectedTech(null)}
        title={selectedTech?.fullName || 'Technician Profile'}
        subtitle={selectedTech?.currentCity || 'Gujarat Region'}
        badge={selectedTech && <StatusBadge status={selectedTech.onboardingStatus} size="sm" />}
        footer={
          selectedTech && (
            <>
              {selectedTech.onboardingStatus !== 'APPROVED' && (
                <button
                  onClick={() => handleUpdateStatus('APPROVED')}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer"
                >
                  Approve Application
                </button>
              )}
              {selectedTech.onboardingStatus !== 'SUSPENDED' && (
                <button
                  onClick={() => setSuspendTarget(selectedTech)}
                  className="px-3 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 rounded-lg transition-colors cursor-pointer"
                >
                  Suspend Partner
                </button>
              )}
              <button
                onClick={() => setSelectedTech(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </>
          )
        }
      >
        {techDetailLoading ? (
          <div className="py-16 text-center text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
            <span>Loading complete partner portfolio...</span>
          </div>
        ) : selectedTech && (
          <div className="space-y-5">
            {/* Primary Details */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Contact & Identity
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block">Phone</span>
                  <span className="text-white font-mono">{selectedTech.contact || selectedTech.user?.phone || 'No phone'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Email</span>
                  <span className="text-white truncate block">{selectedTech.user?.email || 'No email on file'}</span>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Banking & Payout Account
              </span>
              {selectedTech.bankDetails ? (
                <div className="space-y-1 font-mono text-slate-300">
                  <p>Bank: <span className="text-white font-bold">{selectedTech.bankDetails.bankName}</span></p>
                  <p>Account: <span className="text-white">{selectedTech.bankDetails.accountNumber}</span></p>
                  <p>IFSC: <span className="text-white">{selectedTech.bankDetails.ifsc}</span></p>
                  <p>Holder: <span className="text-white">{selectedTech.bankDetails.accountHolder}</span></p>
                </div>
              ) : (
                <p className="text-slate-500">No bank account registered.</p>
              )}
            </div>

            {/* Documents List */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5 text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                KYC Documents on File
              </span>
              <div className="space-y-1.5">
                {!selectedTech.documents || selectedTech.documents.length === 0 ? (
                  <p className="text-slate-500">No identity documents submitted.</p>
                ) : (
                  selectedTech.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 text-xs"
                    >
                      <span className="font-mono text-slate-200">{doc.type}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {(doc.fileSize / 1024).toFixed(0)} KB
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
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
