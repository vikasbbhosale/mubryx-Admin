"use client";

import React, { useState } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

interface DestructiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
  title: string;
  description: string;
  confirmText?: string;
  confirmKeyword?: string;
  requireReason?: boolean;
  reasonPlaceholder?: string;
  consequences?: string[];
  isLoading?: boolean;
}

export function DestructiveModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm Action',
  confirmKeyword,
  requireReason = true,
  reasonPlaceholder = 'Enter operational reason for audit record (required)...',
  consequences = [],
  isLoading = false,
}: DestructiveModalProps) {
  const [reason, setReason] = useState('');
  const [typedKeyword, setTypedKeyword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isKeywordValid = confirmKeyword
    ? typedKeyword.trim().toUpperCase() === confirmKeyword.toUpperCase()
    : true;

  const isReasonValid = requireReason ? reason.trim().length >= 4 : true;

  const canSubmit = isKeywordValid && isReasonValid && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReasonValid) {
      setError('Please provide a valid operational reason (min 4 characters).');
      return;
    }
    if (!isKeywordValid) {
      setError(`Please type "${confirmKeyword}" to confirm.`);
      return;
    }
    setError(null);
    await onConfirm(reason.trim());
    setReason('');
    setTypedKeyword('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-6 text-slate-800 dark:text-slate-100 z-10 space-y-4 transition-colors duration-150">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                {title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Consequences Bullet Points */}
        {consequences.length > 0 && (
          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-lg p-3 text-xs space-y-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider block">
              Operational Impact & Consequences:
            </span>
            <ul className="space-y-1 text-slate-600 dark:text-slate-400">
              {consequences.map((c, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reason Input */}
          {requireReason && (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Audit Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setError(null);
                }}
                placeholder={reasonPlaceholder}
                rows={3}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30"
              />
            </div>
          )}

          {/* Type Keyword to Confirm */}
          {confirmKeyword && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Type <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">{confirmKeyword}</span> to confirm:
              </label>
              <input
                type="text"
                value={typedKeyword}
                onChange={(e) => {
                  setTypedKeyword(e.target.value);
                  setError(null);
                }}
                placeholder={confirmKeyword}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-rose-500"
              />
            </div>
          )}

          {error && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
