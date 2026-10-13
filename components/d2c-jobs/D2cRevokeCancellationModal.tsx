"use client";

import React, { useEffect, useState } from 'react';
import {
  X,
  RotateCcw,
  Calendar,
  Clock,
  UserCheck,
  Loader2,
  AlertCircle,
  CalendarClock,
} from 'lucide-react';
import { D2cJob, D2cApi, EligibleTechnician } from '@/lib/d2c-api';

interface D2cRevokeCancellationModalProps {
  job: D2cJob | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TIME_SLOTS = [
  '09:00 AM - 12:00 PM',
  '10:00 AM - 01:00 PM',
  '01:00 PM - 04:00 PM',
  '02:00 PM - 05:00 PM',
  '04:00 PM - 07:00 PM',
  '06:00 PM - 09:00 PM',
];

export default function D2cRevokeCancellationModal({
  job,
  isOpen,
  onClose,
  onSuccess,
}: D2cRevokeCancellationModalProps) {
  const [appointmentDate, setAppointmentDate] = useState('');
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[1]);
  const [technicianId, setTechnicianId] = useState('');
  const [remark, setRemark] = useState('');
  const [technicians, setTechnicians] = useState<EligibleTechnician[]>([]);
  const [loadingTechs, setLoadingTechs] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (job && isOpen) {
      // Default to job's date or tomorrow
      if (job.appointmentDate) {
        setAppointmentDate(job.appointmentDate);
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setAppointmentDate(tomorrow.toISOString().split('T')[0]);
      }
      setTimeSlot(job.timeSlot || TIME_SLOTS[1]);
      setTechnicianId(job.assignedTechnicianId || '');
      setRemark('');
      setError(null);

      // Fetch eligible technicians for reassignment
      setLoadingTechs(true);
      D2cApi.getEligibleTechnicians(job.id)
        .then((techs) => {
          setTechnicians(techs || []);
        })
        .catch(() => {
          setTechnicians([]);
        })
        .finally(() => {
          setLoadingTechs(false);
        });
    }
  }, [job, isOpen]);

  if (!isOpen || !job) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setSubmitting(true);
      await D2cApi.revokeCancellation(job.id, {
        newDate: appointmentDate || undefined,
        newTimeSlot: timeSlot || undefined,
        technicianId: technicianId || undefined,
        remark: remark.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to revoke cancellation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 z-10 animate-in zoom-in-95 duration-150 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center font-bold">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Revoke Cancellation & Reschedule
              </h3>
              <span className="text-[11px] text-slate-400">
                Ticket: {job.inquiryCode} • {job.customerName}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="my-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs space-y-1">
          <span className="font-bold text-blue-400 flex items-center gap-1.5">
            <CalendarClock className="w-4 h-4" /> Customer Reschedule Workflow
          </span>
          <p className="text-[11px] leading-relaxed text-slate-300">
            This action revokes the cancellation status and restores this ticket to active operations. You can set the new appointment date/time and reassign the job directly to a field technician.
          </p>
        </div>

        {error && (
          <div className="mb-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-blue-400" /> New Appointment Date
              </label>
              <input
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs cursor-pointer"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-1">
                <Clock className="w-3.5 h-3.5 text-blue-400" /> Time Slot
              </label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs cursor-pointer"
              >
                {TIME_SLOTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 flex items-center justify-between mb-1">
              <span className="flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-blue-400" /> Assign Technician
              </span>
              {loadingTechs && (
                <span className="text-[10px] text-blue-400 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Loading available techs...
                </span>
              )}
            </label>
            <select
              value={technicianId}
              onChange={(e) => setTechnicianId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs cursor-pointer"
            >
              <option value="">-- Keep in Unassigned Pool (Pending Assignment) --</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName} ({t.operatingCity} • {t.activeJobsCount} active jobs)
                  {t.isOnline ? ' • Online' : ''}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1">
              Select a technician to assign immediately, or leave unassigned to put in the Unassigned Pool.
            </p>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Reschedule Note / Reason (Optional)
            </label>
            <input
              type="text"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="e.g. Customer requested rescheduling after initial cancellation inquiry"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 cursor-pointer transition shadow-xs disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Restoring Job...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Revoke & Restore Job</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
