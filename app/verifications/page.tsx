"use client";

import { useState } from 'react';
import { 
  MOCK_TECHNICIANS, 
  TechnicianMock, 
  OnboardingStatus, 
  getStatusBadgeColor, 
  formatDocType 
} from '@/lib/mock-data';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileCheck2, 
  ShieldCheck, 
  AlertTriangle, 
  UserCheck,
  Search,
  ExternalLink,
  MessageSquare,
  BadgeCheck,
  Ban
} from 'lucide-react';

export default function VerificationsPage() {
  const [technicians, setTechnicians] = useState<TechnicianMock[]>(MOCK_TECHNICIANS);
  const [filterTab, setFilterTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'ALL'>('PENDING');
  const [search, setSearch] = useState('');
  const [reviewTech, setReviewTech] = useState<TechnicianMock | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  // Filter technicians based on tab
  const filteredTechs = technicians.filter(t => {
    const isPending = t.onboardingStatus === 'SUBMITTED' || t.onboardingStatus === 'UNDER_REVIEW';
    const matchesTab = 
      filterTab === 'PENDING' ? isPending :
      filterTab === 'APPROVED' ? t.onboardingStatus === 'APPROVED' :
      filterTab === 'REJECTED' ? t.onboardingStatus === 'REJECTED' :
      filterTab === 'SUSPENDED' ? t.onboardingStatus === 'SUSPENDED' : true;

    const matchesSearch = 
      t.fullName.toLowerCase().includes(search.toLowerCase()) ||
      t.phone.includes(search) ||
      t.currentCity.toLowerCase().includes(search.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const handleDecision = (newStatus: OnboardingStatus) => {
    if (!reviewTech) return;

    setTechnicians(prev => prev.map(t => {
      if (t.id === reviewTech.id) {
        return {
          ...t,
          onboardingStatus: newStatus,
          reviewNotes: reviewNotes || t.reviewNotes,
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    }));

    setReviewTech(null);
    setReviewNotes('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-400" />
            <h1 className="text-2xl font-bold">Technician Verification Hub</h1>
          </div>
          <p className="mt-1 text-sm text-blue-200">
            Review submitted KYC documents, audit mandatory requirement compliance, and execute approval workflows.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-center border border-white/10">
            <div className="text-xs text-blue-200">Pending Review</div>
            <div className="text-xl font-bold text-white">
              {technicians.filter(t => t.onboardingStatus === 'SUBMITTED' || t.onboardingStatus === 'UNDER_REVIEW').length}
            </div>
          </div>
          <div className="bg-emerald-500/20 backdrop-blur-md px-4 py-2 rounded-xl text-center border border-emerald-500/30">
            <div className="text-xs text-emerald-200">Approved</div>
            <div className="text-xl font-bold text-emerald-300">
              {technicians.filter(t => t.onboardingStatus === 'APPROVED').length}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-1 bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
          <button
            onClick={() => setFilterTab('PENDING')}
            className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
              filterTab === 'PENDING' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pending Review ({technicians.filter(t => t.onboardingStatus === 'SUBMITTED' || t.onboardingStatus === 'UNDER_REVIEW').length})
          </button>
          <button
            onClick={() => setFilterTab('APPROVED')}
            className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
              filterTab === 'APPROVED' ? 'bg-white text-emerald-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Approved ({technicians.filter(t => t.onboardingStatus === 'APPROVED').length})
          </button>
          <button
            onClick={() => setFilterTab('REJECTED')}
            className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
              filterTab === 'REJECTED' ? 'bg-white text-rose-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Rejected ({technicians.filter(t => t.onboardingStatus === 'REJECTED').length})
          </button>
          <button
            onClick={() => setFilterTab('SUSPENDED')}
            className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
              filterTab === 'SUSPENDED' ? 'bg-white text-purple-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Suspended ({technicians.filter(t => t.onboardingStatus === 'SUSPENDED').length})
          </button>
          <button
            onClick={() => setFilterTab('ALL')}
            className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
              filterTab === 'ALL' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({technicians.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>
      </div>

      {/* Applications Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTechs.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-dashed border-gray-300">
            <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-700">No applications match this filter</h3>
            <p className="text-xs text-gray-500 mt-1">Select a different tab or reset your search term.</p>
          </div>
        ) : (
          filteredTechs.map((tech) => {
            const hasAadhaar = tech.documents.some(d => d.type === 'AADHAAR');
            const hasPan = tech.documents.some(d => d.type === 'PAN');
            const hasBasicInfo = !!(tech.fullName && tech.dateOfBirth && tech.currentCity);
            const hasPhoto = !!tech.profilePhoto;
            const hasSkills = tech.skills.length > 0;
            const isBackendCompliant = hasAadhaar && hasPan && hasBasicInfo && hasPhoto && hasSkills;

            return (
              <div key={tech.id} className="bg-white rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden">
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img src={tech.profilePhoto} alt={tech.fullName} className="w-12 h-12 rounded-full object-cover border" />
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                          {tech.fullName}
                          {isBackendCompliant && <BadgeCheck className="w-4 h-4 text-blue-500 inline" />}
                        </h3>
                        <p className="text-xs text-gray-500">{tech.phone} • {tech.currentCity}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getStatusBadgeColor(tech.onboardingStatus)}`}>
                      {tech.onboardingStatus.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Backend Compliance Checklist */}
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs space-y-1.5">
                    <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex justify-between">
                      <span>Backend Onboarding Audit</span>
                      <span className={isBackendCompliant ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                        {isBackendCompliant ? 'Compliant' : 'Incomplete'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Aadhaar Document:</span>
                      {hasAadhaar ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Present</span>
                      ) : (
                        <span className="text-rose-600 font-bold flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Missing</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">PAN Document:</span>
                      {hasPan ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Present</span>
                      ) : (
                        <span className="text-rose-600 font-bold flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Missing</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Basic Info & Photo:</span>
                      {hasBasicInfo && hasPhoto ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Complete</span>
                      ) : (
                        <span className="text-rose-600 font-bold flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Incomplete</span>
                      )}
                    </div>
                  </div>

                  {/* Skills badges */}
                  <div className="flex flex-wrap gap-1">
                    {tech.skills.map(s => (
                      <span key={s.id} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-semibold rounded">
                        {s.name}
                      </span>
                    ))}
                  </div>

                  {tech.reviewNotes && (
                    <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span><strong>Admin Note:</strong> {tech.reviewNotes}</span>
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="bg-gray-50 border-t border-gray-100 p-4 flex items-center justify-between">
                  <span className="text-[11px] text-gray-500">
                    {tech.submittedAt ? `Submitted ${new Date(tech.submittedAt).toLocaleDateString()}` : 'Draft Application'}
                  </span>
                  <button
                    onClick={() => {
                      setReviewTech(tech);
                      setReviewNotes(tech.reviewNotes || '');
                    }}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <FileCheck2 className="w-3.5 h-3.5" /> Start Audit
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Review Modal */}
      {reviewTech && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 p-6 space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Audit Application — {reviewTech.fullName}</h2>
                <p className="text-xs text-gray-500">Review documents and decide approval status</p>
              </div>
              <button 
                onClick={() => setReviewTech(null)} 
                aria-label="Close audit modal"
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                ✕
              </button>
            </div>

            {/* Document Review List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Submitted Document Files</h4>
              {reviewTech.documents.map(doc => (
                <div key={doc.id} className="p-3 border rounded-xl flex items-center justify-between bg-gray-50 text-xs">
                  <div>
                    <div className="font-bold text-gray-900">{formatDocType(doc.type)} ({doc.documentNumber || 'No Doc Number'})</div>
                    <div className="text-gray-500">{doc.objectKey} • {(doc.fileSize / 1024).toFixed(0)} KB</div>
                  </div>
                  {doc.previewUrl && (
                    <a
                      href={doc.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      View File <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>

            {/* Notes Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" /> Verification / Rejection Notes
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Reason for approval, rejection, or suspension..."
                rows={3}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
              <button
                onClick={() => handleDecision('UNDER_REVIEW')}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
              >
                <Clock className="w-4 h-4" /> Move to Under Review
              </button>
              <button
                onClick={() => handleDecision('REJECTED')}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" /> Reject Application
              </button>
              <button
                onClick={() => handleDecision('SUSPENDED')}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
              >
                <Ban className="w-4 h-4" /> Suspend
              </button>
              <button
                onClick={() => handleDecision('APPROVED')}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Approve Technician
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
