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
  LifeBuoy,
  Sun,
  Moon,
  Laptop
} from 'lucide-react';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { useTheme } from '@/components/providers/ThemeProvider';

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
  const { theme, resolvedTheme, setTheme } = useTheme();
  
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

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

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(event.target as Node)) {
        setThemeDropdownOpen(false);
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
      <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs h-14 flex items-center justify-between px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 select-none transition-colors duration-150">
        {/* Left: Breadcrumbs & Context */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 dark:text-slate-500 font-medium">Console</span>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <span className="text-slate-800 dark:text-slate-200 font-semibold tracking-wide">
            {currentTitle}
          </span>
        </div>

        {/* Center: Command Palette Trigger */}
        <div className="flex-1 max-w-sm mx-4">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
              <span className="text-slate-500 dark:text-slate-400 text-xs">Search orders, technicians, actions...</span>
            </div>
            <kbd className="text-[10px] font-mono text-slate-500 dark:text-slate-500 bg-slate-200/60 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded px-1.5 py-0.5">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-2.5">
          {/* Live Sync Badge */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-[11px] font-mono rounded-md border border-slate-200 dark:border-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">LIVE</span>
          </div>

          {/* Theme Selector Toggle */}
          <div className="relative" ref={themeRef}>
            <button
              onClick={() => setThemeDropdownOpen((prev) => !prev)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title={`Current Theme: ${theme}`}
              aria-label="Toggle visual theme"
            >
              {resolvedTheme === 'dark' ? (
                <Moon className="w-4 h-4 text-indigo-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
            </button>

            {themeDropdownOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 text-xs text-slate-700 dark:text-slate-300 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => { setTheme('light'); setThemeDropdownOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors cursor-pointer ${
                    theme === 'light' ? 'font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Light Mode</span>
                </button>
                <button
                  onClick={() => { setTheme('dark'); setThemeDropdownOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors cursor-pointer ${
                    theme === 'dark' ? 'font-bold text-blue-400 bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Dark Mode</span>
                </button>
                <button
                  onClick={() => { setTheme('system'); setThemeDropdownOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors cursor-pointer ${
                    theme === 'system' ? 'font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5 text-slate-400" />
                  <span>System Auto</span>
                </button>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus:outline-none"
            >
              <div className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                {profile?.name ? profile.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-none truncate max-w-[120px]">
                  {profile?.name || 'Administrator'}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 leading-none">
                  {profile?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 text-xs text-slate-700 dark:text-slate-300 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="font-semibold text-slate-900 dark:text-white truncate">
                    {profile?.name || 'Admin User'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5">
                    {profile?.phone || 'No phone'}
                  </p>
                  <span className="inline-block mt-1.5 px-1.5 py-0.5 text-[9px] font-bold font-mono tracking-wider rounded bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 uppercase">
                    {profile?.role || 'ADMIN'}
                  </span>
                </div>

                <div className="py-1">
                  <Link
                    href="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>System Settings</span>
                  </Link>
                  <Link
                    href="/audit-logs"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>Audit Logs</span>
                  </Link>
                  <Link
                    href="/support"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <LifeBuoy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Support Desk</span>
                  </Link>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
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
