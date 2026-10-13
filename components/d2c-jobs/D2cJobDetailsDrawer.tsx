"use client";

import React, { useState } from 'react';
import {
  X,
  Phone,
  MapPin,
  Calendar,
  Clock,
  User,
  Wrench,
  AlertTriangle,
  Flame,
  FileText,
  Download,
  CheckCircle,
  Copy,
  Check,
  History,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { D2cJob, D2cApi } from '@/lib/d2c-api';

interface D2cJobDetailsDrawerProps {
  job: D2cJob | null;
  isOpen: boolean;
  onClose: () => void;
  onAssignClick: (job: D2cJob) => void;
  onReassignClick: (job: D2cJob) => void;
  onPriorityToggle: (job: D2cJob) => void;
  onConfirmCrmClick: (job: D2cJob) => void;
  onRefresh: () => void;
}

export default function D2cJobDetailsDrawer({
  job,
  isOpen,
  onClose,
  onAssignClick,
  onReassignClick,
  onPriorityToggle,
  onConfirmCrmClick,
  onRefresh,
}: D2cJobDetailsDrawerProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'WORKFLOW' | 'DOCS' | 'HISTORY'>('OVERVIEW');

  if (!isOpen || !job) return null;

  const copyInquiryCode = () => {
    navigator.clipboard.writeText(job.inquiryCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; bg: string; text: string; border: string }> = {
      PENDING_ASSIGNMENT: { label: 'Unassigned', bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
      ASSIGNED: { label: 'Assigned', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
      ACKNOWLEDGED: { label: 'Acknowledged', bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
      IN_PROGRESS: { label: 'In Progress', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
      ON_THE_WAY: { label: 'On The Way', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
      ARRIVED: { label: 'Arrived', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
      APPROVAL_PENDING: { label: 'Approval Pending', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
      CANCELLATION_PENDING: { label: 'Cancellation Pending', bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
      CRM_CONFIRMED: { label: 'CRM Confirmed', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
      COMPLETED: { label: 'Completed', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
      CANCELLED: { label: 'Cancelled', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
    };
    const s = map[status] || { label: status, bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${s.bg} ${s.text} ${s.border}`}>
        {s.label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {job.brandName?.slice(0, 2) || 'D2C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                  {job.inquiryCode}
                </span>
                <button
                  onClick={copyInquiryCode}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  title="Copy Inquiry Code"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                {getStatusBadge(job.status)}
              </div>
              <span className="text-[11px] text-slate-400">
                Ticket: {job.jobTicketNumber} • {job.brandName} • {job.applianceCategory}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPriorityToggle(job)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                job.isHighPriority
                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              <Flame className={`w-3.5 h-3.5 ${job.isHighPriority ? 'text-rose-400' : ''}`} />
              {job.isHighPriority ? 'High Priority' : 'Set Priority'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* High Priority Banner */}
        {job.isHighPriority && (
          <div className="px-4 py-2 bg-rose-500/10 border-b border-rose-500/20 flex items-center gap-2 text-rose-400 text-xs">
            <Flame className="w-4 h-4 shrink-0" />
            <span className="font-semibold">HIGH PRIORITY JOB:</span>
            <span className="truncate">{job.priorityReason || 'VIP Customer escalation or critical service SLA'}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 bg-slate-50/50 dark:bg-slate-900/50">
          {(['OVERVIEW', 'WORKFLOW', 'DOCS', 'HISTORY'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2.5 px-3.5 text-xs font-semibold border-b-2 transition cursor-pointer ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'OVERVIEW' && 'Overview & Customer'}
              {tab === 'WORKFLOW' && 'Assignment & Approvals'}
              {tab === 'DOCS' && 'Documents & Evidence'}
              {tab === 'HISTORY' && 'Audit Timeline'}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs">
          {activeTab === 'OVERVIEW' && (
            <>
              {/* Customer Information Card */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs">
                    <User className="w-4 h-4 text-blue-500" /> Customer Information
                  </span>
                  <a
                    href={`tel:${job.customerPhone}`}
                    className="flex items-center gap-1 text-blue-500 hover:underline font-semibold text-[11px]"
                  >
                    <Phone className="w-3 h-3" /> Call Customer
                  </a>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Full Name</span>
                    <span className="text-slate-900 dark:text-slate-200 font-medium">{job.customerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Primary Phone</span>
                    <span className="text-slate-900 dark:text-slate-200 font-mono font-medium">{job.customerPhone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Secondary Phone</span>
                    <span className="text-slate-900 dark:text-slate-200 font-mono font-medium">{job.alternatePhone || 'None'}</span>
                  </div>
                </div>
              </div>

              {/* Service Location Card */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2.5">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs border-b border-slate-100 dark:border-slate-800/80 pb-2">
                  <MapPin className="w-4 h-4 text-blue-500" /> Service Location
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Street Address</span>
                    <span className="text-slate-900 dark:text-slate-200 leading-relaxed font-medium">{job.serviceAddress}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">City</span>
                    <span className="text-slate-900 dark:text-slate-200 font-medium">{job.city}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">ZIP/PIN Code</span>
                    <span className="text-slate-900 dark:text-slate-200 font-mono font-medium">{job.pinCode || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Service & Appliance Details Card */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2.5">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs border-b border-slate-100 dark:border-slate-800/80 pb-2">
                  <Wrench className="w-4 h-4 text-blue-500" /> Service & Appliance Details
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Brand / Appliance</span>
                    <span className="text-slate-900 dark:text-slate-200 font-medium">{job.brandName} • {job.applianceCategory}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Model Number</span>
                    <span className="text-slate-900 dark:text-slate-200 font-mono font-medium">{job.modelNumber || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Warranty Type</span>
                    <span className="text-slate-900 dark:text-slate-200 font-medium">{job.warrantyType || 'IN_WARRANTY'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Appointment Slot</span>
                    <span className="text-slate-900 dark:text-slate-200 font-medium">
                      {job.appointmentDate ? new Date(job.appointmentDate).toLocaleDateString() : ''} ({job.timeSlot})
                    </span>
                  </div>
                  {job.reportedFault && (
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Reported Fault</span>
                      <span className="text-slate-900 dark:text-slate-200 font-medium bg-slate-50 dark:bg-slate-800/50 p-2 rounded block">
                        {job.reportedFault}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Remarks Card */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs border-b border-slate-100 dark:border-slate-800/80 pb-2">
                  <FileText className="w-4 h-4 text-blue-500" /> Remarks & CRM Notes
                </span>
                <div className="space-y-2">
                  {job.initialRemark && (
                    <div>
                      <span className="text-slate-400 block text-[10px] font-semibold">Initial CRM Remark:</span>
                      <p className="text-slate-300 bg-slate-800/40 p-2 rounded">{job.initialRemark}</p>
                    </div>
                  )}
                  {job.adminRemarks && (
                    <div>
                      <span className="text-slate-400 block text-[10px] font-semibold">Admin Operational Remarks:</span>
                      <p className="text-slate-300 bg-slate-800/40 p-2 rounded">{job.adminRemarks}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'WORKFLOW' && (
            <>
              {/* Current Assignment Card */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs">
                    <User className="w-4 h-4 text-blue-500" /> Current Technician Assignment
                  </span>
                  {job.assignedTechnician ? (
                    <button
                      onClick={() => onReassignClick(job)}
                      className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 text-[11px] font-semibold transition cursor-pointer"
                    >
                      Reassign Technician
                    </button>
                  ) : (
                    <button
                      onClick={() => onAssignClick(job)}
                      className="px-2.5 py-1 rounded bg-blue-600 text-white hover:bg-blue-500 text-[11px] font-semibold transition cursor-pointer"
                    >
                      Assign Technician
                    </button>
                  )}
                </div>

                {job.assignedTechnician ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-sm">
                        {job.assignedTechnician.fullName?.[0] || 'T'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-xs">
                            {job.assignedTechnician.fullName}
                          </span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              job.assignedTechnician.isOnline ? 'bg-emerald-400 ring-2 ring-emerald-400/20' : 'bg-slate-500'
                            }`}
                          />
                        </div>
                        <span className="text-slate-400 text-[11px]">
                          {job.assignedTechnician.user?.phone || job.assignedTechnician.alternatePhone} • {job.assignedTechnician.operatingCity}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Assigned: {job.assignedAt ? new Date(job.assignedAt).toLocaleDateString() : 'Active'}
                    </span>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-slate-800/20 border border-dashed border-slate-700 text-center text-slate-400">
                    No technician currently assigned to this ticket.
                  </div>
                )}
              </div>

              {/* Cancellation Workflow Card */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs">
                    <AlertTriangle className="w-4 h-4 text-orange-400" /> CRM Cancellation Reconciliation
                  </span>
                  {job.cancellationStatus !== 'CRM_CONFIRMED' && job.cancellationStatus !== 'NONE' && (
                    <button
                      onClick={() => onConfirmCrmClick(job)}
                      className="px-2.5 py-1 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 text-[11px] font-semibold transition cursor-pointer"
                    >
                      Confirm CRM Cancellation
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Workflow State</span>
                    <span className="font-bold text-orange-400">{job.cancellationStatus}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Customer Cancellation Code</span>
                    <span className="font-mono text-slate-200">{job.cancellationCustomerCode || 'Code Awaited'}</span>
                  </div>
                  {job.crmCancellationConfirmedAt && (
                    <div className="col-span-2 p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300">
                      Confirmed by: {job.crmCancellationConfirmedBy} at {new Date(job.crmCancellationConfirmedAt).toLocaleString()}
                      {job.crmCancellationRemark && <p className="mt-1 text-slate-300">Remark: {job.crmCancellationRemark}</p>}
                    </div>
                  )}
                </div>
              </div>

              {/* Approval Requests Card */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs border-b border-slate-100 dark:border-slate-800/80 pb-2">
                  <Clock className="w-4 h-4 text-blue-500" /> Technician Approval Requests ({job.approvalRequests?.length || 0})
                </span>

                {job.approvalRequests && job.approvalRequests.length > 0 ? (
                  <div className="space-y-2">
                    {job.approvalRequests.map((req) => (
                      <div key={req.id} className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/50 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-blue-400">{req.requestType}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            req.status === 'APPROVED' ? 'bg-emerald-500/15 text-emerald-400' :
                            req.status === 'REJECTED' ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400'
                          }`}>
                            {req.status}
                          </span>
                        </div>
                        <p className="text-slate-300">"{req.technicianRemark}"</p>
                        {req.reviewReason && (
                          <p className="text-slate-400 text-[10px]">Admin Review: {req.reviewReason}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-2">No approval requests submitted for this job.</p>
                )}
              </div>
            </>
          )}

          {activeTab === 'DOCS' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs">
                    <FileText className="w-4 h-4 text-blue-500" /> Verified Job Documents & Proofs
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Convention: &lt;Customer&gt;_&lt;Doc&gt;.&lt;ext&gt;
                  </span>
                </div>

                {/* Evidence Attachments */}
                <div className="space-y-2">
                  {job.evidences && job.evidences.length > 0 ? (
                    job.evidences.map((ev) => {
                      const customerClean = job.customerName.replace(/[^a-zA-Z0-9_-]/g, '_');
                      const docClean = ev.type.replace(/_/g, '_');
                      const ext = ev.mimeType.includes('pdf') ? 'pdf' : 'jpg';
                      const targetFilename = `${customerClean}_${docClean}.${ext}`;

                      return (
                        <div
                          key={ev.id}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/60"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs">
                              {ext.toUpperCase()}
                            </div>
                            <div>
                              <span className="font-mono text-slate-200 font-semibold block">{targetFilename}</span>
                              <span className="text-slate-400 text-[10px]">
                                Type: {ev.type} • Uploaded: {new Date(ev.uploadedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => D2cApi.downloadDocument(ev.id, targetFilename)}
                            className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 cursor-pointer text-xs transition"
                          >
                            <Download className="w-3.5 h-3.5" /> Download
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-slate-500">
                      No completion documents or evidence photos uploaded yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'HISTORY' && (
            <div className="space-y-3">
              {/* Assignment History */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs border-b border-slate-100 dark:border-slate-800/80 pb-2">
                  <History className="w-4 h-4 text-blue-500" /> Assignment History
                </span>
                {job.assignments && job.assignments.length > 0 ? (
                  <div className="space-y-2">
                    {job.assignments.map((asg) => (
                      <div key={asg.id} className="p-2.5 rounded-lg bg-slate-800/30 border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200">{asg.technician?.fullName || asg.technicianId}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            asg.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700 text-slate-400'
                          }`}>
                            {asg.status}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px]">Reason: {asg.reason || 'Assigned'}</p>
                        <span className="text-[10px] text-slate-500 block font-mono">
                          From: {new Date(asg.assignedAt).toLocaleString()} {asg.endedAt ? `• Ended: ${new Date(asg.endedAt).toLocaleString()}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-2">No assignment history records.</p>
                )}
              </div>

              {/* Audit Logs */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs border-b border-slate-100 dark:border-slate-800/80 pb-2">
                  <ShieldAlert className="w-4 h-4 text-blue-500" /> Immutable Audit Timeline
                </span>
                {job.auditLogs && job.auditLogs.length > 0 ? (
                  <div className="space-y-2">
                    {job.auditLogs.map((log) => (
                      <div key={log.id} className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/40 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-blue-400 text-[11px]">{log.action}</span>
                          <span className="text-slate-500 text-[10px] font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-300 text-xs">{log.reason || 'Action recorded'}</p>
                        <span className="text-slate-500 text-[10px]">Actor: {log.actorRole} ({log.actorId})</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-2">No audit records found.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
