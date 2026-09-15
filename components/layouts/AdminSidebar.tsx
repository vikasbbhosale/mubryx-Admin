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
    <aside className="flex flex-col w-64 bg-slate-900/40 backdrop-blur-2xl text-slate-300 h-full border-r border-white/5 flex-shrink-0 select-none z-20">
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center font-black text-sm tracking-tighter">
            M
          </div>
          <div>
            <span className="text-sm font-extrabold tracking-tight text-white block leading-tight">Mubryx</span>
            <span className="text-[10px] text-blue-400 font-mono block leading-none font-semibold uppercase tracking-widest">Admin Console</span>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex flex-col flex-1 overflow-y-auto px-4 py-6 space-y-6 custom-scrollbar">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1.5">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">
              {section.title}
            </div>
            {section.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(`${item.href}`));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/5 text-white font-semibold border border-blue-500/20 shadow-lg shadow-blue-900/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <item.icon className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-blue-300'}`} />
                    <span className="truncate tracking-wide">{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer / Operator Status & Logout */}
      <div className="p-4 border-t border-white/5 bg-slate-900/20 backdrop-blur-xl text-xs">
        {showSignoutConfirm ? (
          <div className="bg-slate-950 p-3 rounded-xl border border-rose-500/30 text-slate-300 space-y-3 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <p className="text-[11px] font-semibold text-white leading-snug text-center">
              End administrative session?
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleLogout}
                className="flex-1 py-1.5 text-[11px] font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors cursor-pointer shadow-md shadow-rose-900/50"
              >
                Sign Out
              </button>
              <button
                onClick={() => setShowSignoutConfirm(false)}
                className="py-1.5 px-3 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowSignoutConfirm(true)}
            className="w-full flex items-center justify-between px-3 py-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all duration-200 cursor-pointer group"
          >
            <span className="flex items-center gap-2.5 text-xs font-semibold tracking-wide">
              <LogOut className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
              Sign Out
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600 group-hover:text-rose-500/50 transition-colors">
              Esc
            </span>
          </button>
        )}
      </div>
    </aside>
  );
}
