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
    <header className="bg-white h-14 flex items-center justify-between px-6 border-b border-slate-200/80 sticky top-0 z-20">
      {/* Search Command Bar */}
      <div className="flex-1 max-w-md">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search orders, technicians, audit logs..."
            className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200/90 text-slate-800 placeholder-slate-400 text-xs rounded-lg pl-8 pr-12 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 transition-all font-normal"
          />
          <div className="absolute right-2.5 flex items-center pointer-events-none">
            <kbd className="text-[10px] font-mono text-slate-400 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* Environment Status Badge */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-600 text-[11px] font-medium rounded-md border border-slate-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider">PROD</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-600">Online</span>
        </div>

        <div className="h-4 w-px bg-slate-200 hidden sm:block" />

        {/* User Identity Pill with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-expanded={dropdownOpen}
            className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200/80 transition-colors cursor-pointer text-left"
          >
            <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center font-semibold text-xs flex-shrink-0">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
            </div>
            <div className="hidden md:block">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-900 leading-none">
                  {profile?.name || 'Administrator'}
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${roleBadgeStyle}`}>
                  {roleLabel}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                {profile?.phone || 'Authenticated'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
          </button>

          {/* Profile & Security Flyout */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
              {/* Account Meta */}
              <div className="px-3.5 py-2.5 border-b border-slate-100">
                <p className="font-semibold text-slate-900 text-xs">{profile?.name || 'Administrator'}</p>
                <p className="text-slate-500 font-mono text-[11px] mt-0.5">{profile?.phone || ''}</p>
                {profile?.email && (
                  <p className="text-slate-500 text-[11px] truncate">{profile.email}</p>
                )}
                <div className="flex items-center gap-1.5 mt-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${roleBadgeStyle}`}>
                    {roleLabel}
                  </span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Session Verified
                  </span>
                </div>
              </div>

              {/* Granted Permissions Summary */}
              <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/60">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Shield className="w-3 h-3 text-slate-400" />
                    Granted Scopes
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono font-medium">
                    {permissions.length} Scopes
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                  {permissions.length > 0 ? (
                    permissions.slice(0, 6).map((scope) => (
                      <span
                        key={scope}
                        className="text-[9px] font-mono px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600"
                      >
                        {scope}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-400">Default administrative access</span>
                  )}
                  {permissions.length > 6 && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">
                      +{permissions.length - 6} more
                    </span>
                  )}
                </div>
              </div>

              {/* Links */}
              <div className="py-1">
                <Link
                  href="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  Account & System Settings
                </Link>
                <Link
                  href="/audit-logs"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Audit Trail & Governance
                </Link>
              </div>

              {/* Sign out */}
              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-rose-600 hover:bg-rose-50/80 transition-colors text-left font-medium cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
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
