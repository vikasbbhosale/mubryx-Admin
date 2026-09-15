"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Bell, 
  Search, 
  ShieldCheck, 
  CheckCircle2, 
  ChevronDown, 
  LogOut, 
  Settings, 
  Shield, 
  FileText
} from 'lucide-react';

interface AdminProfile {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
}

export default function AdminHeader() {
  const router = useRouter();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          setProfile(data.user);
        }
        if (Array.isArray(data?.permissions)) {
          setPermissions(data.permissions);
        }
      })
      .catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const roleLabel = profile?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin';
  const roleBadgeStyle = profile?.role === 'SUPER_ADMIN'
    ? 'bg-purple-50 text-purple-700 border-purple-200'
    : 'bg-blue-50 text-blue-700 border-blue-200';

  return (
    <header className="bg-slate-900/60 backdrop-blur-2xl h-16 flex items-center justify-between px-6 border-b border-white/5 sticky top-0 z-20">
      {/* Search Command Bar */}
      <div className="flex-1 max-w-md">
        <div className="relative flex items-center group">
          <Search className="absolute left-3.5 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search orders, technicians, audit logs..."
            className="w-full bg-slate-950/50 hover:bg-slate-900/80 focus:bg-slate-900 border border-white/5 focus:border-blue-500/50 text-white placeholder-slate-500 text-xs rounded-xl pl-10 pr-12 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium tracking-wide"
          />
          <div className="absolute right-3 flex items-center pointer-events-none">
            <kbd className="text-[9px] font-mono font-bold tracking-widest text-slate-500 bg-white/5 border border-white/5 rounded px-1.5 py-0.5 group-focus-within:text-blue-400 transition-colors">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-4">
        {/* Environment Status Badge */}
        <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 bg-slate-950/50 text-slate-400 text-[11px] font-medium rounded-lg border border-white/5 shadow-inner">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
          <span className="text-slate-300 font-mono text-[10px] uppercase font-bold tracking-widest">PROD</span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400 font-semibold tracking-wide">Online</span>
        </div>

        <div className="h-5 w-px bg-white/10 hidden sm:block" />

        {/* User Identity Pill with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-expanded={dropdownOpen}
            className="flex items-center gap-3 p-1 sm:px-3 sm:py-1.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all cursor-pointer text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-900/30">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <div className="hidden md:block">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-wide">
                  {profile?.name || 'Administrator'}
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-widest">
                  {roleLabel}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                {profile?.phone || 'Authenticated Session'}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-500 hidden md:block transition-transform duration-200 ${dropdownOpen ? 'rotate-180 text-white' : 'group-hover:text-white'}`} />
          </button>

          {/* Profile & Security Flyout */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-72 bg-slate-900/95 backdrop-blur-3xl rounded-2xl shadow-2xl shadow-black/50 border border-white/10 py-2 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Account Meta */}
              <div className="px-4 py-3 border-b border-white/5">
                <p className="font-bold text-white tracking-wide text-xs">{profile?.name || 'Administrator'}</p>
                <p className="text-slate-400 font-mono text-[11px] mt-1">{profile?.phone || ''}</p>
                {profile?.email && (
                  <p className="text-slate-400 text-[11px] mt-0.5 truncate">{profile.email}</p>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-widest">
                    {roleLabel}
                  </span>
                  <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md font-bold tracking-widest flex items-center gap-1 uppercase">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </span>
                </div>
              </div>

              {/* Granted Permissions Summary */}
              <div className="px-4 py-3 border-b border-white/5 bg-slate-950/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-slate-500" />
                    Granted Scopes
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono font-bold">
                    {permissions.length} Scopes
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                  {permissions.length > 0 ? (
                    permissions.slice(0, 6).map((scope) => (
                      <span
                        key={scope}
                        className="text-[9px] font-mono px-2 py-0.5 bg-slate-800/80 border border-white/5 rounded-md text-slate-300 font-semibold tracking-wide"
                      >
                        {scope}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-500 font-medium">Default administrative access</span>
                  )}
                  {permissions.length > 6 && (
                    <span className="text-[9px] font-mono px-2 py-0.5 bg-slate-800/50 text-slate-400 rounded-md font-semibold tracking-wide">
                      +{permissions.length - 6} more
                    </span>
                  )}
                </div>
              </div>

              {/* Links */}
              <div className="py-1.5">
                <Link
                  href="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:text-white hover:bg-white/5 transition-colors font-medium tracking-wide"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  Account & System Settings
                </Link>
                <Link
                  href="/audit-logs"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:text-white hover:bg-white/5 transition-colors font-medium tracking-wide"
                >
                  <FileText className="w-4 h-4 text-slate-500" />
                  Audit Trail & Governance
                </Link>
              </div>

              {/* Sign out */}
              <div className="pt-1.5 pb-1 border-t border-white/5">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors text-left font-bold tracking-wide cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out Session
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
