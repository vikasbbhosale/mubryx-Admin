"use client";

import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { D2cApi } from '@/lib/d2c-api';

interface D2cApprovalActionModalProps {
  request: any | null;
  actionType: 'APPROVE' | 'REJECT';
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function D2cApprovalActionModal({
  request,
  actionType,
  isOpen,
  onClose,
  onSuccess,
}: D2cApprovalActionModalProps) {
  const [remarks, setRemarks] = useState('');
  const [reviewReason, setReviewReason] = useState('');
  const [replacementTechId, setReplacementTechId] = useState('');
  const [eligibleTechnicians, setEligibleTechnicians] = useState<any[]>([]);
  const [loadingTechs, setLoadingTechs] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isApprove = actionType === 'APPROVE';
  const isTransfer = request?.requestType === 'REASSIGN_REQUEST';

  // Load eligible technicians if approving a transfer request
  React.useEffect(() => {
    if (!isOpen || !request || !isApprove || !isTransfer) {
      setEligibleTechnicians([]);
      setReplacementTechId('');
      return;
    }

    const fetchTechs = async () => {
      try {
        setLoadingTechs(true);
        const res = await D2cApi.getEligibleTechnicians(request.jobId || request.job?.id);
        const list = Array.isArray(res)
          ? res
          : Array.isArray((res as any)?.data)
          ? (res as any).data
          : Array.isArray((res as any)?.items)
          ? (res as any).items
          : [];
        // Exclude the current technician who requested the transfer
        const currentTechId = request.technicianId || request.job?.assignedTechnicianId;
        const available = list.filter((t: any) => t.id !== currentTechId);
        setEligibleTechnicians(available);
      } catch (err: any) {
        console.warn('Failed to load eligible replacement technicians:', err);
      } finally {
        setLoadingTechs(false);
      }
    };

    fetchTechs();
  }, [isOpen, request?.id, isApprove, isTransfer]);

  if (!isOpen || !request) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isApprove && !reviewReason.trim()) {
      setError('Mandatory rejection reason is required.');
      return;
    }

    try {
      setSubmitting(true);
      if (isApprove) {
        await D2cApi.approveRequest(
          request.id,
          remarks.trim() || undefined,
          replacementTechId ? replacementTechId : undefined,
        );
      } else {
        await D2cApi.rejectRequest(request.id, reviewReason.trim());
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to process request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 z-10 animate-in zoom-in-95 duration-150 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {isApprove ? (
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
                <CheckCircle className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center font-bold">
                <XCircle className="w-4 h-4" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                {isApprove ? 'Approve Technician Request' : 'Reject Technician Request'}
              </h3>
              <span className="text-[11px] text-slate-400">
                Type: {request.requestType} • Ticket #{request.job?.inquiryCode || request.jobId}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="my-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 space-y-1.5">
          {request.reason && (
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-semibold uppercase">Category / Reason:</span>
              <p className="text-slate-900 dark:text-amber-300 font-semibold">{request.reason}</p>
            </div>
          )}
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-semibold uppercase">Technician's Remark:</span>
            <p className="text-slate-800 dark:text-slate-200">"{request.technicianRemark}"</p>
          </div>
          {request.proposedDate && (
            <div className="p-2 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 text-blue-700 dark:text-blue-300 font-medium">
              Requested Appointment: {new Date(request.proposedDate).toLocaleDateString()} ({request.proposedTimeSlot || 'Standard Slot'})
            </div>
          )}
          {request.requestType === 'REASSIGN_REQUEST' && isApprove && (
            <p className="text-[11px] text-blue-600 dark:text-blue-400 pt-1 border-t border-slate-200 dark:border-slate-700/40">
              Note: Approving will unassign this ticket and return it to the Unassigned Pool for reassignment.
            </p>
          )}
          {request.requestType === 'CANCELLATION_REQUEST' && isApprove && (
            <p className="text-[11px] text-rose-600 dark:text-rose-400 pt-1 border-t border-slate-200 dark:border-slate-700/40">
              Note: Approving will move this ticket to "Approved (Code Awaited)" in the Cancellation Tracker.
            </p>
          )}
        </div>

        {error && (
          <div className="mb-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {isApprove && isTransfer && (
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Assign Replacement Technician (Optional)
              </label>
              {loadingTechs ? (
                <div className="flex items-center gap-1.5 text-slate-400 py-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                  <span>Loading eligible technicians...</span>
                </div>
              ) : (
                <select
                  value={replacementTechId}
                  onChange={(e) => setReplacementTechId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">-- Leave Unassigned (Return to Dispatch Pool) --</option>
                  {eligibleTechnicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} {t.isOnline ? '🟢 Online' : '⚪ Offline'} ({t.operatingCity} • Match {t.matchScore}%)
                    </option>
                  ))}
                </select>
              )}
              <p className="text-[10px] text-slate-400 mt-1">
                Select an active technician to dispatch immediately, or leave unassigned to reassign later.
              </p>
            </div>
          )}

          {isApprove ? (
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Approval Notes / Resolution Remarks (Optional)
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter confirmation remarks..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>
          ) : (
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Mandatory Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={reviewReason}
                onChange={(e) => setReviewReason(e.target.value)}
                placeholder="Specify why this request cannot be approved..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                required
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || (!isApprove && !reviewReason.trim())}
              className={`px-4 py-1.5 rounded-lg font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-xs transition ${
                isApprove
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-rose-600 hover:bg-rose-500'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...
                </>
              ) : isApprove ? (
                'Confirm Approval'
              ) : (
                'Confirm Rejection'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
