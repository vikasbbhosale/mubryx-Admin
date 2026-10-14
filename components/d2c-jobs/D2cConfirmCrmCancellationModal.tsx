"use client";

import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { D2cJob, D2cApi } from '@/lib/d2c-api';

interface D2cConfirmCrmCancellationModalProps {
  job: D2cJob | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function D2cConfirmCrmCancellationModal({
  job,
  isOpen,
  onClose,
  onSuccess,
}: D2cConfirmCrmCancellationModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !job) return null;

  const handleConfirm = async () => {
    setError(null);
    try {
      setSubmitting(true);
      await D2cApi.confirmCrmCancellation(job.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to confirm CRM cancellation.');
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
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-500 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Confirm CRM Cancellation
              </h3>
              <span className="text-[11px] text-slate-400">
                Ticket: {job.inquiryCode} • {job.customerName}
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

        <div className="my-4 space-y-2">
          <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
            Are you sure you want to confirm CRM cancellation for ticket{' '}
            <strong className="text-slate-900 dark:text-white font-mono">{job.inquiryCode}</strong>?
          </p>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Customer:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{job.customerName} ({job.customerPhone})</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Brand / Appliance:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{job.brandName} • {job.applianceCategory || 'Appliance'}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Technician:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{job.assignedTechnician?.fullName || 'Unassigned'}</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            This will mark the job status as <strong className="text-rose-600 dark:text-rose-400 font-semibold">Cancelled</strong> and close this ticket.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5 cursor-pointer transition shadow-xs disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Confirming...</span>
              </>
            ) : (
              <span>Confirm CRM Cancellation</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
