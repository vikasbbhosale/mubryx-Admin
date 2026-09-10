"use client";

import { useState, useEffect } from 'react';
import { 
  TechnicianMock, 
  TechnicianDocumentMock, 
  DocumentType, 
  formatDocType 
} from '@/lib/mock-data';
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
  Loader2
} from 'lucide-react';

interface DocumentRowItem {
  doc: TechnicianDocumentMock;
  technicianName: string;
  technicianPhone: string;
  technicianId: string;
}

export default function DocumentsPage() {
  const [technicians, setTechnicians] = useState<TechnicianMock[]>([]);
  const [loading, setLoading] = useState(true);
  const [docTypeFilter, setDocTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [previewDoc, setPreviewDoc] = useState<DocumentRowItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchTechnicians = async () => {
    try {
      const res = await fetch('/api/technicians');
      if (res.ok) {
        const data = await res.json();
        setTechnicians(data);
        if (previewDoc) {
          const updatedTech = data.find((t: TechnicianMock) => t.id === previewDoc.technicianId);
          if (updatedTech) {
            const updatedDoc = updatedTech.documents.find((d: TechnicianDocumentMock) => d.id === previewDoc.doc.id);
            if (updatedDoc) {
              setPreviewDoc({ ...previewDoc, doc: updatedDoc });
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch technicians', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechnicians();
  }, []);

  // Flat list of all documents with technician metadata
  const allDocuments: DocumentRowItem[] = technicians.flatMap(tech => 
    tech.documents.map(doc => ({
      doc,
      technicianName: tech.fullName,
      technicianPhone: tech.phone,
      technicianId: tech.id
    }))
  );

  // Filtering logic
  const filteredDocuments = allDocuments.filter(item => {
    const matchesDocType = docTypeFilter === 'ALL' || item.doc.type === docTypeFilter;
    const matchesStatus = statusFilter === 'ALL' || item.doc.status === statusFilter;
    const matchesSearch = 
      item.technicianName.toLowerCase().includes(search.toLowerCase()) ||
      item.technicianPhone.includes(search) ||
      (item.doc.documentNumber && item.doc.documentNumber.toLowerCase().includes(search.toLowerCase())) ||
      item.doc.objectKey.toLowerCase().includes(search.toLowerCase());

    return matchesDocType && matchesStatus && matchesSearch;
  });

  const handleDocumentAction = async (techId: string, docId: string, newStatus: 'VERIFIED' | 'REJECTED', reason?: string) => {
    try {
      const res = await fetch(`/api/technicians/${techId}/documents/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reason: reason || rejectionReason })
      });
      if (res.ok) {
        await fetchTechnicians();
        if (previewDoc && previewDoc.doc.id === docId) {
          setPreviewDoc(null);
          setRejectionReason('');
        }
      }
    } catch (error) {
      console.error('Failed to update document', error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Verification Repository</h1>
          <p className="mt-1 text-sm text-gray-500">
            Inspect, review, and verify official identification documents submitted by technicians.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-200">
            Total Documents: {allDocuments.length}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by technician, phone, doc number, or filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-xs font-semibold text-gray-600 uppercase">Doc Type:</span>
            <select
              value={docTypeFilter}
              onChange={(e) => setDocTypeFilter(e.target.value)}
              className="border border-gray-300 rounded-lg text-sm py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
            >
              <option value="ALL">All Types</option>
              <option value="AADHAAR">Aadhaar Card</option>
              <option value="PAN">PAN Card</option>
              <option value="DRIVING_LICENSE">Driving License</option>
              <option value="PASSPORT">Passport</option>
              <option value="VOTER_ID">Voter ID</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-600 uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg text-sm py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Documents Data Table */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Document Type</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Technician</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Doc Number / Key</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">File Info</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No documents found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredDocuments.map(({ doc, technicianName, technicianPhone, technicianId }) => (
                  <tr key={doc.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{formatDocType(doc.type)}</div>
                          <div className="text-[11px] text-gray-400">Uploaded {new Date(doc.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{technicianName}</div>
                      <div className="text-xs text-gray-500">{technicianPhone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-700">
                      {doc.documentNumber || doc.objectKey.split('/').pop()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      <div>{doc.mimeType}</div>
                      <div>{(doc.fileSize / 1024).toFixed(0)} KB</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                        doc.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                        doc.status === 'REJECTED' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                        'bg-amber-100 text-amber-800 border-amber-200'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setPreviewDoc({ doc, technicianName, technicianPhone, technicianId });
                            setRejectionReason(doc.rejectionReason || '');
                          }}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-md flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> Inspect
                        </button>
                        {doc.status !== 'VERIFIED' && (
                          <button
                            onClick={() => handleDocumentAction(technicianId, doc.id, 'VERIFIED')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md flex items-center gap-1 transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Verify
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspection Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 p-6 space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{formatDocType(previewDoc.doc.type)} Inspection</h2>
                <p className="text-xs text-gray-500">Technician: {previewDoc.technicianName} ({previewDoc.technicianPhone})</p>
              </div>
              <button 
                onClick={() => setPreviewDoc(null)} 
                aria-label="Close document inspection modal"
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Details Card */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Document Type:</span>
                <span className="font-bold text-gray-900">{previewDoc.doc.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Document Number:</span>
                <span className="font-mono font-bold text-gray-900">{previewDoc.doc.documentNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Object Storage Key:</span>
                <span className="font-mono text-gray-700 truncate max-w-xs">{previewDoc.doc.objectKey}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">File Size & MIME:</span>
                <span className="text-gray-900">{(previewDoc.doc.fileSize / 1024).toFixed(0)} KB ({previewDoc.doc.mimeType})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Verification Status:</span>
                <span className="font-bold">{previewDoc.doc.status}</span>
              </div>
            </div>

            {/* Preview Image or Placeholder */}
            <div>
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">File Preview</h4>
              {previewDoc.doc.previewUrl ? (
                <div className="border rounded-xl overflow-hidden bg-black/5 flex items-center justify-center p-2">
                  <img src={previewDoc.doc.previewUrl} alt="Document Preview" className="max-h-64 rounded object-contain" />
                </div>
              ) : (
                <div className="border border-dashed rounded-xl p-8 text-center text-xs text-gray-400">
                  Document stored as PDF/Binary object key ({previewDoc.doc.objectKey})
                </div>
              )}
            </div>

            {/* Rejection Note */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Rejection Reason (If rejecting)
              </label>
              <input
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="E.g., Image is blurry, name mismatch..."
                className="w-full border border-gray-300 rounded-lg p-2 text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 border-t pt-4">
              <button
                onClick={() => handleDocumentAction(previewDoc.technicianId, previewDoc.doc.id, 'REJECTED', rejectionReason || 'Document unreadable or invalid')}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" /> Reject Document
              </button>
              <button
                onClick={() => handleDocumentAction(previewDoc.technicianId, previewDoc.doc.id, 'VERIFIED')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" /> Verify Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
