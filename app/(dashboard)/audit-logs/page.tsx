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
  ArrowUpDown,
  Eye,
  Terminal,
  Globe,
  Loader2
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CaseDrawer } from '@/components/ui/CaseDrawer';

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
  const [selectedLog, setSelectedLog] = useState<AuditItem | null>(null);

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
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-white">Security & Governance Audit Trail</h1>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Immutable Write-Ahead Log
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Authoritative, sanitized record of administrative actions, identity verification decisions, and authentication requests.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded border border-slate-800 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-slate-500' : 'text-slate-400'}`} />
          Refresh
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 text-xs">
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
              className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap transition-colors cursor-pointer ${
                filterType === tab.id
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search action, phone, IP..."
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs rounded pl-8 pr-3 py-1.5 focus:outline-none focus:border-slate-700"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-colors cursor-pointer"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Main Table Content */}
      <div className="bg-slate-900/60 rounded-lg border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-16 flex items-center justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-200">{error}</p>
            <button
              onClick={fetchLogs}
              className="mt-3 px-3 py-1 bg-slate-800 text-slate-300 text-xs rounded border border-slate-700 hover:bg-slate-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-500" />
            <p className="text-xs font-medium text-slate-300">No audit events match your filter</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Events are automatically captured when administrative actions take place</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-4">Event & Action</th>
                  <th className="py-2.5 px-4">Actor</th>
                  <th className="py-2.5 px-4">Resource Scope</th>
                  <th className="py-2.5 px-4">Network Client</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Timestamp</th>
                  <th className="py-2.5 px-4 text-right">Inspection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredLogs.map((log) => {
                  const isSuccess = log.status === 'SUCCESS';
                  return (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Event & Action */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-semibold text-white text-[11px]">
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
                        <div className="font-medium text-slate-200">
                          {log.user?.name || 'Authorized Operator'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {log.userPhone || log.user?.phone || 'System Core'}
                        </div>
                      </td>

                      {/* Resource */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                          {log.resourceType}
                        </span>
                        {log.resourceId && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[130px]">
                            {log.resourceId}
                          </div>
                        )}
                      </td>

                      {/* Network & Client */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        <div>{log.ipAddress || '127.0.0.1'}</div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <StatusBadge status={isSuccess ? 'CONFIRMED' : 'CANCELLED'} />
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-4 text-right whitespace-nowrap text-slate-400 font-mono text-[11px]">
                        <div>{new Date(log.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Summary */}
        <div className="px-4 py-2.5 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-slate-200">{filteredLogs.length}</span> of{' '}
            <span className="font-semibold text-slate-200">{total}</span> recorded events
          </div>
          {total > 30 && (
            <div className="flex gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2 py-1 border border-slate-800 rounded text-slate-300 disabled:opacity-30 hover:bg-slate-800 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={page * 30 >= total}
                onClick={() => setPage((p) => p + 1)}
                className="px-2 py-1 border border-slate-800 rounded text-slate-300 disabled:opacity-30 hover:bg-slate-800 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Audit Detail CaseDrawer */}
      <CaseDrawer
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title="Audit Event Dossier"
        subtitle={`Action: ${selectedLog?.action || ''}`}
        status={selectedLog?.status}
      >
        {selectedLog && (
          <div className="space-y-4 text-xs font-mono">
            {/* Event Header Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-1.5 font-sans">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Security Action</div>
              <div className="font-mono text-sm font-bold text-white">{selectedLog.action}</div>
              {selectedLog.reason && (
                <div className="text-slate-300 text-xs bg-slate-950 p-2 rounded border border-slate-800 mt-1">
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Operator Justification:</span>
                  {selectedLog.reason}
                </div>
              )}
            </div>

            {/* Actor & Client Dossier */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2">
              <div className="text-[11px] font-sans font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" />
                Actor Identity & Environment
              </div>
              <div className="space-y-1 pt-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Operator:</span>
                  <span className="text-slate-200">{selectedLog.user?.name || 'Administrator'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Phone / ID:</span>
                  <span className="text-slate-300">{selectedLog.userPhone || selectedLog.userId || 'System'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Source IP:</span>
                  <span className="text-blue-400 font-bold">{selectedLog.ipAddress || '127.0.0.1'}</span>
                </div>
                {selectedLog.userAgent && (
                  <div className="pt-1 border-t border-slate-800">
                    <span className="text-slate-500 font-sans block">Client User Agent:</span>
                    <span className="text-slate-400 text-[10px] truncate block" title={selectedLog.userAgent}>
                      {selectedLog.userAgent}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Target Resource */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2">
              <div className="text-[11px] font-sans font-semibold text-slate-400 uppercase tracking-wider">
                Target Resource Scope
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500 font-sans">Resource Domain:</span>
                <span className="text-indigo-400 font-bold">{selectedLog.resourceType}</span>
              </div>
              {selectedLog.resourceId && (
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500 font-sans">Target Resource ID:</span>
                  <span className="text-slate-200 select-all">{selectedLog.resourceId}</span>
                </div>
              )}
            </div>

            {/* Raw JSON Payload / Diff */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-sans font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-500" />
                Raw Event Payload Details
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 overflow-x-auto text-[11px] text-slate-300 max-h-60 custom-scrollbar">
                <pre>{JSON.stringify(selectedLog.details, null, 2)}</pre>
              </div>
            </div>
          </div>
        )}
      </CaseDrawer>
    </div>
  );
}
