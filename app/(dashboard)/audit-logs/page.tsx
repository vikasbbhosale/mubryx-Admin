"use client";

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  RefreshCw, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Filter,
  User,
  ArrowUpDown
} from 'lucide-react';

interface AuditItem {
  id: string;
  userId: string | null;
  userPhone: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  status: string;
  reason: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string | null;
    phone: string;
    role: string;
  } | null;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '30');
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load audit trail');
      const data = await res.json();
      setLogs(data.items || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err?.message || 'Error connecting to audit logs service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  // Filter logs locally by category tab
  const filteredLogs = logs.filter((log) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'AUTH') return log.resourceType === 'AUTH' || log.action.includes('OTP') || log.action.includes('LOGIN');
    if (filterType === 'TECHNICIAN') return log.resourceType === 'TECHNICIAN' || log.action.includes('TECH');
    if (filterType === 'CATALOG') return log.resourceType === 'CATALOG' || log.action.includes('SERVICE');
    if (filterType === 'BOOKING') return log.resourceType === 'BOOKING' || log.action.includes('BOOKING');
    return true;
  });

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Security & Governance Audit Trail</h1>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              Immutable Log
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative, sanitized record of administrative actions, identity verification decisions, and authentication requests.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md border border-slate-200 shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-slate-400' : 'text-slate-600'}`} />
          Refresh
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200/80">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'All Events' },
            { id: 'AUTH', label: 'Authentication' },
            { id: 'TECHNICIAN', label: 'Workforce & KYC' },
            { id: 'BOOKING', label: 'Orders & Dispatches' },
            { id: 'CATALOG', label: 'Catalog & Services' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                filterType === tab.id
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search action, phone, IP..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-xs rounded-md pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-md transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-lg border border-slate-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="space-y-1.5 w-1/3">
                  <div className="h-3 bg-slate-200 rounded w-3/4" />
                  <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                </div>
                <div className="h-3 bg-slate-200 rounded w-1/4" />
                <div className="h-3 bg-slate-200 rounded w-1/6" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-800">{error}</p>
            <button
              onClick={fetchLogs}
              className="mt-3 px-3 py-1 bg-slate-100 text-slate-700 text-xs rounded border border-slate-200 hover:bg-slate-200 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
            <p className="text-xs font-medium text-slate-600">No audit events match your filter</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Events are automatically captured when administrative actions take place</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-4">Event & Action</th>
                  <th className="py-2.5 px-4">Actor</th>
                  <th className="py-2.5 px-4">Resource</th>
                  <th className="py-2.5 px-4">Network / Client</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredLogs.map((log) => {
                  const isSuccess = log.status === 'SUCCESS';
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Event & Action */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-semibold text-slate-900 text-[11px]">
                          {log.action}
                        </div>
                        {log.reason && (
                          <div className="text-[10px] text-slate-400 mt-0.5 max-w-xs truncate">
                            {log.reason}
                          </div>
                        )}
                      </td>

                      {/* Actor */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">
                          {log.user?.name || 'Operator'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {log.userPhone || log.user?.phone || 'System'}
                        </div>
                      </td>

                      {/* Resource */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                          {log.resourceType}
                        </span>
                        {log.resourceId && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[120px]">
                            {log.resourceId}
                          </div>
                        )}
                      </td>

                      {/* Network & Client */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        <div>{log.ipAddress || '127.0.0.1'}</div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            isSuccess
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {isSuccess ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                          {log.status}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-4 text-right whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        <div>{new Date(log.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Summary */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-700">{filteredLogs.length}</span> of{' '}
            <span className="font-semibold text-slate-700">{total}</span> total captured events
          </div>
          {total > 30 && (
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2 py-1 border border-slate-200 rounded text-slate-600 disabled:opacity-40 hover:bg-white transition-colors"
              >
                Previous
              </button>
              <button
                disabled={page * 30 >= total}
                onClick={() => setPage((p) => p + 1)}
                className="px-2 py-1 border border-slate-200 rounded text-slate-600 disabled:opacity-40 hover:bg-white transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
