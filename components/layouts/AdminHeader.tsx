"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  User, 
  Search, 
  ShieldCheck, 
  ChevronDown, 
  LogOut, 
  Settings, 
  FileText,
  Activity,
  LifeBuoy
} from 'lucide-react';
import { CommandPalette } from '@/components/ui/CommandPalette';

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
  const pathname = usePathname();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          setProfile(data.user);
        }
      })
      .catch(() => {});
  }, []);

  // Global hotkey listener for Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

  // Format current breadcrumb
  const pathSegments = (pathname || '').split('/').filter(Boolean);
  const currentTitle =
    pathSegments.length === 0
      ? 'Operations Overview'
      : pathSegments[0].charAt(0).toUpperCase() + pathSegments[0].slice(1).replace(/-/g, ' ');

  return (
    <>
      <header className="bg-slate-900 h-14 flex items-center justify-between px-4 sm:px-6 border-b border-slate-800 sticky top-0 z-20 select-none">
        {/* Left: Breadcrumbs & Context */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Console</span>
          <span className="text-slate-700">/</span>
          <span className="text-slate-200 font-semibold tracking-wide">
            {currentTitle}
          </span>
        </div>

        {/* Center: Command Palette Trigger */}
        <div className="flex-1 max-w-sm mx-4">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="w-full flex items-center justify-between bg-slate-950 hover:bg-slate-950/80 border border-slate-800 text-slate-400 px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition-colors" />
              <span className="text-slate-400 text-xs">Search orders, technicians, actions...</span>
            </div>
            <kbd className="text-[10px] font-mono text-slate-500 bg-slate-900 border border-slate-700/80 rounded px-1.5 py-0.5">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-3">
          {/* Live Sync Badge */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 text-slate-400 text-[11px] font-mono rounded-md border border-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-semibold">LIVE</span>
          </div>

          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer focus:outline-none"
            >
              <div className="w-7 h-7 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                {profile?.name ? profile.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-xs font-semibold text-slate-200 leading-none truncate max-w-[120px]">
                  {profile?.name || 'Administrator'}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5 leading-none">
                  {profile?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden md:block" />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-1.5 text-xs text-slate-300 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3.5 py-2 border-b border-slate-800">
                  <p className="font-semibold text-white truncate">
                    {profile?.name || 'Admin User'}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                    {profile?.phone || 'No phone'}
                  </p>
                  <span className="inline-block mt-1.5 px-1.5 py-0.5 text-[9px] font-bold font-mono tracking-wider rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                    {profile?.role || 'ADMIN'}
                  </span>
                </div>

                <div className="py-1">
                  <Link
                    href="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-500" />
                    <span>System Settings</span>
                  </Link>
                  <Link
                    href="/audit-logs"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>Audit Logs</span>
                  </Link>
                  <Link
                    href="/support"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                  >
                    <LifeBuoy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Support Desk</span>
                  </Link>
                </div>

                <div className="border-t border-slate-800 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-rose-400 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </>
  );
}
