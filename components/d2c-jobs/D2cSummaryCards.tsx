"use client";

import React from 'react';
import {
  Wrench,
  UserX,
  UserCheck,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Flame,
} from 'lucide-react';
import { D2cMetrics } from '@/lib/d2c-api';

interface D2cSummaryCardsProps {
  metrics: D2cMetrics;
  activeFilter?: string;
  onFilterClick: (filterKey: string) => void;
}

export default function D2cSummaryCards({
  metrics,
  activeFilter,
  onFilterClick,
}: D2cSummaryCardsProps) {
  const cards = [
    {
      key: 'ALL',
      title: 'Total D2C Jobs',
      value: metrics.total,
      icon: Wrench,
      color: 'blue',
      description: 'All registered CRM jobs',
    },
    {
      key: 'UNASSIGNED',
      title: 'Unassigned',
      value: metrics.unassigned,
      icon: UserX,
      color: 'slate',
      description: 'Awaiting technician assignment',
    },
    {
      key: 'ASSIGNED',
      title: 'Assigned',
      value: metrics.assigned,
      icon: UserCheck,
      color: 'indigo',
      description: 'Dispatched to technician',
    },
    {
      key: 'IN_PROGRESS',
      title: 'In Progress',
      value: metrics.inProgress,
      icon: Activity,
      color: 'purple',
      description: 'En-route or active repair',
    },
    {
      key: 'APPROVAL_PENDING',
      title: 'Approval Requests',
      value: metrics.approvalPending,
      icon: Clock,
      color: 'amber',
      description: 'Pending operational review',
    },
    {
      key: 'CANCELLATION_PENDING',
      title: 'Cancellation Pending',
      value: metrics.cancellationPending,
      icon: AlertTriangle,
      color: 'orange',
      description: 'Awaiting CRM confirmation',
    },
    {
      key: 'COMPLETED',
      title: 'Completed',
      value: metrics.completed,
      icon: CheckCircle2,
      color: 'emerald',
      description: 'Repaired & verified',
    },
    {
      key: 'HIGH_PRIORITY',
      title: 'High Priority',
      value: metrics.highPriority,
      icon: Flame,
      color: 'rose',
      description: 'Critical / VIP escalation',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5 mb-5 select-none">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.key;

        const colorClasses: Record<string, { bg: string; text: string; border: string; activeBorder: string; badge: string }> = {
          blue: {
            bg: 'bg-blue-500/10 text-blue-500',
            text: 'text-blue-600 dark:text-blue-400',
            border: 'border-slate-200 dark:border-slate-800',
            activeBorder: 'border-blue-500 ring-1 ring-blue-500/30',
            badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
          },
          slate: {
            bg: 'bg-slate-500/10 text-slate-500',
            text: 'text-slate-700 dark:text-slate-300',
            border: 'border-slate-200 dark:border-slate-800',
            activeBorder: 'border-slate-400 ring-1 ring-slate-400/30',
            badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
          },
          indigo: {
            bg: 'bg-indigo-500/10 text-indigo-500',
            text: 'text-indigo-600 dark:text-indigo-400',
            border: 'border-slate-200 dark:border-slate-800',
            activeBorder: 'border-indigo-500 ring-1 ring-indigo-500/30',
            badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
          },
          purple: {
            bg: 'bg-purple-500/10 text-purple-500',
            text: 'text-purple-600 dark:text-purple-400',
            border: 'border-slate-200 dark:border-slate-800',
            activeBorder: 'border-purple-500 ring-1 ring-purple-500/30',
            badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
          },
          amber: {
            bg: 'bg-amber-500/10 text-amber-500',
            text: 'text-amber-600 dark:text-amber-400',
            border: 'border-slate-200 dark:border-slate-800',
            activeBorder: 'border-amber-500 ring-1 ring-amber-500/30',
            badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
          },
          orange: {
            bg: 'bg-orange-500/10 text-orange-500',
            text: 'text-orange-600 dark:text-orange-400',
            border: 'border-slate-200 dark:border-slate-800',
            activeBorder: 'border-orange-500 ring-1 ring-orange-500/30',
            badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
          },
          emerald: {
            bg: 'bg-emerald-500/10 text-emerald-500',
            text: 'text-emerald-600 dark:text-emerald-400',
            border: 'border-slate-200 dark:border-slate-800',
            activeBorder: 'border-emerald-500 ring-1 ring-emerald-500/30',
            badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
          },
          rose: {
            bg: 'bg-rose-500/10 text-rose-500',
            text: 'text-rose-600 dark:text-rose-400',
            border: 'border-slate-200 dark:border-slate-800',
            activeBorder: 'border-rose-500 ring-1 ring-rose-500/30',
            badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
          },
        };

        const theme = colorClasses[card.color];

        return (
          <button
            key={card.key}
            onClick={() => onFilterClick(card.key)}
            className={`flex flex-col text-left p-3 rounded-xl border bg-white dark:bg-slate-900 transition-all hover:shadow-xs cursor-pointer ${
              isActive ? theme.activeBorder : theme.border
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                {card.title}
              </span>
              <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${theme.bg}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between w-full">
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {card.value}
              </span>
              {isActive && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-blue-500">
                  Active
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
              {card.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
