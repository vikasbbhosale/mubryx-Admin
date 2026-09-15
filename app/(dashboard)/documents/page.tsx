"use client";

import { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter, 
  ExternalLink, 
  Eye, 
  Clock, 
  AlertCircle,
  X,
  Loader2,
  Download,
  ShieldCheck,
  User,
  Phone
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CaseDrawer } from '@/components/ui/CaseDrawer';

interface DocumentRowItem {
  id: string;
  type: string;
  documentNumber: string | null;
  objectKey: string;
  fileSize: number;
  mimeType: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rejectionReason: string | null;
  createdAt: string;
  previewUrl?: string | null;
  technician: {
    id: string;
    fullName: string;
    phone: string;
    city?: string;
  };
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentRowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [docTypeFilter, setDocTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [activeDoc, setActiveDoc] = useState<DocumentRowItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/technicians');
      if (res.ok) {
        const techs = await res.json();
        // Flatten documents from all technicians
        const flatDocs: DocumentRowItem[] = [];
        for (const tech of techs) {
          if (Array.isArray(tech.documents)) {
            for (const doc of tech.documents) {
              flatDocs.push({
                ...doc,
                technician: {
                  id: tech.id,
                  fullName: tech.fullName || 'Technician',
                  phone: tech.phone || 'N/A',
                  city: tech.city || 'N/A'
                }
              });
            }
          }
        }
        setDocuments(flatDocs);
      }
    } catch (error) {
      console.error('Failed to fetch documents', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Fetch signed URL when inspecting a doc
  useEffect(() => {
    if (!activeDoc) {
      setSignedUrl(null);
      setRejectionReason('');
      return;
    }

    if (activeDoc.previewUrl) {
      setSignedUrl(activeDoc.previewUrl);
      return;
    }

    // Try fetching signed URL from backend
    fetch(`/api/technicians/${activeDoc.technician.id}/documents/${activeDoc.id}/signed-url`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.url) setSignedUrl(data.url);
      })
      .catch(() => setSignedUrl(null));
  }, [activeDoc]);

  const handleDocumentAction = async (newStatus: 'VERIFIED' | 'REJECTED') => {
    if (!activeDoc) return;
    try {
      setProcessing(true);
      const res = await fetch(`/api/technicians/${activeDoc.technician.id}/documents/${activeDoc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus, 
          reason: newStatus === 'REJECTED' ? (rejectionReason || 'Document unreadable or invalid') : undefined 
        })
      });
      if (res.ok) {
        // Optimistic update local state
        setDocuments(prev => prev.map(d => d.id === activeDoc.id ? { 
          ...d, 
          status: newStatus, 
          rejectionReason: newStatus === 'REJECTED' ? rejectionReason : null 
        } : d));
        setActiveDoc(null);
      }
    } catch (error) {
      console.error('Failed to update document status', error);
    } finally {
      setProcessing(false);
    }
  };

  // Filter logic
  const filteredDocuments = documents.filter(item => {
    const matchesDocType = docTypeFilter === 'ALL' || item.type === docTypeFilter;
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      item.technician.fullName.toLowerCase().includes(searchLower) ||
      item.technician.phone.includes(search) ||
      (item.documentNumber && item.documentNumber.toLowerCase().includes(searchLower)) ||
      item.objectKey.toLowerCase().includes(searchLower);

    return matchesDocType && matchesStatus && matchesSearch;
  });

  const pendingCount = documents.filter(d => d.status === 'PENDING').length;
  const verifiedCount = documents.filter(d => d.status === 'VERIFIED').length;

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-white">KYC & Document Repository</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {documents.length} Records
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Centralized evidentiary repository for technician government IDs, PAN cards, and licenses.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>{pendingCount} Pending Review</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{verifiedCount} Verified</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search technician name, phone, document number, or storage key..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-md pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-md px-2 py-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] text-slate-400 font-medium">Type:</span>
            <select
              value={docTypeFilter}
              onChange={(e) => setDocTypeFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-slate-200">All Documents</option>
              <option value="AADHAAR" className="bg-slate-900 text-slate-200">Aadhaar Card</option>
              <option value="PAN" className="bg-slate-900 text-slate-200">PAN Card</option>
              <option value="DRIVING_LICENSE" className="bg-slate-900 text-slate-200">Driving License</option>
              <option value="PASSPORT" className="bg-slate-900 text-slate-200">Passport</option>
              <option value="VOTER_ID" className="bg-slate-900 text-slate-200">Voter ID</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-md px-2 py-1">
            <span className="text-[11px] text-slate-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-slate-200">All Statuses</option>
              <option value="PENDING" className="bg-slate-900 text-slate-200">Pending Review</option>
              <option value="VERIFIED" className="bg-slate-900 text-slate-200">Verified</option>
              <option value="REJECTED" className="bg-slate-900 text-slate-200">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-16 flex items-center justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-50" />
            <h3 className="text-sm font-semibold text-slate-300">No Documents Found</h3>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your document type, status, or search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-4">Document Type</th>
                  <th className="py-2.5 px-4">Technician</th>
                  <th className="py-2.5 px-4">Identifier / Key</th>
                  <th className="py-2.5 px-4">File Info</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                {filteredDocuments.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Document Type */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100 font-sans">{item.type.replace(/_/g, ' ')}</div>
                          <div className="text-[10px] text-slate-500">
                            {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Technician */}
                    <td className="py-3 px-4 font-sans">
                      <div className="font-medium text-slate-200">{item.technician.fullName}</div>
                      <div className="text-[11px] font-mono text-slate-400">{item.technician.phone}</div>
                    </td>

                    {/* Doc Number / Storage Key */}
                    <td className="py-3 px-4 text-[11px]">
                      <div className="text-slate-200 font-bold">{item.documentNumber || '—'}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-xs">{item.objectKey}</div>
                    </td>

                    {/* File Size & Mime */}
                    <td className="py-3 px-4 text-[11px] text-slate-400 font-sans">
                      <div>{item.mimeType || 'binary/stream'}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{(item.fileSize / 1024).toFixed(0)} KB</div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      <StatusBadge status={item.status} />
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right font-sans">
                      <button
                        onClick={() => {
                          setActiveDoc(item);
                          setRejectionReason(item.rejectionReason || '');
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded border border-slate-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Showing {filteredDocuments.length} of {documents.length} verified documents</span>
          <span className="text-[11px] font-mono text-slate-500">Security Gate: S3 Key Authentication Protected</span>
        </div>
      </div>

      {/* Document Case Drawer */}
      <CaseDrawer
        isOpen={Boolean(activeDoc)}
        onClose={() => setActiveDoc(null)}
        title={`${activeDoc?.type.replace(/_/g, ' ')} Inspection`}
        subtitle={`ID: ${activeDoc?.id.substring(0, 12)}... • Uploaded ${activeDoc ? new Date(activeDoc.createdAt).toLocaleDateString('en-IN') : ''}`}
        status={activeDoc?.status}
        actions={
          activeDoc && (
            <div className="flex items-center justify-between w-full">
              <div className="text-xs text-slate-400">
                Current: <span className="text-slate-200 font-semibold">{activeDoc.status}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={processing}
                  onClick={() => handleDocumentAction('REJECTED')}
                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold rounded transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
                <button
                  disabled={processing}
                  onClick={() => handleDocumentAction('VERIFIED')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
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
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" />
                Technician Profile
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-slate-500">Full Name:</span>
                  <p className="font-semibold text-slate-200 text-sm">{activeDoc.technician.fullName}</p>
                </div>
                <div>
                  <span className="text-slate-500">Phone:</span>
                  <p className="font-mono text-slate-200">{activeDoc.technician.phone}</p>
                </div>
              </div>
            </div>

            {/* Document Attributes */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2 font-mono">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                File Metadata
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Document Number:</span>
                  <span className="text-slate-100 font-bold">{activeDoc.documentNumber || 'Not Specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Storage Key:</span>
                  <span className="text-slate-300 truncate max-w-[200px]" title={activeDoc.objectKey}>{activeDoc.objectKey}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">MIME / Size:</span>
                  <span className="text-slate-300">{activeDoc.mimeType} ({(activeDoc.fileSize / 1024).toFixed(1)} KB)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Verification:</span>
                  <span><StatusBadge status={activeDoc.status} /></span>
                </div>
              </div>
            </div>

            {/* Document Preview Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                <span>Document Viewport</span>
                {signedUrl && (
                  <a
                    href={signedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1 capitalize font-normal text-xs"
                  >
                    <ExternalLink className="w-3 h-3" /> Open Raw in New Tab
                  </a>
                )}
              </div>

              {signedUrl ? (
                <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950 flex items-center justify-center p-3">
                  <img
                    src={signedUrl}
                    alt="Document Scan"
                    className="max-h-72 w-auto object-contain rounded"
                  />
                </div>
              ) : (
                <div className="border border-dashed border-slate-800 rounded-lg p-8 text-center bg-slate-950/50">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 font-medium">Binary Storage Object</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-mono">{activeDoc.objectKey}</p>
                  <p className="text-[10px] text-slate-600 mt-2">
                    Signed URL resolution is secured via backend S3 credential broker.
                  </p>
                </div>
              )}
            </div>

            {/* Rejection Reason Form */}
            <div className="space-y-1.5 pt-2">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Rejection Reason (Audit Trail)
              </label>
              <textarea
                rows={2}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Specify failure criteria (e.g., Blur, expired license, name mismatch)..."
                className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-700"
              />
            </div>
          </div>
        )}
      </CaseDrawer>
    </div>
  );
}
