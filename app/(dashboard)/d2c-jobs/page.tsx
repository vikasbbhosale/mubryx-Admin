"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Wrench,
  PlusCircle,
  Search,
  Filter,
  RefreshCw,
  UserCheck,
  Clock,
  AlertTriangle,
  ArrowRightLeft,
  Calendar,
  FileCheck,
  History,
  Flame,
  Download,
  Copy,
  Check,
  Eye,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { D2cJob, D2cMetrics, D2cApi, formatStandardDocFilename } from '@/lib/d2c-api';
import D2cJobDetailsDrawer from '@/components/d2c-jobs/D2cJobDetailsDrawer';
import D2cCreateJobModal from '@/components/d2c-jobs/D2cCreateJobModal';
import D2cAssignModal from '@/components/d2c-jobs/D2cAssignModal';
import D2cApprovalActionModal from '@/components/d2c-jobs/D2cApprovalActionModal';
import D2cConfirmCrmCancellationModal from '@/components/d2c-jobs/D2cConfirmCrmCancellationModal';
import D2cRevokeCancellationModal from '@/components/d2c-jobs/D2cRevokeCancellationModal';

type WorkspaceTab =
  | 'JOBS'
  | 'ASSIGNMENT_BOARD'
  | 'APPROVAL_QUEUE'
  | 'CANCELLATION_TRACKER'
  | 'COMPLETED_DOCS'
  | 'AUDIT_TRAIL';

function D2cJobsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Active workspace tab
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('JOBS');

  // Summary Metrics
  const [metrics, setMetrics] = useState<D2cMetrics>({
    total: 0,
    unassigned: 0,
    assigned: 0,
    inProgress: 0,
    approvalPending: 0,
    cancellationPending: 0,
    crmConfirmed: 0,
    completed: 0,
    highPriority: 0,
  });

  // Table Data State
  const [jobs, setJobs] = useState<D2cJob[]>([]);

  // Memoized active / pending jobs (strictly excludes COMPLETED, CANCELLED, and active cancellation tickets)
  // Enterprise Priority Ranking: High Priority jobs are always ranked at the top
  const pendingJobs = useMemo(
    () =>
      jobs
        .filter(
          (j) =>
            j.status !== 'COMPLETED' &&
            j.status !== 'CANCELLED' &&
            (!j.cancellationStatus || j.cancellationStatus === 'NONE'),
        )
        .sort((a, b) => {
          const aHigh = a.isHighPriority ? 1 : 0;
          const bHigh = b.isHighPriority ? 1 : 0;
          if (bHigh !== aHigh) return bHigh - aHigh;
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }),
    [jobs],
  );

  // Memoized unassigned and currently assigned leads (excluding cancellations)
  const unassignedLeads = useMemo(
    () =>
      jobs
        .filter(
          (j) =>
            j.status === 'PENDING_ASSIGNMENT' &&
            (!j.cancellationStatus || j.cancellationStatus === 'NONE'),
        )
        .sort((a, b) => {
          const aHigh = a.isHighPriority ? 1 : 0;
          const bHigh = b.isHighPriority ? 1 : 0;
          if (bHigh !== aHigh) return bHigh - aHigh;
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }),
    [jobs],
  );

  const assignedLeads = useMemo(
    () =>
      jobs
        .filter(
          (j) =>
            j.status !== 'PENDING_ASSIGNMENT' &&
            j.status !== 'COMPLETED' &&
            j.status !== 'CANCELLED' &&
            (!j.cancellationStatus || j.cancellationStatus === 'NONE'),
        )
        .sort((a, b) => {
          const aHigh = a.isHighPriority ? 1 : 0;
          const bHigh = b.isHighPriority ? 1 : 0;
          if (bHigh !== aHigh) return bHigh - aHigh;
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }),
    [jobs],
  );
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [brandFilter, setBrandFilter] = useState('ALL');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Queues & Secondary data states
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loadingApprovals, setLoadingApprovals] = useState(false);
  const [approvalTypeFilter, setApprovalTypeFilter] = useState<
    'ALL' | 'REASSIGN_REQUEST' | 'CANCELLATION_REQUEST' | 'NEXT_DAY_APPOINTMENT'
  >('ALL');

  const transferCount = useMemo(
    () => approvals.filter((a) => a.requestType === 'REASSIGN_REQUEST').length,
    [approvals],
  );
  const cancellationReqCount = useMemo(
    () => approvals.filter((a) => a.requestType === 'CANCELLATION_REQUEST').length,
    [approvals],
  );
  const rescheduleCount = useMemo(
    () => approvals.filter((a) => a.requestType === 'NEXT_DAY_APPOINTMENT').length,
    [approvals],
  );

  const filteredApprovals = useMemo(() => {
    if (approvalTypeFilter === 'ALL') return approvals;
    return approvals.filter((a) => a.requestType === approvalTypeFilter);
  }, [approvals, approvalTypeFilter]);

  const [cancellations, setCancellations] = useState<any[]>([]);
  const [loadingCancellations, setLoadingCancellations] = useState(false);
  const [completedJobs, setCompletedJobs] = useState<any[]>([]);
  const [loadingCompleted, setLoadingCompleted] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Modals & Drawers
  const [selectedJob, setSelectedJob] = useState<D2cJob | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isReassignMode, setIsReassignMode] = useState(false);
  const [approvalModalState, setApprovalModalState] = useState<{
    isOpen: boolean;
    request: any | null;
    actionType: 'APPROVE' | 'REJECT';
  }>({ isOpen: false, request: null, actionType: 'APPROVE' });
  const [confirmCrmJob, setConfirmCrmJob] = useState<D2cJob | null>(null);
  const [revokeJob, setRevokeJob] = useState<D2cJob | null>(null);

  // Sync tab from URL query params (?tab=create, ?tab=approvals, etc.)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'create') {
      setIsCreateModalOpen(true);
      setActiveTab('JOBS');
    } else if (tabParam === 'assignments') {
      setActiveTab('ASSIGNMENT_BOARD');
    } else if (tabParam === 'approvals') {
      setActiveTab('APPROVAL_QUEUE');
    } else if (tabParam === 'cancellations') {
      setActiveTab('CANCELLATION_TRACKER');
    } else if (tabParam === 'documents') {
      setActiveTab('COMPLETED_DOCS');
    } else if (tabParam === 'audit') {
      setActiveTab('AUDIT_TRAIL');
    }
  }, [searchParams]);

  // Unified Enterprise Workspace Batch State
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isInitializedRef = React.useRef(false);

  // Load complete workspace snapshot in ONE single high-speed round-trip
  const loadWorkspaceBatch = useCallback(async (forceRefresh = false) => {
    try {
      setIsRefreshing(true);
      const batch = await D2cApi.getWorkspaceBatch({ page, limit: 25, forceRefresh });
      if (batch) {
        if (batch.metrics) setMetrics(batch.metrics);
        if (batch.jobs) {
          setJobs(batch.jobs.items || []);
          setTotalCount(batch.jobs.total || 0);
          setTotalPages(batch.jobs.totalPages || 1);
        }
        if (batch.approvals) setApprovals(batch.approvals.items || []);
        if (batch.cancellations) setCancellations(batch.cancellations.items || []);
        if (batch.completed) setCompletedJobs(batch.completed.items || []);
        if (batch.auditLogs) setAuditLogs(batch.auditLogs || []);
      }
    } catch (e) {
      console.error('Workspace batch load error:', e);
    } finally {
      setIsRefreshing(false);
      isInitializedRef.current = true;
    }
  }, [page]);

  // Initial Workspace Hydration (Sub-100ms with cached data)
  useEffect(() => {
    if (!isInitializedRef.current) {
      loadWorkspaceBatch(false);
    }
  }, [loadWorkspaceBatch]);

  // Filter-specific querying for Jobs & Assignment Board tabs
  const fetchFilteredJobs = useCallback(async () => {
    if (!isInitializedRef.current) return;
    try {
      setLoadingJobs(true);
      const params: Record<string, any> = {
        page,
        limit: 25,
        search: search.trim() || undefined,
        brand: brandFilter !== 'ALL' ? brandFilter : undefined,
        city: cityFilter !== 'ALL' ? cityFilter : undefined,
      };

      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }

      if (priorityFilter === 'HIGH') {
        params.isHighPriority = true;
      }

      if (activeTab === 'JOBS') {
        params.pendingOnly = true;
      }

      const res = await D2cApi.getJobs(params);
      setJobs(res.items);
      setTotalPages(res.totalPages);
      setTotalCount(res.total);
    } catch {
      // Fallback
    } finally {
      setLoadingJobs(false);
    }
  }, [page, search, statusFilter, brandFilter, cityFilter, priorityFilter, activeTab]);

  // When filters change, update jobs list
  useEffect(() => {
    if (isInitializedRef.current && (activeTab === 'JOBS' || activeTab === 'ASSIGNMENT_BOARD')) {
      fetchFilteredJobs();
    }
  }, [fetchFilteredJobs, activeTab]);

  // Dedicated secondary tab refreshers (only on manual request)
  const fetchApprovals = useCallback(async () => {
    try {
      setLoadingApprovals(true);
      const res = await D2cApi.getApprovalRequests({ status: 'PENDING_REVIEW' as any });
      setApprovals(res?.data || []);
    } catch {} finally {
      setLoadingApprovals(false);
    }
  }, []);

  const fetchCancellations = useCallback(async () => {
    try {
      setLoadingCancellations(true);
      const res = await D2cApi.getCancellations({});
      setCancellations(res?.data || []);
    } catch {} finally {
      setLoadingCancellations(false);
    }
  }, []);

  const fetchCompleted = useCallback(async () => {
    try {
      setLoadingCompleted(true);
      const res = await D2cApi.getCompletedJobs({});
      setCompletedJobs(res?.data || []);
    } catch {} finally {
      setLoadingCompleted(false);
    }
  }, []);

  const fetchAudit = useCallback(async () => {
    try {
      setLoadingAudit(true);
      const res = await D2cApi.getAuditLogs({ limit: 40 });
      setAuditLogs(res?.data || []);
    } catch {} finally {
      setLoadingAudit(false);
    }
  }, []);

  const handleOpenDrawer = async (job: D2cJob) => {
    try {
      const full = await D2cApi.getJobById(job.id);
      setSelectedJob(full || job);
    } catch {
      setSelectedJob(job);
    }
    setIsDrawerOpen(true);
  };

  const handleTogglePriority = async (job: D2cJob) => {
    try {
      await D2cApi.updatePriority(job.id, !job.isHighPriority, 'Toggled from admin console');
      loadWorkspaceBatch(true);
      if (selectedJob?.id === job.id) {
        setSelectedJob({ ...selectedJob, isHighPriority: !job.isHighPriority });
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to update priority');
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; bg: string; text: string; border: string }> = {
      PENDING_ASSIGNMENT: { label: 'Unassigned', bg: 'bg-slate-500/10', text: 'text-slate-700 dark:text-slate-400', border: 'border-slate-500/20' },
      ASSIGNED: { label: 'Assigned', bg: 'bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-500/20' },
      ACKNOWLEDGED: { label: 'Acknowledged', bg: 'bg-indigo-500/10', text: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-500/20' },
      IN_PROGRESS: { label: 'In Progress', bg: 'bg-purple-500/10', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-500/20' },
      ON_THE_WAY: { label: 'On The Way', bg: 'bg-purple-500/10', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-500/20' },
      ARRIVED: { label: 'Arrived', bg: 'bg-purple-500/10', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-500/20' },
      APPROVAL_PENDING: { label: 'Approval Pending', bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-500/20' },
      CANCELLATION_PENDING: { label: 'Cancellation Pending', bg: 'bg-orange-500/10', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-500/20' },
      CRM_CONFIRMED: { label: 'CRM Confirmed', bg: 'bg-rose-500/10', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-500/20' },
      COMPLETED: { label: 'Completed', bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-500/20' },
      CANCELLED: { label: 'Cancelled', bg: 'bg-rose-500/10', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-500/20' },
    };
    const s = map[status] || { label: status, bg: 'bg-slate-500/10', text: 'text-slate-700 dark:text-slate-400', border: 'border-slate-500/20' };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${s.bg} ${s.text} ${s.border}`}>
        {s.label}
      </span>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 md:p-6 space-y-5">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                D2C Operations Console
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Authoritative external CRM inquiry registration, exclusive technician assignment, and approval workflows.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadWorkspaceBatch(true)}
            disabled={isRefreshing}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer shadow-xs disabled:opacity-50"
            title={isRefreshing ? "Syncing Operations..." : "Refresh Operations Batch"}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" /> Register D2C Job
          </button>
        </div>
      </div>

      {/* Workspace Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-0 overflow-x-auto">
        <div className="flex space-x-1">
          {[
            { key: 'JOBS', label: 'Pending Jobs', icon: Wrench, count: pendingJobs.length },
            { key: 'ASSIGNMENT_BOARD', label: 'Assignment Board', icon: UserCheck, count: unassignedLeads.length },
            { key: 'APPROVAL_QUEUE', label: 'Approval Queue', icon: Clock, count: approvals.length, highlight: approvals.length > 0 },
            { key: 'CANCELLATION_TRACKER', label: 'Cancellation Tracker', icon: AlertTriangle, count: cancellations.length },
            { key: 'COMPLETED_DOCS', label: 'Completed & Docs', icon: FileCheck, count: completedJobs.length },
            { key: 'AUDIT_TRAIL', label: 'D2C Audit Trail', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key as WorkspaceTab);
                }}
                className={`flex items-center gap-2 py-2.5 px-3.5 text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      tab.highlight
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                        : isActive
                        ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: All D2C Jobs & Searchable Table */}
      {activeTab === 'JOBS' && (
        <div className="space-y-3.5">
          {/* Filters Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by inquiry code, customer, phone, brand, model..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium cursor-pointer"
              >
                <option value="ALL">All Active Statuses</option>
                <option value="PENDING_ASSIGNMENT">Unassigned</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="ACKNOWLEDGED">Acknowledged</option>
                <option value="IN_PROGRESS">In Progress</option>
              </select>

              {/* Brand Filter */}
              <select
                value={brandFilter}
                onChange={(e) => {
                  setBrandFilter(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium cursor-pointer"
              >
                <option value="ALL">All Brands</option>
                <option value="LG">LG</option>
                <option value="SAMSUNG">Samsung</option>
                <option value="VOLTAS">Voltas</option>
                <option value="DAIKIN">Daikin</option>
                <option value="WHIRLPOOL">Whirlpool</option>
              </select>

              {/* City Filter */}
              <select
                value={cityFilter}
                onChange={(e) => {
                  setCityFilter(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium cursor-pointer"
              >
                <option value="ALL">All Cities</option>
                <option value="AHMEDABAD">Ahmedabad</option>
                <option value="GANDHINAGAR">Gandhinagar</option>
                <option value="MUMBAI">Mumbai</option>
                <option value="CHENNAI">Chennai</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">
                Showing {pendingJobs.length} active records
              </span>
              {(statusFilter !== 'ALL' || brandFilter !== 'ALL' || cityFilter !== 'ALL' || priorityFilter !== 'ALL' || search) && (
                <button
                  onClick={() => {
                    setStatusFilter('ALL');
                    setBrandFilter('ALL');
                    setCityFilter('ALL');
                    setPriorityFilter('ALL');
                    setSearch('');
                    setPage(1);
                  }}
                  className="px-2.5 py-1 rounded text-xs text-blue-500 hover:underline cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Jobs Data Table */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/90 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-3.5">Priority</th>
                    <th className="py-3 px-3.5">Inquiry Code</th>
                    <th className="py-3 px-3.5">Brand / Appliance</th>
                    <th className="py-3 px-3.5">Customer & Phone</th>
                    <th className="py-3 px-3.5">Location</th>
                    <th className="py-3 px-3.5">Current Technician</th>
                    <th className="py-3 px-3.5">Status</th>
                    <th className="py-3 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {loadingJobs ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" />
                        <span>Querying registered D2C jobs...</span>
                      </td>
                    </tr>
                  ) : pendingJobs.length > 0 ? (
                    pendingJobs.map((job) => {
                      const hasPendingReq = job.approvalRequests && job.approvalRequests.length > 0;

                      return (
                        <tr
                          key={job.id}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer ${
                            job.isHighPriority ? 'bg-rose-500/5 dark:bg-rose-950/10' : ''
                          }`}
                          onClick={() => handleOpenDrawer(job)}
                        >
                          {/* Priority */}
                          <td className="py-3 px-3.5" onClick={(e) => e.stopPropagation()}>
                            {job.isHighPriority ? (
                              <button
                                onClick={() => handleTogglePriority(job)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 font-bold text-[10px] cursor-pointer hover:bg-rose-500/25"
                                title={job.priorityReason || 'High Priority'}
                              >
                                <Flame className="w-3 h-3 text-rose-600 dark:text-rose-400" /> High Risk
                              </button>
                            ) : (
                              <button
                                onClick={() => handleTogglePriority(job)}
                                className="text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 text-[10px] font-medium cursor-pointer"
                                title="Mark High Priority"
                              >
                                Standard
                              </button>
                            )}
                          </td>

                          {/* Inquiry Code */}
                          <td className="py-3 px-3.5 font-mono font-bold text-slate-900 dark:text-white">
                            <span className="hover:underline">{job.inquiryCode}</span>
                            <span className="block text-[10px] text-slate-400 font-normal">
                              {job.jobTicketNumber}
                            </span>
                          </td>

                          {/* Brand & Appliance */}
                          <td className="py-3 px-3.5">
                            <span className="font-semibold text-slate-900 dark:text-slate-200 block">
                              {job.brandName}
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              {job.applianceCategory} {job.modelNumber ? `• ${job.modelNumber}` : ''}
                            </span>
                          </td>

                          {/* Customer & Phone */}
                          <td className="py-3 px-3.5">
                            <span className="font-medium text-slate-900 dark:text-slate-200 block">
                              {job.customerName}
                            </span>
                            <span className="text-slate-400 font-mono text-[11px] block">
                              {job.customerPhone}
                            </span>
                          </td>

                          {/* Location */}
                          <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300">
                            <span>{job.city}</span>
                            <span className="block text-slate-400 font-mono text-[10px]">
                              PIN: {job.pinCode}
                            </span>
                          </td>

                          {/* Current Technician */}
                          <td className="py-3 px-3.5">
                            {job.assignedTechnician ? (
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    job.assignedTechnician.isOnline ? 'bg-emerald-400' : 'bg-slate-500'
                                  }`}
                                />
                                <span className="font-medium text-slate-900 dark:text-slate-200">
                                  {job.assignedTechnician.fullName}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Unassigned</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3.5">
                            <div className="flex flex-col gap-1 items-start">
                              {getStatusBadge(job.status)}
                              {hasPendingReq && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                  Pending Req
                                </span>
                              )}
                              {job.cancellationStatus !== 'NONE' && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/20">
                                  {job.cancellationStatus}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {job.assignedTechnician ? (
                                <button
                                  onClick={() => {
                                    setSelectedJob(job);
                                    setIsReassignMode(true);
                                    setIsAssignModalOpen(true);
                                  }}
                                  className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[11px] transition cursor-pointer"
                                >
                                  Reassign
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedJob(job);
                                    setIsReassignMode(false);
                                    setIsAssignModalOpen(true);
                                  }}
                                  className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] transition cursor-pointer"
                                >
                                  Assign
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenDrawer(job)}
                                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No D2C jobs found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
                <span>Page {page} of {totalPages}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Assignment Board */}
      {activeTab === 'ASSIGNMENT_BOARD' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Workforce Assignment Workspace
            </h2>
            <p className="text-xs text-slate-400">
              Review unassigned D2C leads and quickly dispatch them to qualified, active field technicians.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Unassigned Leads Column */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <span className="font-bold text-slate-900 dark:text-white text-xs flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span>Unassigned Leads ({unassignedLeads.length})</span>
                <span className="text-[10px] text-slate-400">Requires Dispatch</span>
              </span>

              <div className="space-y-2.5 max-h-[600px] overflow-y-auto custom-scrollbar">
                {unassignedLeads.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
                    No unassigned leads awaiting dispatch
                  </div>
                ) : (
                  unassignedLeads.map((j) => (
                    <div
                      key={j.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 transition flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">{j.inquiryCode}</span>
                          {j.isHighPriority && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30">HIGH</span>
                          )}
                        </div>
                        <span className="text-xs text-slate-600 dark:text-slate-300 block font-medium">{j.customerName} • {j.brandName}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{j.city} (PIN: {j.pinCode})</span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedJob(j);
                          setIsReassignMode(false);
                          setIsAssignModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer transition shadow-xs"
                      >
                        Assign Now
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Assigned Active Leads Column */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <span className="font-bold text-slate-900 dark:text-white text-xs flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span>Currently Assigned ({assignedLeads.length})</span>
                <span className="text-[10px] text-slate-400">Dispatched Leads</span>
              </span>

              <div className="space-y-2.5 max-h-[600px] overflow-y-auto custom-scrollbar">
                {assignedLeads.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
                    No active dispatched leads
                  </div>
                ) : (
                  assignedLeads.map((j) => (
                    <div
                      key={j.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 transition flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-900 dark:text-white block">{j.inquiryCode}</span>
                          {j.isHighPriority && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30">HIGH</span>
                          )}
                        </div>
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium block">{j.customerName}</span>
                        <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold block">
                          Assigned: {j.assignedTechnician?.fullName || 'Technician'} ({j.city})
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedJob(j);
                          setIsReassignMode(true);
                          setIsAssignModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs cursor-pointer transition shadow-xs"
                      >
                        Reassign
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Approval Queue */}
      {activeTab === 'APPROVAL_QUEUE' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Technician Approval Review Queue
              </h2>
              <p className="text-xs text-slate-400">
                All requests submitted by field engineers (job transfers, cancellations, and reschedules) awaiting review & decision.
              </p>
            </div>
            <button
              onClick={fetchApprovals}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs flex items-center gap-1.5 cursor-pointer transition self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Queue
            </button>
          </div>

          {/* Sub-Filter Tabs for Approval Types */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setApprovalTypeFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 shrink-0 ${
                approvalTypeFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              All Requests <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-mono">{approvals.length}</span>
            </button>
            <button
              onClick={() => setApprovalTypeFilter('REASSIGN_REQUEST')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 shrink-0 ${
                approvalTypeFilter === 'REASSIGN_REQUEST'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <ArrowRightLeft className="w-3 h-3 text-blue-500" />
              Job Transfers <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-400 font-mono">{transferCount}</span>
            </button>
            <button
              onClick={() => setApprovalTypeFilter('CANCELLATION_REQUEST')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 shrink-0 ${
                approvalTypeFilter === 'CANCELLATION_REQUEST'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-rose-500" />
              Cancellations <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-400 font-mono">{cancellationReqCount}</span>
            </button>
            <button
              onClick={() => setApprovalTypeFilter('NEXT_DAY_APPOINTMENT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 shrink-0 ${
                approvalTypeFilter === 'NEXT_DAY_APPOINTMENT'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-3 h-3 text-amber-500" />
              Reschedules <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 font-mono">{rescheduleCount}</span>
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            {loadingApprovals ? (
              <div className="py-16 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" />
                <span>Loading approval requests...</span>
              </div>
            ) : filteredApprovals.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredApprovals.map((req) => {
                  const isCancel = req.requestType === 'CANCELLATION_REQUEST';
                  const isTransfer = req.requestType === 'REASSIGN_REQUEST';
                  const isReschedule = req.requestType === 'NEXT_DAY_APPOINTMENT';

                  return (
                    <div
                      key={req.id}
                      className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                        isCancel ? 'bg-rose-500/[0.02] hover:bg-rose-500/[0.04]' : 'hover:bg-slate-50 dark:hover:bg-slate-800/20'
                      }`}
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider flex items-center gap-1 ${
                              isCancel
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                : isTransfer
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            }`}
                          >
                            {isCancel && <AlertTriangle className="w-3 h-3" />}
                            {isTransfer && <ArrowRightLeft className="w-3 h-3" />}
                            {isReschedule && <Calendar className="w-3 h-3" />}
                            {isCancel
                              ? 'Cancellation Request'
                              : isTransfer
                              ? 'Job Transfer Request'
                              : 'Reschedule Request'}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                            Ticket #{req.job?.inquiryCode || req.job?.jobTicketNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(req.submittedAt).toLocaleString()}
                          </span>
                        </div>

                        {/* Structured Reason */}
                        {req.reason && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-400 text-[11px] font-semibold uppercase">Reason:</span>
                            <span className="font-semibold text-slate-900 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700/60">
                              {req.reason}
                            </span>
                          </div>
                        )}

                        {/* Technician Remark */}
                        <p className="text-xs text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/50">
                          <strong className="text-slate-900 dark:text-white">Technician Remark:</strong> "{req.technicianRemark}"
                        </p>

                        {/* Reschedule proposed date & slot */}
                        {req.proposedDate && (
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md w-fit">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              Requested Appointment: {new Date(req.proposedDate).toLocaleDateString()} • Slot: {req.proposedTimeSlot || 'Standard Slot'}
                            </span>
                          </div>
                        )}

                        {/* Technician & Customer summary */}
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>
                            Technician: <strong className="text-slate-700 dark:text-slate-200">{req.technician?.fullName}</strong> ({req.technician?.user?.phone || 'No phone'})
                          </span>
                          <span>•</span>
                          <span>
                            Customer: <strong className="text-slate-700 dark:text-slate-200">{req.job?.customerName}</strong> ({req.job?.customerPhone})
                          </span>
                          <span>•</span>
                          <span>
                            City: <strong className="text-slate-700 dark:text-slate-200">{req.job?.city}</strong>
                          </span>
                          {req.job?.brandName && (
                            <>
                              <span>•</span>
                              <span>
                                Brand: <strong className="text-slate-700 dark:text-slate-200">{req.job.brandName}</strong>
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {req.job && (
                          <button
                            onClick={() => {
                              setSelectedJob(req.job);
                              setIsDrawerOpen(true);
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium cursor-pointer transition flex items-center gap-1"
                            title="View Job Details"
                          >
                            <Eye className="w-3.5 h-3.5" /> Details
                          </button>
                        )}
                        <button
                          onClick={() =>
                            setApprovalModalState({
                              isOpen: true,
                              request: req,
                              actionType: 'APPROVE',
                            })
                          }
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() =>
                            setApprovalModalState({
                              isOpen: true,
                              request: req,
                              actionType: 'REJECT',
                            })
                          }
                          className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition shadow-xs"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400">
                {approvalTypeFilter === 'ALL'
                  ? 'No pending approval requests in the queue.'
                  : `No pending ${
                      approvalTypeFilter === 'REASSIGN_REQUEST'
                        ? 'job transfer'
                        : approvalTypeFilter === 'CANCELLATION_REQUEST'
                        ? 'cancellation'
                        : 'reschedule'
                    } requests.`}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Cancellation Tracker */}
      {activeTab === 'CANCELLATION_TRACKER' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Cancellation Lifecycle & CRM Reconciliation Tracker
              </h2>
              <p className="text-xs text-slate-400">
                Approved cancellations remain tracked here until explicitly verified and confirmed in the external CRM.
              </p>
            </div>
            <button
              onClick={fetchCancellations}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs flex items-center gap-1.5 cursor-pointer transition self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Tracker
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            {loadingCancellations ? (
              <div className="py-16 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" />
                <span>Loading cancellation tracker...</span>
              </div>
            ) : cancellations.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {cancellations.map((c) => (
                  <div key={c.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">{c.inquiryCode}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          c.cancellationStatus === 'PENDING_APPROVAL'
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
                            : c.cancellationStatus === 'CRM_CONFIRMED'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                            : 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30'
                        }`}>
                          {c.cancellationStatus}
                        </span>
                      </div>
                      <span className="text-xs text-slate-600 dark:text-slate-300 block">
                        Customer: {c.customerName} ({c.customerPhone}) • Brand: {c.brandName} • Technician: {c.assignedTechnician?.fullName || 'None'}
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Reason: {c.cancellationReason || 'Technician requested cancellation'}
                        {c.cancellationCustomerCode && (
                          <span className="text-emerald-700 dark:text-emerald-400 ml-2 font-mono font-bold">
                            Code: {c.cancellationCustomerCode}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedJob(c);
                          setIsDrawerOpen(true);
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium cursor-pointer transition flex items-center gap-1"
                        title="View Job Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {c.cancellationStatus === 'PENDING_APPROVAL' && c.approvalRequests?.[0] && (
                        <button
                          onClick={() =>
                            setApprovalModalState({
                              isOpen: true,
                              request: c.approvalRequests[0],
                              actionType: 'APPROVE',
                            })
                          }
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve Request
                        </button>
                      )}

                      {c.cancellationStatus !== 'CRM_CONFIRMED' && (
                        <>
                          <button
                            onClick={() => setRevokeJob(c)}
                            className="px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-xs"
                            title="Customer agrees to reschedule service"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Revoke & Reschedule
                          </button>

                          <button
                            onClick={() => setConfirmCrmJob(c)}
                            className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition shadow-xs"
                          >
                            Confirm CRM Cancellation
                          </button>
                        </>
                      )}
                      {c.cancellationStatus === 'CRM_CONFIRMED' && (
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1.5 rounded-lg shadow-2xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> CRM Reconciled & Closed
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400">
                No active cancellation workflows pending.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Completed & Documents */}
      {activeTab === 'COMPLETED_DOCS' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Completed Jobs & Standardized Document Downloads
            </h2>
            <p className="text-xs text-slate-400">
              Download bills and verification proofs strictly named as &lt;Customer_Name&gt;_&lt;Doc_Name&gt;.&lt;ext&gt;.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            {loadingCompleted ? (
              <div className="py-16 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" />
                <span>Loading completed jobs...</span>
              </div>
            ) : completedJobs.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {completedJobs.map((c) => (
                  <div key={c.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">{c.inquiryCode}</span>
                          <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">{c.customerName}</span>
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                            COMPLETED
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {c.brandName} • {c.applianceCategory} • Technician: {c.assignedTechnician?.fullName || 'Technician'}
                        </span>
                      </div>
                    </div>

                    {/* Evidences / Docs Download Row */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {c.evidences && c.evidences.length > 0 ? (
                        [...c.evidences]
                          .sort((a: any, b: any) => {
                            const rank = (type: string) => {
                              const u = (type || '').toUpperCase();
                              if (u.includes('JOB_SHEET') || u.includes('BILL') || u.includes('INVOICE')) return 1;
                              if (u.includes('NAMEPLATE') || u.includes('MODEL')) return 2;
                              if (u.includes('PRE_INSPECTION') || u.includes('HAPPY')) return 3;
                              if (u.includes('POST_REPAIR') || u.includes('DEMO')) return 4;
                              return 5;
                            };
                            return rank(a.type) - rank(b.type);
                          })
                          .map((ev: any) => {
                            const targetFilename = formatStandardDocFilename(c.customerName, ev.type, ev.mimeType);

                            return (
                              <button
                                key={ev.id}
                                onClick={() => D2cApi.downloadDocument(ev.id, targetFilename)}
                                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-[11px] flex items-center gap-1.5 cursor-pointer transition shadow-xs"
                              >
                                <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                <span>{targetFilename}</span>
                              </button>
                            );
                          })
                      ) : (
                        <span className="text-slate-500 text-[11px]">No documents attached to this completed ticket.</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400">
                No completed service jobs recorded yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 6: Audit Trail */}
      {activeTab === 'AUDIT_TRAIL' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Global D2C Operations Audit Trail
            </h2>
            <p className="text-xs text-slate-400">
              Immutable append-only record of all registrations, assignments, reassignments, priority escalations, and approvals.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            {loadingAudit ? (
              <div className="py-16 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" />
                <span>Loading audit trail...</span>
              </div>
            ) : auditLogs.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3.5 flex items-start justify-between text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-[11px]">
                          {log.action}
                        </span>
                        <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                          Inquiry: {log.inquiryCodeSnapshot}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-xs">{log.reason || 'Operation executed'}</p>
                      <span className="text-slate-500 text-[10px]">
                        Actor: {log.actorRole} ({log.actorId}) • Source: {log.source}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400">
                No audit trail logs recorded yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Slide-Over Details Drawer */}
      <D2cJobDetailsDrawer
        job={selectedJob}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onAssignClick={(job) => {
          setSelectedJob(job);
          setIsReassignMode(false);
          setIsAssignModalOpen(true);
        }}
        onReassignClick={(job) => {
          setSelectedJob(job);
          setIsReassignMode(true);
          setIsAssignModalOpen(true);
        }}
        onPriorityToggle={handleTogglePriority}
        onConfirmCrmClick={(job) => {
          setConfirmCrmJob(job);
        }}
        onRefresh={() => loadWorkspaceBatch(true)}
      />

      {/* Create Job Modal */}
      <D2cCreateJobModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => loadWorkspaceBatch(true)}
      />

      {/* Assign / Reassign Modal */}
      <D2cAssignModal
        job={selectedJob}
        isReassign={isReassignMode}
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSuccess={() => {
          loadWorkspaceBatch(true);
          setIsDrawerOpen(false);
        }}
      />

      {/* Approval Decision Modal */}
      <D2cApprovalActionModal
        request={approvalModalState.request}
        actionType={approvalModalState.actionType}
        isOpen={approvalModalState.isOpen}
        onClose={() => setApprovalModalState({ isOpen: false, request: null, actionType: 'APPROVE' })}
        onSuccess={() => loadWorkspaceBatch(true)}
      />

      {/* Confirm External CRM Cancellation Modal (Direct confirmation, zero remarks) */}
      <D2cConfirmCrmCancellationModal
        job={confirmCrmJob}
        isOpen={!!confirmCrmJob}
        onClose={() => setConfirmCrmJob(null)}
        onSuccess={() => loadWorkspaceBatch(true)}
      />

      {/* Revoke Cancellation & Reschedule/Reassign Modal */}
      <D2cRevokeCancellationModal
        job={revokeJob}
        isOpen={!!revokeJob}
        onClose={() => setRevokeJob(null)}
        onSuccess={() => loadWorkspaceBatch(true)}
      />
    </div>
  );
}

export default function D2cJobsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-8 text-slate-500 dark:text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="text-xs font-semibold uppercase tracking-wider">Loading D2C Operations Console...</span>
        </div>
      }
    >
      <D2cJobsContent />
    </Suspense>
  );
}
