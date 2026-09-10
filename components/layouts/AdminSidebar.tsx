"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  FileCheck, 
  CalendarCheck,
  Layers,
  Wallet,
  Settings, 
  LogOut,
  Shield,
  FileText,
  ShieldCheck,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showSignoutConfirm, setShowSignoutConfirm] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error', e);
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const navSections: NavSection[] = [
    {
      title: 'Operations',
      items: [
        { name: 'Overview', href: '/', icon: LayoutDashboard },
        { name: 'Orders & Dispatches', href: '/bookings', icon: CalendarCheck },
      ],
    },
    {
      title: 'Workforce & Compliance',
      items: [
        { name: 'Technicians', href: '/technicians', icon: Users },
        { name: 'KYC Verifications', href: '/verifications', icon: UserCheck },
        { name: 'Document Audits', href: '/documents', icon: FileCheck },
      ],
    },
    {
      title: 'Platform & Finance',
      items: [
        { name: 'Services Catalog', href: '/services', icon: Layers },
        { name: 'Financials & Wallets', href: '/finance', icon: Wallet },
      ],
    },
    {
      title: 'Governance & Security',
      items: [
        { name: 'Security Audit Logs', href: '/audit-logs', icon: FileText },
        { name: 'System Settings', href: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside className="flex flex-col w-60 bg-slate-900 text-slate-300 h-full border-r border-slate-800 flex-shrink-0 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between h-14 px-5 border-b border-slate-800/90">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-white text-slate-900 flex items-center justify-center font-black text-xs tracking-tighter">
            M
          </div>
          <div>
            <span className="text-xs font-bold tracking-tight text-white block leading-tight">Mubryx</span>
            <span className="text-[10px] text-slate-400 font-mono block leading-none">Console</span>
          </div>
        </div>
        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
          PROD
        </span>
      </div>

      {/* Navigation Sections */}
      <div className="flex flex-col flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2.5 mb-1.5">
              {section.title}
            </div>
            {section.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(`${item.href}`));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <item.icon className={`h-3.5 w-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer / Operator Status & Logout */}
      <div className="p-3 border-t border-slate-800/90 bg-slate-900/90 text-xs">
        {showSignoutConfirm ? (
          <div className="bg-slate-800/90 p-2.5 rounded-lg border border-slate-700 text-slate-300 space-y-2">
            <p className="text-[11px] font-medium text-slate-200 leading-snug">
              Confirm ending administrative session?
            </p>
            <div className="flex gap-1.5">
              <button
                onClick={handleLogout}
                className="flex-1 py-1 text-[11px] font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded transition-colors cursor-pointer"
              >
                Sign Out
              </button>
              <button
                onClick={() => setShowSignoutConfirm(false)}
                className="py-1 px-2 text-[11px] font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowSignoutConfirm(true)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-md transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2 text-xs font-medium">
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </span>
            <span className="text-[10px] font-mono text-slate-400">Esc</span>
          </button>
        )}
      </div>
    </aside>
  );
}
