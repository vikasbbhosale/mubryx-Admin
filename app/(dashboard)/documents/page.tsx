"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter, 
  ExternalLink, 
  Eye, 
  Clock, 
  AlertTriangle,
  Loader2,
  ShieldCheck,
  User,
  Phone,
  RefreshCw,
  FileCheck,
  CreditCard,
  Car,
  Image as ImageIcon,
  MapPin,
  Calendar
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CaseDrawer } from '@/components/ui/CaseDrawer';
import { queryClient } from '@/lib/query-client';

interface DocumentRowItem {
  id: string;
  type: string;
  documentNumber: string | null;
  objectKey: string;
  fileSize: number;
  mimeType: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rejectionReason: string | null;
  signedUrl?: string | null;
  previewUrl?: string | null;
  createdAt: string;
  updatedAt?: string;
  technician: {
    id: string;
    fullName: string;
    phone: string;
    city?: string;
    state?: string | null;
    onboardingStatus?: string;
  };
}

interface DocumentMetrics {
  total: number;
  aadhaar: number;
  pan: number;
  drivingLicense: number;
  passport: number;
  voterId: number;
  pending: number;
  verified: number;
}

const getDocumentsCacheKey = (type: string, status: string, q: string) =>
  `documents:list:${type}:${status}:${q.trim().toLowerCase()}`;

export default function DocumentsPage() {
  const [docTypeFilter, setDocTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const [documents, setDocuments] = useState<DocumentRowItem[]>(() => {
    const cached = queryClient.getQueryData<any>(getDocumentsCacheKey('ALL', 'ALL', ''));
    if (Array.isArray(cached)) return cached;
    if (Array.isArray(cached?.items)) return cached.items;
    return [];
  });
  const [loading, setLoading] = useState(() => !queryClient.getQueryData(getDocumentsCacheKey('ALL', 'ALL', '')));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DocumentMetrics | null>(() => {
    const cached = queryClient.getQueryData<any>(getDocumentsCacheKey('ALL', 'ALL', ''));
    return cached?.metrics || null;
  });

  const [activeDoc, setActiveDoc] = useState<DocumentRowItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  const activeDocRef = useRef<DocumentRowItem | null>(null);
  activeDocRef.current = activeDoc;

  const fetchDocuments = useCallback(async (silent = false, forceRefresh = false, signal?: AbortSignal) => {
    const cacheKey = getDocumentsCacheKey(docTypeFilter, statusFilter, search);
    const hasCached = !!queryClient.getQueryData(cacheKey);
    if (!silent && !hasCached) setLoading(true);
    setRefreshing(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (docTypeFilter !== 'ALL') params.set('type', docTypeFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());
      params.set('limit', '50');
      if (forceRefresh) params.set('refresh', 'true');

      const data = await queryClient.fetchQuery<any>(
        cacheKey,
        async (sig) => {
          const res = await fetch(`/api/documents?${params.toString()}`, { signal: sig });
          if (!res.ok) throw new Error(`Failed to load technician documents (${res.status})`);
          return res.json();
        },
        {
          staleTime: 20000,
          forceRefresh,
          signal,
        }
      );

      const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
      setDocuments(items);
      if (data?.metrics) {
        setMetrics(data.metrics);
      }

      // If active doc is currently open in drawer, update its snapshot
      const currentActive = activeDocRef.current;
      if (currentActive) {
        const updated = items.find((d: DocumentRowItem) => d.id === currentActive.id);
        if (updated) {
          setActiveDoc(updated);
          if (updated.signedUrl) setSignedUrl(updated.signedUrl);
        }
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.error('Failed to fetch documents', err);
      setError(err?.message || 'Failed to connect to document repository service');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [docTypeFilter, statusFilter, search]);

  useEffect(() => {
    const controller = new AbortController();
    fetchDocuments(false, false, controller.signal);
    return () => {
      controller.abort();
    };
  }, [fetchDocuments]);

  // Handle active document selection and signed URL resolution
  useEffect(() => {
    if (!activeDoc) {
      setSignedUrl(null);
      setRejectionReason('');
      return;
    }

    if (activeDoc.signedUrl) {
      setSignedUrl(activeDoc.signedUrl);
      return;
    }

    if (activeDoc.previewUrl) {
      setSignedUrl(activeDoc.previewUrl);
      return;
    }

    // Fallback: fetch fresh signed URL from endpoint
    fetch(`/api/documents/${activeDoc.id}/signed-url`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.url) setSignedUrl(data.url);
      })
      .catch(() => setSignedUrl(null));
  }, [activeDoc]);

  const handleDocumentAction = async (newStatus: 'VERIFIED' | 'REJECTED') => {
    if (!activeDoc) return;
    try {
      setProcessing(true);
      const res = await fetch(`/api/technicians/${activeDoc.technician.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus === 'VERIFIED' ? 'APPROVED' : 'REJECTED',
          reason: newStatus === 'REJECTED' ? (rejectionReason || 'Document unreadable or invalid') : undefined 
        })
      });

      if (res.ok) {
        // Optimistic update
        setDocuments(prev => prev.map(d => d.id === activeDoc.id ? { 
          ...d, 
          status: newStatus, 
          rejectionReason: newStatus === 'REJECTED' ? rejectionReason : null 
        } : d));
        
        queryClient.invalidateQueriesByPrefix('documents:list');
        queryClient.invalidateQueriesByPrefix('technicians:list');
        queryClient.invalidateQuery('dashboard:operations-overview');
        fetchDocuments(true, true);
        setActiveDoc(null);
      }
    } catch (error) {
      console.error('Failed to update document status', error);
    } finally {
      setProcessing(false);
    }
  };

  // Safe memoized list
  const docList = useMemo(() => (Array.isArray(documents) ? documents : []), [documents]);

  const countTotal = metrics?.total ?? docList.length;
  const countPending = metrics?.pending ?? docList.filter(d => d.status === 'PENDING').length;
  const countVerified = metrics?.verified ?? docList.filter(d => d.status === 'VERIFIED').length;
  const countAadhaar = metrics?.aadhaar ?? docList.filter(d => d.type === 'AADHAAR').length;
  const countPan = metrics?.pan ?? docList.filter(d => d.type === 'PAN').length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'AADHAAR':
        return <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'PAN':
        return <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'DRIVING_LICENSE':
        return <Car className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-blue-600 dark:text-blue-500" />
              KYC & Document Repository
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {countTotal} Records
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Centralized evidentiary repository for technician government IDs, PAN cards, and licenses in Wasabi S3.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-mono font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>{countPending} Pending</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{countVerified} Verified</span>
          </div>
          <button
            onClick={() => fetchDocuments(false, true)}
            disabled={refreshing}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors shadow-xs cursor-pointer"
            title="Sync repository with Wasabi"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Document Metrics Ticker */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Total In Wasabi
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {loading && docList.length === 0 ? '-' : countTotal}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">files</span>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            Aadhaar Cards
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {loading && docList.length === 0 ? '-' : countAadhaar}
            </span>
            <span className="text-[10px] text-emerald-600/80 dark:text-emerald-500/80">on file</span>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
            PAN Cards
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
              {loading && docList.length === 0 ? '-' : countPan}
            </span>
            <span className="text-[10px] text-blue-600/80 dark:text-blue-500/80">audited</span>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <span className="text-[11px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-wider block">
            Pending Audit
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-500 dark:text-amber-400 font-mono">
              {loading && docList.length === 0 ? '-' : countPending}
            </span>
            <span className="text-[10px] text-amber-600/80 dark:text-amber-500/80">awaiting</span>
          </div>
        </div>
      </div>

      {/* 3. Error state if failed */}
      {error && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-center justify-between text-xs text-rose-700 dark:text-rose-400">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchDocuments(false, true)}
            className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium text-[11px] transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 4. Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search technician name, phone, document number, or storage key..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md pl-9 pr-4 py-1.5 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-2 py-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Type:</span>
            <select
              value={docTypeFilter}
              onChange={(e) => setDocTypeFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Documents</option>
              <option value="AADHAAR">Aadhaar Card</option>
              <option value="PAN">PAN Card</option>
              <option value="DRIVING_LICENSE">Driving License</option>
              <option value="PASSPORT">Passport</option>
              <option value="VOTER_ID">Voter ID</option>
              <option value="OTHER">Other Documents</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-2 py-1">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">Verified Only</option>
              <option value="SUBMITTED">Pending Review</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5. Documents Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        {loading && docList.length === 0 ? (
          <div className="p-16 flex items-center justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
          </div>
        ) : docList.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-2 opacity-50" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Documents Found</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try adjusting your document type, status, or search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-4">Preview</th>
                  <th className="py-2.5 px-4">Document Type</th>
                  <th className="py-2.5 px-4">Technician</th>
                  <th className="py-2.5 px-4">Identifier / Key</th>
                  <th className="py-2.5 px-4">File Info</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300 font-mono">
                {docList.map((item) => {
                  const targetUrl = item.signedUrl || item.previewUrl || `/api/documents/${item.id}/view`;
                  const isImage = item.mimeType?.startsWith('image/') || item.objectKey?.match(/\.(jpg|jpeg|png|webp)$/i);

                  return (
                    <tr 
                      key={item.id} 
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Direct Thumbnail Preview */}
                      <td className="py-2.5 px-4">
                        <div 
                          onClick={() => {
                            setActiveDoc(item);
                            setRejectionReason(item.rejectionReason || '');
                          }}
                          className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all flex-shrink-0"
                          title="Click to inspect document"
                        >
                          {isImage && (item.signedUrl || item.previewUrl) ? (
                            <img
                              src={item.signedUrl || item.previewUrl || ''}
                              alt={item.type}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="p-1 text-slate-500 dark:text-slate-400">
                              {getTypeIcon(item.type)}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Document Type */}
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                            {getTypeIcon(item.type)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100 font-sans">
                              {item.type.replace(/_/g, ' ')}
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500">
                              {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Technician */}
                      <td className="py-2.5 px-4 font-sans">
                        <div className="font-semibold text-slate-900 dark:text-slate-200">
                          {item.technician?.fullName || 'Technician'}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {item.technician?.phone || 'N/A'}
                          {item.technician?.city && (
                            <span className="text-slate-400 dark:text-slate-500 text-[10px]">
                              • {item.technician.city}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Doc Number / Storage Key */}
                      <td className="py-2.5 px-4 text-[11px]">
                        <div className="text-slate-900 dark:text-slate-200 font-bold">
                          {item.documentNumber || '—'}
                        </div>
                        <div 
                          className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-xs" 
                          title={item.objectKey}
                        >
                          {item.objectKey}
                        </div>
                      </td>

                      {/* File Size & Mime */}
                      <td className="py-2.5 px-4 text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                        <div>{item.mimeType || 'image/jpeg'}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                          {(item.fileSize / 1024).toFixed(0)} KB
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-2.5 px-4">
                        <StatusBadge status={item.status} />
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-4 text-right font-sans">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Direct New Tab Button */}
                          <a
                            href={targetUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-700 transition-colors inline-flex items-center shadow-xs cursor-pointer"
                            title="Open in New Tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          </a>

                          {/* Inspect in Dashboard Button */}
                          <button
                            onClick={() => {
                              setActiveDoc(item);
                              setRejectionReason(item.rejectionReason || '');
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded border border-slate-200 dark:border-slate-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            Inspect
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Showing {docList.length} of {countTotal} verified documents
          </span>
          <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
            Security Gate: Wasabi S3 Authenticated & HMAC Signed
          </span>
        </div>
      </div>

      {/* 6. Document Inspection Case Drawer */}
      <CaseDrawer
        isOpen={Boolean(activeDoc)}
        onClose={() => setActiveDoc(null)}
        title={`${activeDoc?.type.replace(/_/g, ' ')} Inspection`}
        subtitle={`ID: ${activeDoc?.id.substring(0, 12)}... • Uploaded ${activeDoc ? new Date(activeDoc.createdAt).toLocaleDateString('en-IN') : ''}`}
        status={activeDoc?.status}
        actions={
          activeDoc && (
            <div className="flex items-center justify-between w-full">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Current: <span className="text-slate-900 dark:text-slate-200 font-semibold">{activeDoc.status}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={processing}
                  onClick={() => handleDocumentAction('REJECTED')}
                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-semibold rounded transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
                <button
                  disabled={processing}
                  onClick={() => handleDocumentAction('VERIFIED')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Approve & Verify
                </button>
              </div>
            </div>
          )
        }
      >
        {activeDoc && (
          <div className="space-y-5 text-xs">
            {/* Technician Profile Snapshot */}
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-2">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-500" />
                Technician Profile
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-slate-500">Full Name:</span>
                  <p className="font-semibold text-slate-900 dark:text-slate-200 text-sm">
                    {activeDoc.technician.fullName}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Phone:</span>
                  <p className="font-mono text-slate-800 dark:text-slate-200 font-medium">
                    {activeDoc.technician.phone}
                  </p>
                </div>
                {activeDoc.technician.city && (
                  <div>
                    <span className="text-slate-500">Location:</span>
                    <p className="text-slate-700 dark:text-slate-300 font-medium">
                      {activeDoc.technician.city} {activeDoc.technician.state ? `, ${activeDoc.technician.state}` : ''}
                    </p>
                  </div>
                )}
                {activeDoc.technician.onboardingStatus && (
                  <div>
                    <span className="text-slate-500">Onboarding Status:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {activeDoc.technician.onboardingStatus}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Document Attributes */}
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-2 font-mono">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <FileText className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                File Metadata
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Document Number:</span>
                  <span className="text-slate-900 dark:text-slate-100 font-bold">{activeDoc.documentNumber || 'Not Specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Storage Key:</span>
                  <span className="text-slate-700 dark:text-slate-300 truncate max-w-[200px]" title={activeDoc.objectKey}>
                    {activeDoc.objectKey}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">MIME / Size:</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {activeDoc.mimeType} ({(activeDoc.fileSize / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Verification:</span>
                  <span><StatusBadge status={activeDoc.status} /></span>
                </div>
              </div>
            </div>

            {/* Document Preview Viewport */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                <span>Document Viewport</span>
                {(signedUrl || activeDoc.previewUrl) && (
                  <a
                    href={signedUrl || activeDoc.previewUrl || `/api/documents/${activeDoc.id}/view`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 capitalize font-normal text-xs cursor-pointer font-sans"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open in New Tab
                  </a>
                )}
              </div>

              {signedUrl || activeDoc.previewUrl ? (
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-3 relative group">
                  {activeDoc.mimeType === 'application/pdf' ? (
                    <div className="w-full space-y-3 text-center py-6">
                      <FileText className="w-12 h-12 text-rose-500 mx-auto" />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">PDF Document Scan</p>
                        <p className="text-slate-400 text-[11px] mt-0.5">Click below to view the PDF in full-screen reader.</p>
                      </div>
                      <a
                        href={signedUrl || activeDoc.previewUrl || `/api/documents/${activeDoc.id}/view`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open PDF in New Tab
                      </a>
                    </div>
                  ) : (
                    <>
                      <img
                        src={signedUrl || activeDoc.previewUrl || ''}
                        alt="Document Scan"
                        className="max-h-80 w-auto object-contain rounded shadow-xs"
                      />
                      <div className="mt-2 text-center">
                        <a
                          href={signedUrl || activeDoc.previewUrl || `/api/documents/${activeDoc.id}/view`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-sans"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View Full Resolution in New Tab
                        </a>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-8 text-center bg-slate-50/50 dark:bg-slate-950/50">
                  <Loader2 className="w-7 h-7 text-blue-500 animate-spin mx-auto mb-2" />
                  <p className="text-slate-700 dark:text-slate-400 font-medium">Generating Authenticated Wasabi URL...</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-0.5 font-mono">{activeDoc.objectKey}</p>
                </div>
              )}
            </div>

            {/* Rejection Reason Form */}
            <div className="space-y-1.5 pt-2">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Rejection Reason (Audit Trail)
              </label>
              <textarea
                rows={2}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Specify failure criteria (e.g., Blur, expired license, name mismatch)..."
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2.5 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </CaseDrawer>
    </div>
  );
}
