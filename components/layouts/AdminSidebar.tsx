"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Activity, 
  CalendarCheck, 
  Users, 
  UserCheck, 
  FileCheck, 
  Layers, 
  Wallet, 
  LifeBuoy, 
  FileText, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Shield
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [showSignoutConfirm, setShowSignoutConfirm] = useState(false);

  // Restore collapsed state from localStorage if available
  useEffect(() => {
    const saved = localStorage.getItem('mubryx_sidebar_collapsed');
    if (saved !== null) {
      setCollapsed(saved === 'true');
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('mubryx_sidebar_collapsed', String(next));
      return next;
    });
  };

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
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Live Operations', href: '/live-ops', icon: Activity, badge: 'LIVE', badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
        { name: 'Orders & Dispatches', href: '/bookings', icon: CalendarCheck },
      ],
    },
    {
      title: 'Workforce & KYC',
      items: [
        { name: 'Technicians', href: '/technicians', icon: Users },
        { name: 'KYC Verifications', href: '/verifications', icon: UserCheck },
        { name: 'Document Audits', href: '/documents', icon: FileCheck },
      ],
    },
    {
      title: 'Finance & Catalog',
      items: [
        { name: 'Ledger & Wallets', href: '/finance', icon: Wallet },
        { name: 'Services Catalog', href: '/services', icon: Layers },
      ],
    },
    {
      title: 'Customer Experience',
      items: [
        { name: 'Support & Disputes', href: '/support', icon: LifeBuoy },
      ],
    },
    {
      title: 'Security & Governance',
      items: [
        { name: 'Audit Logs', href: '/audit-logs', icon: FileText },
        { name: 'System Settings', href: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={`flex flex-col bg-slate-900 border-r border-slate-800 text-slate-300 h-full flex-shrink-0 select-none z-30 transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-14 px-3.5 border-b border-slate-800">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs flex-shrink-0 shadow-xs">
            M
          </div>
          {!collapsed && (
            <div className="truncate">
              <span className="text-xs font-bold tracking-tight text-white block leading-tight">
                Mubryx Ops
              </span>
              <span className="text-[9px] text-slate-500 font-mono block leading-none font-semibold uppercase tracking-wider">
                Admin Console
              </span>
            </div>
          )}
        </div>

        {/* Collapse Toggle Button */}
        <button
          onClick={toggleCollapsed}
          className="p-1 rounded-md text-slate-500 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex flex-col flex-1 overflow-y-auto px-2.5 py-4 space-y-5 custom-scrollbar">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            {!collapsed && (
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2.5 mb-1.5">
                {section.title}
              </div>
            )}
            {section.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/' && pathname?.startsWith(`${item.href}`));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={collapsed ? item.name : undefined}
                  className={`group flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <item.icon
                      className={`h-4 w-4 flex-shrink-0 ${
                        isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />
                    {!collapsed && <span className="truncate tracking-wide">{item.name}</span>}
                  </div>

                  {!collapsed && item.badge && (
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${
                        item.badgeColor || 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer / Operator Session */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-xs">
        {showSignoutConfirm ? (
          <div className="bg-slate-900 p-2.5 rounded-lg border border-rose-500/30 text-slate-300 space-y-2">
            <p className="text-[11px] font-semibold text-white leading-snug text-center">
              End session?
            </p>
            <div className="flex gap-1.5">
              <button
                onClick={handleLogout}
                className="flex-1 py-1 text-[11px] font-bold bg-rose-600 hover:bg-rose-500 text-white rounded transition-colors cursor-pointer"
              >
                Sign Out
              </button>
              <button
                onClick={() => setShowSignoutConfirm(false)}
                className="py-1 px-2.5 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowSignoutConfirm(true)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer group"
            title="Sign Out"
          >
            <span className="flex items-center gap-2 text-xs font-medium tracking-wide truncate">
              <LogOut className="h-4 w-4 flex-shrink-0 group-hover:-translate-x-0.5 transition-transform" />
              {!collapsed && <span className="truncate">Sign Out</span>}
            </span>
            {!collapsed && (
              <span className="text-[9px] font-mono text-slate-600 group-hover:text-rose-500/60 uppercase">
                ESC
              </span>
            )}
          </button>
        )}
      </div>
    </aside>
  );
}
