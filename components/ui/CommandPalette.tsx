"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  CalendarCheck, 
  Users, 
  UserCheck, 
  Layers, 
  Wallet, 
  FileText, 
  Activity, 
  Settings, 
  LifeBuoy, 
  ArrowRight, 
  Clock, 
  Command 
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  category: string;
  href?: string;
  icon: any;
  action?: () => void;
  shortcut?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const defaultCommands: CommandItem[] = [
    {
      id: 'nav-dashboard',
      title: 'Operations Dashboard',
      category: 'Navigation',
      href: '/',
      icon: Activity,
      shortcut: 'G D',
    },
    {
      id: 'nav-live-ops',
      title: 'Live Operations (Air Traffic Control)',
      category: 'Navigation',
      href: '/live-ops',
      icon: Activity,
      shortcut: 'G L',
    },
    {
      id: 'nav-bookings',
      title: 'Orders & Dispatches',
      category: 'Navigation',
      href: '/bookings',
      icon: CalendarCheck,
      shortcut: 'G B',
    },
    {
      id: 'nav-technicians',
      title: 'Technicians Roster',
      category: 'Navigation',
      href: '/technicians',
      icon: Users,
      shortcut: 'G T',
    },
    {
      id: 'nav-verifications',
      title: 'KYC & Verification Queue',
      category: 'Workforce',
      href: '/verifications',
      icon: UserCheck,
      shortcut: 'G V',
    },
    {
      id: 'nav-finance',
      title: 'Financial Ledger & Wallets',
      category: 'Finance',
      href: '/finance',
      icon: Wallet,
      shortcut: 'G F',
    },
    {
      id: 'nav-support',
      title: 'Support & Disputes Inbox',
      category: 'Customer Experience',
      href: '/support',
      icon: LifeBuoy,
      shortcut: 'G S',
    },
    {
      id: 'nav-services',
      title: 'Service Catalog & Pricing',
      category: 'Catalog',
      href: '/services',
      icon: Layers,
    },
    {
      id: 'nav-audit',
      title: 'Security & Governance Audit Logs',
      category: 'Security',
      href: '/audit-logs',
      icon: FileText,
      shortcut: 'G A',
    },
    {
      id: 'nav-settings',
      title: 'System Settings & Health',
      category: 'System',
      href: '/settings',
      icon: Settings,
    },
  ];

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
      setQuery('');
    }
  }, [isOpen]);

  // Filter commands
  const filteredCommands = query.trim()
    ? defaultCommands.filter((cmd) =>
        cmd.title.toLowerCase().includes(query.toLowerCase()) ||
        cmd.category.toLowerCase().includes(query.toLowerCase())
      )
    : defaultCommands;

  const handleSelect = (item: CommandItem) => {
    onClose();
    if (item.href) {
      router.push(item.href);
    } else if (item.action) {
      item.action();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        handleSelect(filteredCommands[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Palette Container */}
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden z-10 flex flex-col transition-colors duration-150">
        {/* Search input */}
        <div className="flex items-center px-4 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or jump to screen..."
            className="w-full py-3.5 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none font-medium"
          />
          <kbd className="text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/40 custom-scrollbar">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No matching commands or routes found for &quot;{query}&quot;.
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  onClick={() => handleSelect(cmd)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                    isSelected ? 'bg-blue-600 text-white font-medium shadow-2xs' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <cmd.icon
                      className={`w-4 h-4 flex-shrink-0 ${
                        isSelected ? 'text-white' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    />
                    <span className="truncate">{cmd.title}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {cmd.category}
                    </span>
                    {cmd.shortcut && (
                      <kbd
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                          isSelected
                            ? 'bg-blue-700 border-blue-500 text-blue-100'
                            : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="font-mono text-[10px]">Mubryx Admin OS</span>
        </div>
      </div>
    </div>
  );
}
