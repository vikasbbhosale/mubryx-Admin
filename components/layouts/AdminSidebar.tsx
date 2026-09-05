"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  FileCheck, 
  Settings, 
  LogOut,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const menuItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Technicians', href: '/technicians', icon: Users },
    { name: 'Verifications', href: '/verifications', icon: UserCheck },
    { name: 'Documents', href: '/documents', icon: FileCheck },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="flex flex-col w-64 bg-slate-950 text-white h-full border-r border-slate-800/80 flex-shrink-0 select-none">
      {/* Brand header */}
      <div className="flex items-center gap-3 h-16 px-6 border-b border-slate-800/80">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <span className="text-base font-extrabold tracking-tight text-white">Mubryx</span>
          <span className="text-xs font-semibold text-blue-400 block -mt-1">Admin Panel</span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex flex-col flex-1 overflow-y-auto px-3 py-6 space-y-1">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
          Main Navigation
        </div>
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(`${item.href}`));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <item.icon className={`mr-3 flex-shrink-0 h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* Logout Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl border border-rose-900/30 transition-all cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </span>
          <ShieldAlert className="h-3.5 w-3.5 opacity-50" />
        </button>
      </div>
    </div>
  );
}
