"use client";

import { useEffect, useState } from 'react';
import { User, Bell, Search, Activity } from 'lucide-react';

export default function AdminHeader() {
  const [adminName, setAdminName] = useState('System Admin');
  const [adminPhone, setAdminPhone] = useState('8080827726');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.fullName || user.name) {
          setAdminName(user.fullName || user.name);
        }
        if (user.phone) {
          setAdminPhone(user.phone);
        }
      } catch (e) {
        // ignore
      }
    }
  }, []);

  return (
    <header className="bg-white h-16 flex items-center justify-between px-6 border-b border-slate-200/80 shadow-xs z-10">
      {/* Search Bar */}
      <div className="flex-1 max-w-md">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Quick search across dashboard..."
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs font-medium rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all caret-blue-600"
          />
        </div>
      </div>

      {/* Right User Actions */}
      <div className="flex items-center space-x-4">
        {/* System Status Tag */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Backend Live</span>
        </div>

        {/* Notifications Icon */}
        <button 
          aria-label="View notifications"
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors relative cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />
        </button>

        <div className="h-6 w-px bg-slate-200" />

        {/* User Pill */}
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-600/20">
            <User className="w-5 h-5" />
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-bold text-slate-900 leading-tight">{adminName}</div>
            <div className="text-[11px] font-medium text-slate-500">{adminPhone}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
