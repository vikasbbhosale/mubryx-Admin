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
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Briefcase, 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Award,
  Ban,
  UserCheck,
  FileCheck,
  AlertCircle
} from 'lucide-react';

export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState<TechnicianMock[]>(MOCK_TECHNICIANS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedTech, setSelectedTech] = useState<TechnicianMock | null>(null);
  const [actionNote, setActionNote] = useState('');

  // Status counts for quick stats
  const countTotal = technicians.length;
  const countSubmitted = technicians.filter(t => t.onboardingStatus === 'SUBMITTED').length;
  const countUnderReview = technicians.filter(t => t.onboardingStatus === 'UNDER_REVIEW').length;
  const countApproved = technicians.filter(t => t.onboardingStatus === 'APPROVED').length;
  const countRejected = technicians.filter(t => t.onboardingStatus === 'REJECTED').length;
  const countSuspended = technicians.filter(t => t.onboardingStatus === 'SUSPENDED').length;

  // Filtering logic
  const filteredTechnicians = technicians.filter(tech => {
    const matchesSearch = 
      tech.fullName.toLowerCase().includes(search.toLowerCase()) ||
      tech.phone.includes(search) ||
      tech.currentCity.toLowerCase().includes(search.toLowerCase()) ||
      tech.skills.some(s => s.name.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || tech.onboardingStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = (techId: string, newStatus: OnboardingStatus, notes?: string) => {
    const noteToSave = notes || actionNote || undefined;
    setTechnicians(prev => prev.map(t => {
      if (t.id === techId) {
        return {
          ...t,
          onboardingStatus: newStatus,
          reviewNotes: noteToSave || t.reviewNotes,
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    }));

    if (selectedTech && selectedTech.id === techId) {
      setSelectedTech(prev => prev ? { 
        ...prev, 
        onboardingStatus: newStatus, 
        reviewNotes: noteToSave || prev.reviewNotes,
        updatedAt: new Date().toISOString()
      } : null);
    }
    setActionNote('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Technicians Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            View profiles, review submitted documents, and manage technician onboarding statuses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-200">
            Total: {countTotal} Technicians
          </span>
        </div>
      </div>

      {/* Quick Status Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'ALL' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="text-[11px] font-semibold opacity-80 uppercase tracking-wider">All</div>
          <div className="text-xl font-bold mt-0.5">{countTotal}</div>
        </button>

        <button
          onClick={() => setStatusFilter('SUBMITTED')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'SUBMITTED' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">Submitted</div>
          <div className="text-xl font-bold mt-0.5 text-blue-700">{countSubmitted}</div>
        </button>

        <button
          onClick={() => setStatusFilter('UNDER_REVIEW')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'UNDER_REVIEW' ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">Under Review</div>
          <div className="text-xl font-bold mt-0.5 text-amber-700">{countUnderReview}</div>
        </button>

        <button
          onClick={() => setStatusFilter('APPROVED')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'APPROVED' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Approved</div>
          <div className="text-xl font-bold mt-0.5 text-emerald-700">{countApproved}</div>
        </button>

        <button
          onClick={() => setStatusFilter('REJECTED')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'REJECTED' ? 'bg-rose-600 text-white border-rose-600 shadow-sm' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider">Rejected</div>
          <div className="text-xl font-bold mt-0.5 text-rose-700">{countRejected}</div>
        </button>

        <button
          onClick={() => setStatusFilter('SUSPENDED')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'SUSPENDED' ? 'bg-purple-600 text-white border-purple-600 shadow-sm' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="text-[11px] font-semibold text-purple-600 uppercase tracking-wider">Suspended</div>
          <div className="text-xl font-bold mt-0.5 text-purple-700">{countSuspended}</div>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search technician by name, phone, city, or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-xs font-semibold text-gray-600 uppercase">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
          >
            <option value="ALL">All Statuses ({countTotal})</option>
            <option value="SUBMITTED">Submitted ({countSubmitted})</option>
            <option value="UNDER_REVIEW">Under Review ({countUnderReview})</option>
            <option value="APPROVED">Approved ({countApproved})</option>
            <option value="REJECTED">Rejected ({countRejected})</option>
            <option value="SUSPENDED">Suspended ({countSuspended})</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>
      </div>

      {/* Technicians Data Table */}
      <div className="bg-white shadow-xs rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Technician</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Skills</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Experience</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Documents</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredTechnicians.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No technicians found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredTechnicians.map((tech) => (
                  <tr key={tech.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <img
                          src={tech.profilePhoto}
                          alt={tech.fullName}
                          className="h-10 w-10 rounded-full object-cover border border-gray-200"
                        />
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{tech.fullName}</div>
                          <div className="text-xs text-gray-500">{tech.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{tech.currentCity}</div>
                      <div className="text-xs text-gray-500">PIN: {tech.pinCode}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {tech.skills.map((skill) => (
                          <span key={skill.id} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded font-medium">
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {tech.experienceYears} Years
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusBadgeColor(tech.onboardingStatus)}`}>
                        {tech.onboardingStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-600 font-medium">
                        {tech.documents.length} Uploaded
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedTech(tech)}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Technician Detail Modal */}
      {selectedTech && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <img
                  src={selectedTech.profilePhoto}
                  alt={selectedTech.fullName}
                  className="w-12 h-12 rounded-full object-cover border"
                />
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedTech.fullName}</h2>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusBadgeColor(selectedTech.onboardingStatus)}`}>
                    {selectedTech.onboardingStatus.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedTech(null);
                  setActionNote('');
                }}
                aria-label="Close details modal"
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Profile Overview Card */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Phone</div>
                    <div className="font-semibold text-gray-900">{selectedTech.phone}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Email</div>
                    <div className="font-semibold text-gray-900">{selectedTech.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">City & PIN</div>
                    <div className="font-semibold text-gray-900">{selectedTech.currentCity} ({selectedTech.pinCode})</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Date of Birth & Gender</div>
                    <div className="font-semibold text-gray-900">{selectedTech.dateOfBirth} ({selectedTech.gender})</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Experience</div>
                    <div className="font-semibold text-gray-900">{selectedTech.experienceYears} Years</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Submitted At</div>
                    <div className="font-semibold text-gray-900">
                      {selectedTech.submittedAt ? new Date(selectedTech.submittedAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <h4 className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-2">Professional Bio</h4>
                <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                  {selectedTech.bio || 'No bio provided.'}
                </p>
              </div>

              {/* Skills */}
              <div>
                <h4 className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-2">Skills & Services</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTech.skills.map(s => (
                    <div key={s.id} className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-xs">
                      <div className="font-bold text-blue-900">{s.name}</div>
                      <div className="text-blue-700 text-[11px] mt-0.5">{s.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Work Experience */}
              <div>
                <h4 className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-2 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-gray-500" /> Work History
                </h4>
                <div className="space-y-2">
                  {selectedTech.experiences.map(exp => (
                    <div key={exp.id} className="p-3 border rounded-lg bg-gray-50 text-xs">
                      <div className="flex justify-between font-bold text-gray-900">
                        <span>{exp.role} @ {exp.companyName}</span>
                        <span className="text-gray-500">{exp.startDate} - {exp.endDate}</span>
                      </div>
                      {exp.responsibilities && (
                        <p className="mt-1 text-gray-600">{exp.responsibilities}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Uploaded Documents */}
              <div>
                <h4 className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-gray-500" /> Submitted Verification Documents
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedTech.documents.map(doc => (
                    <div key={doc.id} className="p-3 border rounded-lg bg-white flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-gray-900">{formatDocType(doc.type)}</div>
                        <div className="text-gray-500">{doc.documentNumber || doc.objectKey}</div>
                      </div>
                      <span className={`px-2 py-0.5 font-semibold text-[11px] rounded ${
                        doc.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' :
                        doc.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review Notes Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Admin Decision Note
                </label>
                <input
                  type="text"
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="E.g., Approved after background check, or Reason for rejection/suspension..."
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Status Update Actions */}
              <div className="pt-4 border-t border-gray-200 flex flex-wrap gap-2 justify-end">
                <button
                  onClick={() => handleUpdateStatus(selectedTech.id, 'APPROVED')}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" /> Approve Technician
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedTech.id, 'UNDER_REVIEW')}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                >
                  <Clock className="w-4 h-4" /> Put Under Review
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedTech.id, 'REJECTED')}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" /> Reject Application
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedTech.id, 'SUSPENDED')}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                >
                  <Ban className="w-4 h-4" /> Suspend Technician
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
