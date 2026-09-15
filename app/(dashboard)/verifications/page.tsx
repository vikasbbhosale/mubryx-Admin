"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  UserCheck, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  ExternalLink, 
  ShieldCheck, 
  Loader2, 
  RefreshCw, 
  ChevronRight,
  Eye,
  FileCheck2,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CaseDrawer } from '@/components/ui/CaseDrawer';
import { DestructiveModal } from '@/components/ui/DestructiveModal';

interface DocumentItem {
  id: string;
  type: string;
  objectKey: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  documentNumber?: string;
  status?: string;
  previewUrl?: string;
}

interface TechnicianReview {
  id: string;
  fullName: string | null;
  contact?: string | null;
  currentCity: string | null;
  experienceYears?: number | null;
  onboardingStatus: string;
  createdAt: string;
  user?: {
    id: string;
    phone: string;
    name: string | null;
  };
  skills?: Array<{ id: string; name: string }>;
  documents?: DocumentItem[];
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    ifsc: string;
    accountHolder: string;
  } | null;
}

export default function VerificationsPage() {
  const [technicians, setTechnicians] = useState<TechnicianReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [selectedTech, setSelectedTech] = useState<TechnicianReview | null>(null);
  const [activeDocUrl, setActiveDocUrl] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  const [rejectTarget, setRejectTarget] = useState<TechnicianReview | null>(null);

  const fetchQueue = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setRefreshing(true);
    try {
      const res = await fetch('/api/technicians?limit=50');
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : data?.items || [];
        setTechnicians(items);
        if (selectedTech) {
          const updated = items.find((t: TechnicianReview) => t.id === selectedTech.id);
          if (updated) setSelectedTech(updated);
        }
      }
    } catch (e) {
      console.error('Failed to load verification queue', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedTech]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const filtered = technicians.filter((t) => {
    const isPending = ['SUBMITTED', 'UNDER_REVIEW'].includes(t.onboardingStatus);
    const matchesTab =
      tab === 'PENDING' ? isPending :
      tab === 'APPROVED' ? t.onboardingStatus === 'APPROVED' :
      tab === 'REJECTED' ? t.onboardingStatus === 'REJECTED' : true;

    const matchesSearch =
      t.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      t.contact?.includes(search) ||
      t.user?.phone?.includes(search) ||
      t.currentCity?.toLowerCase().includes(search.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const handleFetchDocumentUrl = async (techId: string, docId: string) => {
    try {
      const res = await fetch(`/api/technicians/${techId}/documents/${docId}/signed-url`);
      if (res.ok) {
        const data = await res.json();
        if (data?.url) {
          window.open(data.url, '_blank');
        }
      }
    } catch (e) {
      console.error('Failed to fetch document URL', e);
    }
  };

  const handleApprove = async (techId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/technicians/${techId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'APPROVED',
          reviewNotes: reviewNotes || 'KYC documentation and identity verified by Administrator.',
        }),
      });
      if (res.ok) {
        setSelectedTech(null);
        setReviewNotes('');
        fetchQueue();
      }
    } catch (e) {
      console.error('Failed to approve technician', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    if (!rejectTarget) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/technicians/${rejectTarget.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'REJECTED',
          reviewNotes: reason,
        }),
      });
      if (res.ok) {
        setRejectTarget(null);
        if (selectedTech?.id === rejectTarget.id) setSelectedTech(null);
        fetchQueue();
      }
    } catch (e) {
      console.error('Failed to reject technician', e);
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = technicians.filter((t) => ['SUBMITTED', 'UNDER_REVIEW'].includes(t.onboardingStatus)).length;

  return (
    <div className="space-y-4 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-400" />
            Workforce KYC & Compliance Audit Hub
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review government IDs, credentials, and bank records before authorizing field dispatch access.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => fetchQueue()}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
            <span>Sync</span>
          </button>
          <Link
            href="/technicians"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors"
          >
            <span>All Technicians</span>
          </Link>
        </div>
      </div>

      {/* 2. Operational Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                tab === t
                  ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t === 'PENDING' ? `Awaiting Audit (${pendingCount})` : t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidate name, phone, city..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* 3. Verification Queue Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-4">Applicant</th>
                <th className="py-2.5 px-4">Phone / Contact</th>
                <th className="py-2.5 px-4">Location</th>
                <th className="py-2.5 px-4">Documents on File</th>
                <th className="py-2.5 px-4">Banking Info</th>
                <th className="py-2.5 px-4">Current Status</th>
                <th className="py-2.5 px-4 text-right">Audit Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-500" />
                    <span>Loading verification queue...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No applications in the selected review tab.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTech(t)}
                    className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-2.5 px-4 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-[10px]">
                          {t.fullName?.charAt(0) || 'T'}
                        </div>
                        <span className="truncate">{t.fullName || 'Technician'}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-4 font-mono text-slate-300">
                      {t.contact || t.user?.phone || 'No Contact'}
                    </td>

                    <td className="py-2.5 px-4 text-slate-400">
                      {t.currentCity || 'Gujarat'}
                    </td>

                    <td className="py-2.5 px-4 font-mono text-[11px]">
                      {t.documents && t.documents.length > 0 ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <FileCheck2 className="w-3 h-3" />
                          {t.documents.length} document(s)
                        </span>
                      ) : (
                        <span className="text-rose-400 font-semibold">0 documents</span>
                      )}
                    </td>

                    <td className="py-2.5 px-4 text-slate-400">
                      {t.bankDetails?.bankName ? (
                        <span className="truncate block max-w-[120px] text-slate-300 font-mono text-[11px]">
                          {t.bankDetails.bankName}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[11px]">Missing</span>
                      )}
                    </td>

                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <StatusBadge status={t.onboardingStatus} size="sm" />
                    </td>

                    <td className="py-2.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedTech(t)}
                        className="px-3 py-1 text-xs font-bold rounded bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors cursor-pointer shadow-xs"
                      >
                        Audit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Slide-Over KYC Audit Case Drawer */}
      <CaseDrawer
        isOpen={!!selectedTech}
        onClose={() => setSelectedTech(null)}
        title={selectedTech?.fullName || 'Technician Audit'}
        subtitle={`KYC Review Application • ${selectedTech?.currentCity || 'Gujarat'}`}
        badge={selectedTech && <StatusBadge status={selectedTech.onboardingStatus} size="sm" />}
        footer={
          selectedTech && (
            <>
              {selectedTech.onboardingStatus !== 'REJECTED' && (
                <button
                  onClick={() => setRejectTarget(selectedTech)}
                  className="px-3.5 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 rounded-lg transition-colors cursor-pointer"
                >
                  Reject
                </button>
              )}
              {selectedTech.onboardingStatus !== 'APPROVED' && (
                <button
                  onClick={() => handleApprove(selectedTech.id)}
                  disabled={actionLoading}
                  className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Approve Application
                </button>
              )}
            </>
          )
        }
      >
        {selectedTech && (
          <div className="space-y-5">
            {/* Identity Checklist */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Identity & Contact Verification
              </span>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[11px]">Applicant Name</span>
                  <span className="font-semibold text-white">{selectedTech.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Contact Phone</span>
                  <span className="font-mono text-white">{selectedTech.contact || selectedTech.user?.phone}</span>
                </div>
              </div>
            </div>

            {/* Document Inspection Stream */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Submitted Identity Documents ({selectedTech.documents?.length || 0})
              </span>
              <div className="divide-y divide-slate-800/60">
                {!selectedTech.documents || selectedTech.documents.length === 0 ? (
                  <p className="text-rose-400 py-2">
                    No documents uploaded. Application cannot be approved without verified government ID.
                  </p>
                ) : (
                  selectedTech.documents.map((doc) => (
                    <div key={doc.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-white block">{doc.type}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          MIME: {doc.mimeType} • {(doc.fileSize / 1024).toFixed(0)} KB
                        </span>
                      </div>
                      <button
                        onClick={() => handleFetchDocumentUrl(selectedTech.id, doc.id)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 transition-colors text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View File</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Review Notes Input */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Compliance Review Notes
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Enter audit remarks or verification notes (persisted in audit log)..."
                rows={3}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        )}
      </CaseDrawer>

      {/* Reject Modal */}
      <DestructiveModal
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleReject}
        title={`Reject Application: ${rejectTarget?.fullName}`}
        description="Please provide the exact reason for rejection. This reason will be logged in the permanent audit trail."
        confirmText="Reject Application"
        confirmKeyword="REJECT"
        reasonPlaceholder="e.g. Identity document blur / mismatch on Aadhaar card..."
        consequences={[
          'Applicant status will be marked REJECTED',
          'Technician will be blocked from receiving any job dispatches',
          'An audit log will be written recording this decision',
        ]}
      />
    </div>
  );
}
