"use client";

import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { D2cJob, D2cApi } from '@/lib/d2c-api';

interface D2cCancellationActionModalProps {
  job: D2cJob | null;
  mode: 'RECORD_CODE' | 'CONFIRM_CRM';
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function D2cCancellationActionModal({
  job,
  mode,
  isOpen,
  onClose,
  onSuccess,
}: D2cCancellationActionModalProps) {
  const [cancellationCode, setCancellationCode] = useState('');
  const [confirmationRemark, setConfirmationRemark] = useState('');
  const [crmReference, setCrmReference] = useState('');
  const [verifiedCrmCheck, setVerifiedCrmCheck] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !job) return null;

  const isConfirmCrm = mode === 'CONFIRM_CRM';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isConfirmCrm && !verifiedCrmCheck) {
      setError('You must explicitly verify that the cancellation completed in the actual CRM.');
      return;
    }

    if (isConfirmCrm && !confirmationRemark.trim()) {
      setError('Confirmation remark / CRM reference is required.');
      return;
    }

    try {
      setSubmitting(true);
      if (isConfirmCrm) {
        await D2cApi.confirmCrmCancellation(
          job.id,
          confirmationRemark.trim(),
          crmReference.trim() || undefined,
        );
      } else {
        await D2cApi.markCodeReceived(
          job.id,
          cancellationCode.trim() || undefined,
          confirmationRemark.trim() || undefined,
        );
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update cancellation status.');
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
            <div className="w-7 h-7 rounded-lg bg-orange-500/15 text-orange-400 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                {isConfirmCrm ? 'Confirm External CRM Cancellation' : 'Record Customer Cancellation Code'}
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

        {isConfirmCrm ? (
          <div className="my-3 p-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-800 dark:text-rose-300 text-xs space-y-1.5">
            <span className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" /> Authoritative CRM Verification
            </span>
            <p className="text-[11px] leading-relaxed">
              Mubryx is not directly connected to the brand OEM CRM. Confirming this action certifies that an authorized administrator has manually verified and completed the cancellation in the authoritative CRM portal.
            </p>
          </div>
        ) : (
          <div className="my-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 text-xs">
            Record the cancellation authorization code provided by the customer or brand OEM portal before processing CRM cancellation.
          </div>
        )}

        {error && (
          <div className="mb-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {!isConfirmCrm ? (
            <>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Customer Cancellation Code
                </label>
                <input
                  type="text"
                  value={cancellationCode}
                  onChange={(e) => setCancellationCode(e.target.value)}
                  placeholder="e.g. CANC-LG-9821"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-mono"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Verification Remark (Optional)
                </label>
                <input
                  type="text"
                  value={confirmationRemark}
                  onChange={(e) => setConfirmationRemark(e.target.value)}
                  placeholder="e.g. Code verified with customer over call"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  CRM Confirmation Remark <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={confirmationRemark}
                  onChange={(e) => setConfirmationRemark(e.target.value)}
                  placeholder="e.g. Ticket cancelled in LG CRM portal under Ref #LG-98412..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  External CRM Reference / Ticket No. (Optional)
                </label>
                <input
                  type="text"
                  value={crmReference}
                  onChange={(e) => setCrmReference(e.target.value)}
                  placeholder="e.g. CRM-LG-CAN-2026-001"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-mono"
                />
              </div>
              <label className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={verifiedCrmCheck}
                  onChange={(e) => setVerifiedCrmCheck(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 mt-0.5"
                />
                <span className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
                  I certify that I have verified and manually executed the cancellation in the actual CRM portal for inquiry <strong>{job.inquiryCode}</strong>.
                </span>
              </label>
            </>
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
              disabled={submitting || (isConfirmCrm && !verifiedCrmCheck)}
              className="px-4 py-1.5 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs transition"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Recording...
                </>
              ) : isConfirmCrm ? (
                'Mark CRM Cancellation Confirmed'
              ) : (
                'Save Cancellation Code'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
