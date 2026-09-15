"use client";

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

import { StatusBadge } from './StatusBadge';

interface CaseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  status?: string;
  width?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
  actions?: React.ReactNode;
}

export function CaseDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  status,
  width = 'lg',
  children,
  footer,
  actions,
}: CaseDrawerProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[width];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div
          className={`w-screen ${widthClasses} bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/90 sticky top-0 z-10">
            <div className="flex items-center gap-3 min-w-0 pr-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-sm font-bold text-white tracking-tight truncate">
                    {title}
                  </h2>
                  {badge || (status && <StatusBadge status={status} />)}
                </div>
                {subtitle && (
                  <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-slate-200 text-xs">
            {children}
          </div>

          {/* Optional Footer / Actions */}
          {(footer || actions) && (
            <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/70 flex items-center justify-end gap-2.5">
              {footer || actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
