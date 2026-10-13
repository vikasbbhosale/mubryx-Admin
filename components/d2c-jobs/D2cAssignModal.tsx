"use client";

import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  Search,
  Check,
  Loader2,
  AlertCircle,
  Briefcase,
  MapPin,
  Sparkles,
  Phone,
} from 'lucide-react';
import { D2cJob, D2cApi, EligibleTechnician } from '@/lib/d2c-api';

interface D2cAssignModalProps {
  job: D2cJob | null;
  isReassign: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function D2cAssignModal({
  job,
  isReassign,
  isOpen,
  onClose,
  onSuccess,
}: D2cAssignModalProps) {
  const [technicians, setTechnicians] = useState<EligibleTechnician[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTechId, setSelectedTechId] = useState<string>('');
  const [reassignReason, setReassignReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !job) return;
    const fetchEligible = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await D2cApi.getEligibleTechnicians(job.id, search);
        const list = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.data)
          ? (data as any).data
          : Array.isArray((data as any)?.items)
          ? (data as any).items
          : [];
        setTechnicians(list);
      } catch (err: any) {
        setError(err?.message || 'Failed to load eligible technicians.');
        setTechnicians([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEligible();
  }, [isOpen, job?.id, search]);

  if (!isOpen || !job) return null;

  const techList = Array.isArray(technicians) ? technicians : [];
  const selectedTech = techList.find((t) => t.id === selectedTechId);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTechId) {
      setError('Please select a technician.');
      return;
    }

    if (isReassign && !reassignReason.trim()) {
      setError('Mandatory reassignment reason is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      if (isReassign) {
        await D2cApi.reassignJob(job.id, selectedTechId, reassignReason.trim());
      } else {
        await D2cApi.assignJob(job.id, selectedTechId);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to complete assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[88vh] z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {isReassign ? 'Reassign Technician' : 'Assign Technician'}
              </h2>
              <span className="text-[11px] text-slate-400">
                Ticket: {job.inquiryCode} • {job.customerName} ({job.city} • PIN: {job.pinCode})
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current vs Replacement Summary if Reassign */}
        {isReassign && job.assignedTechnician && (
          <div className="p-3 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
            <span>
              <strong>Current Technician:</strong> {job.assignedTechnician.fullName} ({job.assignedTechnician.operatingCity})
            </span>
            <span className="text-[10px] text-amber-400 font-semibold uppercase">Will be revoked immediately</span>
          </div>
        )}

        {/* Search & Content */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by technician name, PIN code, locality, or phone..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
            />
          </div>
        </div>

        {error && (
          <div className="mx-4 mt-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Technician Selection List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar text-xs">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span>Matching eligible technicians...</span>
            </div>
          ) : techList.length > 0 ? (
            techList.map((t) => {
              const isSelected = selectedTechId === t.id;
              const isCurrent = t.isCurrentTechnician;

              return (
                <div
                  key={t.id}
                  onClick={() => !isCurrent && setSelectedTechId(t.id)}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    isCurrent
                      ? 'opacity-40 bg-slate-800/20 border-slate-800 cursor-not-allowed'
                      : isSelected
                      ? 'bg-blue-500/10 border-blue-500 ring-1 ring-blue-500/30'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs shrink-0">
                      {t.fullName?.[0] || 'T'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-xs">{t.fullName}</span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            t.isOnline ? 'bg-emerald-400' : 'bg-slate-500'
                          }`}
                          title={t.isOnline ? 'Online' : 'Offline'}
                        />
                        {t.matchScore >= 70 && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> High Match ({t.matchScore}%)
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-700 text-slate-300">
                            Currently Assigned
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-slate-400 text-[11px] mt-0.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          {t.operatingCity} ({t.servicePincode})
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-slate-500" />
                          Workload: {t.activeJobsCount} active jobs
                        </span>
                        <span>{t.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-600'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-slate-400">
              No eligible approved technicians found matching filters.
            </div>
          )}
        </div>

        {/* Mandatory Reassignment Reason (if reassigning) */}
        {isReassign && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 block">
              Mandatory Reassignment Reason <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={reassignReason}
              onChange={(e) => setReassignReason(e.target.value)}
              placeholder="e.g. Technician delayed on previous job, Customer requested immediate visit..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
              required
            />
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80 rounded-b-2xl">
          <span className="text-xs text-slate-400">
            {selectedTech ? `Selected: ${selectedTech.fullName}` : 'No technician selected'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={submitting || !selectedTechId || (isReassign && !reassignReason.trim())}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 cursor-pointer text-xs shadow-xs transition"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Committing...
                </>
              ) : (
                isReassign ? 'Confirm Reassignment' : 'Confirm Assignment'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
