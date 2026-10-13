"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Flame,
  User,
  MapPin,
  Wrench,
  FileText,
  Calendar,
  Clock,
  Search,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  Phone,
  ShieldCheck,
  Building,
  Link,
  Info,
  Star,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { D2cApi, EligibleTechnician } from '@/lib/d2c-api';

interface D2cCreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newJobId: string) => void;
}

type WizardStep = 1 | 2 | 3 | 4;

export default function D2cCreateJobModal({
  isOpen,
  onClose,
  onSuccess,
}: D2cCreateJobModalProps) {
  // Wizard Navigation Step
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Inquiry Details
    brandName: 'LG',
    inquiryCode: '',
    initialRemark: '',

    // Step 2: Customer & Location
    customerName: '',
    customerPhone: '',
    alternatePhone: '',
    city: 'Ahmedabad',
    serviceAddress: '',
    pinCode: '',

    // Step 3: Appliance & Schedule
    applianceCategory: 'Air Conditioner',
    modelNumber: '',
    serialNumber: '',
    warrantyType: 'IN_WARRANTY',
    reportedFault: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: '10:00 AM - 01:00 PM',

    // Step 4: Assignment & Priority
    isHighPriority: false,
    priorityReason: '',
    assignmentMode: 'IMMEDIATE' as 'IMMEDIATE' | 'UNASSIGNED',
    assignedTechnicianId: '',
  });

  // Validation & Server State
  const [checkingCode, setCheckingCode] = useState(false);
  const [codeConflict, setCodeConflict] = useState<any>(null);
  const [codeValid, setCodeValid] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Technician Search Engine State
  const [eligibleTechs, setEligibleTechs] = useState<EligibleTechnician[]>([]);
  const [loadingTechs, setLoadingTechs] = useState(false);
  const [techSearchQuery, setTechSearchQuery] = useState('');
  const [onlineFilterOnly, setOnlineFilterOnly] = useState(false);
  // Reset modal when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setStepError(null);
    }
  }, [isOpen]);

  // Clear assigned technician when operational city changes
  useEffect(() => {
    setFormData((prev) => {
      if (!prev.assignedTechnicianId) return prev;
      return { ...prev, assignedTechnicianId: '' };
    });
  }, [formData.city]);

  // Debounced inquiry duplicate check
  useEffect(() => {
    const raw = formData.inquiryCode.trim();
    if (!raw || raw.length < 3) {
      setCodeConflict(null);
      setCodeValid(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setCheckingCode(true);
        const res = await D2cApi.checkInquiryCode(raw);
        if (res.exists) {
          setCodeConflict(res.job);
          setCodeValid(false);
        } else {
          setCodeConflict(null);
          setCodeValid(true);
        }
      } catch {
        // Fallback
      } finally {
        setCheckingCode(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [formData.inquiryCode]);

  // Load technicians strictly for the selected operational city
  useEffect(() => {
    if (!isOpen || !formData.city) return;
    let isMounted = true;
    const fetchTechs = async () => {
      try {
        setLoadingTechs(true);
        const res = await fetch(
          `/api/d2c/technicians?city=${encodeURIComponent(formData.city)}&assignable=true&limit=100`,
        );
        const json = await res.json();
        const items = Array.isArray(json?.items)
          ? json.items
          : Array.isArray(json?.data)
          ? json.data
          : [];
        if (isMounted) {
          setEligibleTechs(items);
        }
      } catch {
        if (isMounted) setEligibleTechs([]);
      } finally {
        if (isMounted) setLoadingTechs(false);
      }
    };
    fetchTechs();
    return () => {
      isMounted = false;
    };
  }, [isOpen, formData.city]);

  // Enterprise Technician Filter & Search Logic
  const filteredTechnicians = useMemo(() => {
    const query = techSearchQuery.trim().toLowerCase();

    return eligibleTechs.filter((tech: any) => {
      // 1. Online Filter
      if (onlineFilterOnly && !tech.isOnline) {
        return false;
      }

      // 2. Multi-field omni search: name, phone, area, pincode, skills
      if (query) {
        const nameMatch = (tech.fullName || '').toLowerCase().includes(query);
        const phoneMatch =
          (tech.phone || '').includes(query) ||
          (tech.alternatePhone || '').includes(query);
        const cityMatch = (tech.operatingCity || '').toLowerCase().includes(query);
        const localityMatch = (tech.localityArea || '').toLowerCase().includes(query);
        const pincodeMatch = (tech.servicePincode || '').includes(query);
        const skillsMatch = Array.isArray(tech.selectedSkills)
          ? tech.selectedSkills.some((s: string) => s.toLowerCase().includes(query))
          : false;

        return (
          nameMatch ||
          phoneMatch ||
          cityMatch ||
          localityMatch ||
          pincodeMatch ||
          skillsMatch
        );
      }

      return true;
    });
  }, [eligibleTechs, techSearchQuery, onlineFilterOnly]);

  // Selected Technician Object
  const selectedTech = useMemo(() => {
    if (!formData.assignedTechnicianId) return null;
    return eligibleTechs.find((t) => t.id === formData.assignedTechnicianId) || null;
  }, [eligibleTechs, formData.assignedTechnicianId]);

  if (!isOpen) return null;

  // Step 1 Validation
  const validateStep1 = () => {
    if (!formData.brandName.trim()) {
      setStepError('Please select a Brand Name.');
      return false;
    }
    if (!formData.inquiryCode.trim()) {
      setStepError('Please provide an Inquiry Code from the external CRM ticket.');
      return false;
    }
    if (codeConflict) {
      setStepError('Cannot proceed: This inquiry code is already registered in Mubryx.');
      return false;
    }
    setStepError(null);
    return true;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    if (!formData.customerName.trim()) {
      setStepError('Customer Full Name is required.');
      return false;
    }
    const cleanPhone = formData.customerPhone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setStepError('Please provide a valid 10-digit primary phone number.');
      return false;
    }
    if (!formData.city.trim()) {
      setStepError('Operational City is required.');
      return false;
    }
    if (formData.pinCode.trim() && formData.pinCode.trim().length < 6) {
      setStepError('Please provide a valid 6-digit PIN/ZIP code, or leave it blank.');
      return false;
    }
    if (!formData.serviceAddress.trim()) {
      setStepError('Full Service Street Address is required for technician dispatch.');
      return false;
    }
    setStepError(null);
    return true;
  };

  // Step 3 Validation
  const validateStep3 = () => {
    if (!formData.applianceCategory.trim()) {
      setStepError('Please select an Appliance Category.');
      return false;
    }
    if (!formData.appointmentDate) {
      setStepError('Appointment Date is required.');
      return false;
    }
    if (!formData.timeSlot.trim()) {
      setStepError('Appointment Time Slot is required.');
      return false;
    }
    setStepError(null);
    return true;
  };

  // Step Navigation Handlers
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (validateStep1()) setCurrentStep(2);
    } else if (currentStep === 2) {
      if (validateStep2()) setCurrentStep(3);
    } else if (currentStep === 3) {
      if (validateStep3()) setCurrentStep(4);
    }
  };

  const handlePrevStep = () => {
    setStepError(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
    }
  };

  // Final Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStepError(null);

    if (codeConflict) {
      setStepError('Cannot register: This inquiry code is already registered in the system.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await D2cApi.createJob({
        brandName: formData.brandName,
        inquiryCode: formData.inquiryCode.trim(),
        initialRemark: formData.initialRemark.trim() || undefined,
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        alternatePhone: formData.alternatePhone.trim() || undefined,
        city: formData.city,
        serviceAddress: formData.serviceAddress.trim(),
        pinCode: formData.pinCode.trim() || undefined,
        applianceCategory: formData.applianceCategory,
        modelNumber: formData.modelNumber.trim() || undefined,
        serialNumber: formData.serialNumber.trim() || undefined,
        warrantyType: formData.warrantyType,
        reportedFault: formData.reportedFault.trim() || undefined,
        appointmentDate: new Date(formData.appointmentDate).toISOString(),
        timeSlot: formData.timeSlot,
        isHighPriority: formData.isHighPriority,
        priorityReason: formData.isHighPriority ? formData.priorityReason.trim() || 'VIP Customer Escalation' : undefined,
        assignedTechnicianId:
          formData.assignmentMode === 'IMMEDIATE' && formData.assignedTechnicianId
            ? formData.assignedTechnicianId
            : undefined,
      });

      if (res.success && res.data) {
        onSuccess(res.data.id);
        onClose();
      }
    } catch (err: any) {
      setStepError(err?.message || 'Failed to register D2C job.');
    } finally {
      setSubmitting(false);
    }
  };

  // Step Meta Configuration for the Right Info Card
  const stepMeta = {
    1: {
      about:
        'Enter the inquiry details exactly as received from the external CRM or customer portal. This information helps us prevent duplicate jobs and ensure accurate tracking.',
      required: ['Brand Name', 'Inquiry Code'],
      validationTitle: 'Data Validation',
      validations: ['Duplicate inquiry check', 'Valid inquiry code format', 'Secure data storage'],
    },
    2: {
      about:
        'Provide verified customer contact details and exact location to ensure seamless technician navigation, phone verification, and doorstep service delivery.',
      required: ['Customer Full Name', '10-Digit Primary Phone', 'Operational City', 'Service Street Address'],
      validationTitle: 'Location Standards',
      validations: ['Territory-based technician routing', 'Contact redundancy (Alternate phone)', 'Optional PIN code dispatch'],
    },
    3: {
      about:
        'Capture appliance specifications, warranty classification, and allocate a customer-preferred appointment window for guaranteed SLA dispatch.',
      required: ['Appliance Category', 'Appointment Date', 'Preferred Time Slot'],
      validationTitle: 'Service Compliance',
      validations: ['OEM warranty verification standard', 'SLA time slot allocation', 'Fault categorization for parts'],
    },
    4: {
      about:
        'Dispatch this job immediately to a qualified active technician in the service area, or keep unassigned in the central dispatch board pool.',
      required: ['Priority Tagging', 'Assignment Mode Selection'],
      validationTitle: 'Dispatch Assurance',
      validations: ['Exclusive technician binding', 'Immediate mobile app dispatch alert', 'Immutable audit trail log'],
    },
  }[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Modal Dialog (Exact rounded-3xl, 960px width, 680px fixed height layout) */}
      <div className="relative w-full max-w-4xl h-[680px] max-h-[94vh] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col z-10 overflow-hidden">

        {/* ─── 1. FIXED MODAL HEADER ────────────────────────────────────────── */}
        <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0">
              <PlusCircle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Register D2C Service Job
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
                  Step {currentStep} of 4
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Authoritative external CRM registration with duplicate prevention invariant.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ─── 2. TOP STEPPER PROGRESS BAR ──────────────────────────────────── */}
        <div className="px-8 py-4 border-b border-slate-100 dark:border-slate-800/80 shrink-0 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between w-full max-w-2xl mx-auto">
            {[
              { num: 1, label: 'Inquiry', subtitle: 'Basic Information' },
              { num: 2, label: 'Customer', subtitle: 'Customer Details' },
              { num: 3, label: 'Appliance', subtitle: 'Product Information' },
              { num: 4, label: 'Assignment', subtitle: 'Assign Technician' },
            ].map((s, idx) => {
              const isCurrent = currentStep === s.num;
              const isPast = currentStep > s.num;

              return (
                <React.Fragment key={s.num}>
                  <div
                    onClick={() => {
                      if (isPast) setCurrentStep(s.num as WizardStep);
                    }}
                    className={`flex items-center gap-3 select-none ${
                      isPast ? 'cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        isCurrent
                          ? 'bg-blue-600 text-white shadow-xs'
                          : isPast
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {isPast ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.num}
                    </div>
                    <div>
                      <span
                        className={`block text-xs font-semibold leading-tight ${
                          isCurrent
                            ? 'text-blue-600 dark:text-blue-400 font-bold'
                            : isPast
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {s.label}
                      </span>
                      <span
                        className={`block text-[10px] leading-tight ${
                          isCurrent
                            ? 'text-blue-500 dark:text-blue-400/80 font-medium'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {s.subtitle}
                      </span>
                    </div>
                  </div>

                  {idx < 3 && (
                    <div
                      className={`flex-1 h-0.5 mx-3 transition-colors ${
                        isPast ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ─── 3. SPLIT 2-COLUMN MODAL BODY ─────────────────────────────────── */}
        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
          {/* Error Banner */}
          {stepError && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span className="font-semibold text-xs">{stepError}</span>
            </div>
          )}

          {/* Duplicate Conflict Alert Banner */}
          {codeConflict && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-700 dark:text-rose-300 flex items-start gap-3">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-xs text-rose-600 dark:text-rose-400 block">
                  Duplicate Inquiry Invariant Blocked!
                </span>
                <p className="text-[11px] leading-relaxed">
                  Ticket #{codeConflict.jobTicketNumber} is already registered for "{codeConflict.customerName}" ({codeConflict.brandName} • Status: {codeConflict.status}). Duplicate registration is blocked.
                </p>
              </div>
            </div>
          )}

          {/* 2-Column Grid matching exactly the provided design */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">

            {/* ── LEFT COLUMN (67% WIDTH - FORM INPUTS) ────────────────────── */}
            <div className="lg:col-span-8 space-y-4">

              {/* ── STEP 1: SECTION A — INQUIRY INFORMATION ──────────────── */}
              {currentStep === 1 && (
                <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/60 p-6 shadow-2xs space-y-4 animate-in fade-in duration-150">
                  {/* Section Title Banner */}
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        Section A — Inquiry Information
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Enter the basic inquiry details received from external CRM or customer.
                      </p>
                    </div>
                  </div>

                  {/* Row 1: Brand & Inquiry Code */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                    {/* Brand Name */}
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                        Brand Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs">
                          {/* Brand circular logo badge */}
                          <div className="w-5 h-5 rounded-full bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                            LG
                          </div>
                          <select
                            value={formData.brandName}
                            onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                            className="w-full bg-transparent text-slate-900 dark:text-white text-xs font-semibold focus:outline-none cursor-pointer"
                            required
                          >
                            <option value="LG">LG Electronics</option>
                            <option value="SAMSUNG">Samsung</option>
                            <option value="VOLTAS">Voltas</option>
                            <option value="DAIKIN">Daikin</option>
                            <option value="WHIRLPOOL">Whirlpool</option>
                            <option value="HAIER">Haier</option>
                            <option value="PANASONIC">Panasonic</option>
                            <option value="GODREJ">Godrej</option>
                            <option value="OTHER">Other Brand</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Inquiry Code */}
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                        Inquiry Code <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <FileText className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                        <input
                          type="text"
                          value={formData.inquiryCode}
                          onChange={(e) => setFormData({ ...formData, inquiryCode: e.target.value.toUpperCase() })}
                          placeholder="E.g.  INQ-LG-2026-9841"
                          className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
                          required
                        />
                        {checkingCode && (
                          <Loader2 className="w-4 h-4 absolute right-3 top-3 animate-spin text-blue-500" />
                        )}
                        {codeValid && !checkingCode && (
                          <CheckCircle2 className="w-4 h-4 absolute right-3 top-3 text-emerald-500" />
                        )}
                        {codeConflict && !checkingCode && (
                          <AlertCircle className="w-4 h-4 absolute right-3 top-3 text-rose-500" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Initial CRM Remark / Customer Ticket Notes */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Initial CRM Remark / Customer Ticket Notes
                    </label>
                    <div className="relative">
                      <FileText className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <textarea
                        rows={3}
                        maxLength={1000}
                        value={formData.initialRemark}
                        onChange={(e) => setFormData({ ...formData, initialRemark: e.target.value })}
                        placeholder="Paste verbatim customer remarks, complaints, or instructions from OEM portal..."
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none shadow-2xs"
                      />
                      <span className="absolute bottom-2.5 right-3 text-[10px] text-slate-400 font-mono">
                        {formData.initialRemark.length}/1000
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 2: SECTION B — CUSTOMER INFORMATION & LOCATION ───── */}
              {currentStep === 2 && (
                <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/60 p-6 shadow-2xs space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        Section B — Customer Information & Location
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Enter customer identity and service address details for field technician dispatch.
                      </p>
                    </div>
                  </div>

                  {/* Row 1: Name & Phone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                        Customer Full Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                        <input
                          type="text"
                          value={formData.customerName}
                          onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                          placeholder="E.g. Ramesh Patel"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                        Primary Mobile Phone (10 Digits) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                        <input
                          type="tel"
                          maxLength={10}
                          value={formData.customerPhone}
                          onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value.replace(/\D/g, '') })}
                          placeholder="E.g. 9876543210"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Operational City & Pincode (Optional) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                        Operational City <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Building className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                        <select
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs cursor-pointer"
                        >
                          <option value="Ahmedabad">Ahmedabad</option>
                          <option value="Gandhinagar">Gandhinagar</option>
                          <option value="Mumbai">Mumbai</option>
                          <option value="Chennai">Chennai</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                        Postal PIN / ZIP Code (Optional)
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                        <input
                          type="text"
                          maxLength={6}
                          value={formData.pinCode}
                          onChange={(e) => setFormData({ ...formData, pinCode: e.target.value.replace(/\D/g, '') })}
                          placeholder="E.g. 380015"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Alternate Contact Number */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Alternate Contact Number (Optional)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="tel"
                        maxLength={12}
                        value={formData.alternatePhone}
                        onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value.replace(/\D/g, '') })}
                        placeholder="E.g. 9822011223"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Row 4: Full Service Street Address */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                      Full Service Street Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <textarea
                        rows={2}
                        value={formData.serviceAddress}
                        onChange={(e) => setFormData({ ...formData, serviceAddress: e.target.value })}
                        placeholder="House/Flat No., Society/Building, Street, Area..."
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none shadow-2xs"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 3: SECTION C — APPLIANCE & SCHEDULING ─────────────── */}
              {currentStep === 3 && (
                <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/60 p-6 shadow-2xs space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        Section C — Appliance & Scheduling
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Specify product category, warranty classification, and preferred service slot.
                      </p>
                    </div>
                  </div>

                  {/* Row 1: Appliance & Warranty */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                        Appliance Category <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Wrench className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                        <select
                          value={formData.applianceCategory}
                          onChange={(e) => setFormData({ ...formData, applianceCategory: e.target.value })}
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs cursor-pointer"
                        >
                          <option value="Air Conditioner">Air Conditioner (AC)</option>
                          <option value="Refrigerator">Refrigerator</option>
                          <option value="Washing Machine">Washing Machine</option>
                          <option value="Microwave Oven">Microwave Oven</option>
                          <option value="Television">Television / LED TV</option>
                          <option value="Water Purifier">Water Purifier / RO</option>
                          <option value="Kitchen Chimney">Kitchen Chimney</option>
                          <option value="Dishwasher">Dishwasher</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                        Warranty Classification <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <ShieldCheck className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                        <select
                          value={formData.warrantyType}
                          onChange={(e) => setFormData({ ...formData, warrantyType: e.target.value })}
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs cursor-pointer"
                        >
                          <option value="IN_WARRANTY">In Warranty (OEM Covered)</option>
                          <option value="OUT_OF_WARRANTY">Out of Warranty (Chargeable)</option>
                          <option value="EXTENDED_WARRANTY">Extended Warranty / AMC</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Model & Serial */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                        Model Number (Optional)
                      </label>
                      <div className="relative">
                        <FileText className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                        <input
                          type="text"
                          value={formData.modelNumber}
                          onChange={(e) => setFormData({ ...formData, modelNumber: e.target.value })}
                          placeholder="E.g. GL-I292RPZX"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                        Serial Number (Optional)
                      </label>
                      <div className="relative">
                        <FileText className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                        <input
                          type="text"
                          value={formData.serialNumber}
                          onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                          placeholder="E.g. 402TAKC01924"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Appointment Date & Time Slot */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                        Appointment Date <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                        <input
                          type="date"
                          value={formData.appointmentDate}
                          onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs cursor-pointer"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                        Preferred Time Slot <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Clock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                        <select
                          value={formData.timeSlot}
                          onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs cursor-pointer"
                        >
                          <option value="09:00 AM - 12:00 PM">09:00 AM - 12:00 PM (Morning Slot)</option>
                          <option value="10:00 AM - 01:00 PM">10:00 AM - 01:00 PM (Midday Slot)</option>
                          <option value="01:00 PM - 04:00 PM">01:00 PM - 04:00 PM (Afternoon Slot)</option>
                          <option value="04:00 PM - 07:00 PM">04:00 PM - 07:00 PM (Evening Slot)</option>
                          <option value="06:00 PM - 09:00 PM">06:00 PM - 09:00 PM (Late Evening)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Row 4: Reported Fault */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Reported Customer Fault / Complaint
                    </label>
                    <div className="relative">
                      <AlertCircle className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <textarea
                        rows={2}
                        value={formData.reportedFault}
                        onChange={(e) => setFormData({ ...formData, reportedFault: e.target.value })}
                        placeholder="E.g. Cooling coil leakage, unit not turning on, error code CH-05..."
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none shadow-2xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 4: SECTION D — ASSIGNMENT & DISPATCH ─────────────── */}
              {currentStep === 4 && (
                <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/60 p-6 shadow-2xs space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        Section D — Assignment & Technician Dispatch
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Assign immediately to an approved field technician or leave in Unassigned pool.
                      </p>
                    </div>
                  </div>

                  {/* Priority Escalation Toggle Card */}
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                        <Flame className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          Mark as High Priority / VIP Escalation
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Highlights job ticket and expedites technician dispatch response.
                        </span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isHighPriority}
                        onChange={(e) => setFormData({ ...formData, isHighPriority: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600" />
                    </label>
                  </div>

                  {/* Mode Selector (Immediate vs Unassigned) */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, assignmentMode: 'IMMEDIATE' })}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        formData.assignmentMode === 'IMMEDIATE'
                          ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-500 ring-1 ring-blue-500/30'
                          : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Assign Immediately
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600">
                          Recommended
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Dispatch directly to an active field technician.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          assignmentMode: 'UNASSIGNED',
                          assignedTechnicianId: '',
                        })
                      }
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        formData.assignmentMode === 'UNASSIGNED'
                          ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-500 ring-1 ring-blue-500/30'
                          : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Keep Unassigned
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Hold in unassigned pool on the Assignment Board.
                      </p>
                    </button>
                  </div>

                  {/* Immediate Assignment Search & List */}
                  {formData.assignmentMode === 'IMMEDIATE' && (
                    <div className="space-y-3 pt-1">
                      {/* Search Bar & Filters */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
                          <input
                            type="text"
                            value={techSearchQuery}
                            onChange={(e) => setTechSearchQuery(e.target.value)}
                            placeholder="Search by name, phone, area, or pincode..."
                            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 text-xs font-semibold shrink-0">
                            <Building className="w-3.5 h-3.5 text-blue-500" />
                            <span>{formData.city}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 font-bold">
                              {filteredTechnicians.length}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setOnlineFilterOnly((prev) => !prev)}
                            className={`px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 ${
                              onlineFilterOnly
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>Online</span>
                          </button>
                        </div>
                      </div>

                      {/* Selected Tech Callout */}
                      {selectedTech && (
                        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                            <span className="text-slate-900 dark:text-white font-medium">
                              Dispatched to: <strong>{selectedTech.fullName}</strong> ({selectedTech.operatingCity})
                            </span>
                          </div>
                          <span className="font-mono text-blue-600 text-[11px] font-semibold">
                            {selectedTech.phone}
                          </span>
                        </div>
                      )}

                      {/* Technician List */}
                      <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 custom-scrollbar">
                        {loadingTechs ? (
                          <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                            <span>Loading {formData.city} technicians...</span>
                          </div>
                        ) : filteredTechnicians.length === 0 ? (
                          <div className="py-8 text-center text-slate-400 text-xs">
                            No technicians found in {formData.city} matching your filters.
                          </div>
                        ) : (
                          filteredTechnicians.map((t: any) => {
                            const isSelected = formData.assignedTechnicianId === t.id;
                            return (
                              <div
                                key={t.id}
                                onClick={() =>
                                  setFormData({
                                    ...formData,
                                    assignedTechnicianId: isSelected ? '' : t.id,
                                  })
                                }
                                className={`p-2.5 flex items-center justify-between cursor-pointer transition ${
                                  isSelected
                                    ? 'bg-blue-50/70 dark:bg-blue-950/40 border-l-4 border-blue-600'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="relative shrink-0">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center uppercase">
                                      {t.fullName?.slice(0, 2) || 'TC'}
                                    </div>
                                    <span
                                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${
                                        t.isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                                      }`}
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                        {t.fullName}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-mono">
                                        {t.phone || t.alternatePhone || t.user?.phone}
                                      </span>
                                      {t.isOnline ? (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                          Online
                                        </span>
                                      ) : (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                                          Offline
                                        </span>
                                      )}
                                      {t.onboardingStatus === 'APPROVED' ? (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                                          Approved
                                        </span>
                                      ) : (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                                          {t.onboardingStatus?.replace('_', ' ') || 'Under Review'}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                                      <span className="font-medium text-slate-700 dark:text-slate-300">
                                        📍 {t.operatingCity}{t.localityArea ? `, ${t.localityArea}` : ''}
                                      </span>
                                      {t.servicePincode && (
                                        <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">
                                          PIN: {t.servicePincode}
                                        </span>
                                      )}
                                      {Array.isArray(t.selectedSkills) && t.selectedSkills.length > 0 && (
                                        <span className="text-slate-400 truncate max-w-[200px]">
                                          • {t.selectedSkills.slice(0, 2).join(', ')}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="shrink-0 ml-3">
                                  <div
                                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition ${
                                      isSelected
                                        ? 'border-blue-600 bg-blue-600 text-white'
                                        : 'border-slate-300 dark:border-slate-600 bg-transparent'
                                    }`}
                                  >
                                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── RIGHT COLUMN (33% WIDTH - ABOUT THIS STEP SIDEBAR) ──────── */}
            <div className="lg:col-span-4 space-y-4">
              {/* Card 1: About This Step */}
              <div className="bg-blue-50/70 dark:bg-blue-950/20 rounded-2xl p-4.5 border border-blue-100/80 dark:border-blue-900/40 space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Info className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                    About This Step
                  </h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {stepMeta.about}
                </p>
              </div>

              {/* Card 2: Required Fields */}
              <div className="bg-rose-50/70 dark:bg-rose-950/20 rounded-2xl p-4.5 border border-rose-100/80 dark:border-rose-900/30 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <Star className="w-3 h-3 fill-rose-500 text-rose-500" />
                  </div>
                  <span className="font-bold text-xs text-rose-600 dark:text-rose-400">
                    Required Fields
                  </span>
                </div>
                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1 pl-1">
                  {stepMeta.required.map((f, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card 3: Data Validation Checklist */}
              <div className="bg-emerald-50/70 dark:bg-emerald-950/20 rounded-2xl p-4.5 border border-emerald-100/80 dark:border-emerald-900/30 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                    {stepMeta.validationTitle}
                  </span>
                </div>
                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 pl-1">
                  {stepMeta.validations.map((v, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.5]" />
                      <span>{v}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>
        </div>

        {/* ─── 4. FIXED FOOTER BAR ─────────────────────────────────────────── */}
        <div className="px-8 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0 flex items-center justify-between bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition cursor-pointer shadow-2xs"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2.5">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
              >
                Back
              </button>
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={Boolean(codeConflict) || (currentStep === 1 && !formData.inquiryCode.trim())}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer transition"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || Boolean(codeConflict)}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer transition"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Registering Job...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Register D2C Job</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
