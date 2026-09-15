import React from 'react';

export type StatusCategory =
  | 'BOOKING'
  | 'ONBOARDING'
  | 'PAYMENT'
  | 'DISPATCH'
  | 'GENERIC';

interface StatusBadgeProps {
  status: string;
  category?: StatusCategory;
  className?: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({
  status,
  category = 'GENERIC',
  className = '',
  size = 'md',
}: StatusBadgeProps) {
  const cleanStatus = (status || '').toUpperCase().trim();

  // Determine semantic color style based on status
  let dotColor = 'bg-slate-400 dark:bg-slate-400';
  let badgeStyle = 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/60';

  // Success states
  if (
    [
      'COMPLETED',
      'SERVICE_COMPLETED',
      'APPROVED',
      'PAID',
      'ACTIVE',
      'ONLINE',
      'ACCEPTED',
      'SETTLED',
      'SUCCESS',
    ].includes(cleanStatus)
  ) {
    dotColor = 'bg-emerald-500 dark:bg-emerald-400';
    badgeStyle = 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20';
  }
  // Attention / Waiting / In-progress states
  else if (
    [
      'PENDING',
      'PENDING_MATCHING',
      'TECHNICIAN_SEARCHING',
      'TECHNICIAN_ASSIGNED',
      'TECHNICIAN_ON_THE_WAY',
      'TECHNICIAN_ARRIVED',
      'SERVICE_STARTED',
      'PARTIALLY_ASSIGNED',
      'UNDER_REVIEW',
      'SUBMITTED',
      'OFFERED',
      'VIEWED',
    ].includes(cleanStatus)
  ) {
    dotColor = 'bg-blue-500 dark:bg-blue-400 animate-pulse';
    badgeStyle = 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/20';
  }
  // Warning states
  else if (
    ['PAYMENT_PENDING', 'DRAFT', 'EXPIRED', 'WARNING', 'IN_INVESTIGATION'].includes(cleanStatus)
  ) {
    dotColor = 'bg-amber-500 dark:bg-amber-400';
    badgeStyle = 'bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/20';
  }
  // Destructive / Error states
  else if (
    [
      'CANCELLED',
      'REJECTED',
      'SUSPENDED',
      'FAILED',
      'REFUNDED',
      'ERROR',
      'ESCALATED',
    ].includes(cleanStatus)
  ) {
    dotColor = 'bg-rose-500 dark:bg-rose-400';
    badgeStyle = 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/20';
  }

  const formattedText = cleanStatus.replace(/_/g, ' ');

  const sizeClasses =
    size === 'sm'
      ? 'text-[10px] px-1.5 py-0.5 gap-1 font-semibold'
      : 'text-[11px] px-2 py-0.5 gap-1.5 font-medium';

  return (
    <span
      className={`inline-flex items-center rounded-md border font-mono uppercase tracking-wider ${sizeClasses} ${badgeStyle} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
      <span className="truncate">{formattedText}</span>
    </span>
  );
}
