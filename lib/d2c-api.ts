/**
 * Authoritative API client for D2C Operations in Mubryx Admin Console.
 * Directly communicates with Next.js authenticated proxy routes.
 */

export interface D2cJob {
  id: string;
  jobTicketNumber: string;
  inquiryCode: string;
  canonicalInquiryCode: string;
  brandName: string;
  customerName: string;
  customerPhone: string;
  alternatePhone?: string;
  serviceAddress: string;
  city: string;
  pinCode?: string;
  applianceCategory: string;
  modelNumber?: string;
  serialNumber?: string;
  warrantyType?: string;
  reportedFault?: string;
  appointmentDate: string;
  timeSlot: string;
  adminRemarks?: string;
  initialRemark?: string;
  status:
    | 'PENDING_ASSIGNMENT'
    | 'ASSIGNED'
    | 'ACKNOWLEDGED'
    | 'ON_THE_WAY'
    | 'ARRIVED'
    | 'IN_PROGRESS'
    | 'APPROVAL_PENDING'
    | 'CANCELLATION_PENDING'
    | 'CRM_CONFIRMED'
    | 'COMPLETED'
    | 'RESCHEDULED'
    | 'CANCELLED';
  assignedTechnicianId?: string;
  assignedTechnician?: {
    id: string;
    fullName?: string;
    alternatePhone?: string;
    operatingCity?: string;
    servicePincode?: string;
    isOnline?: boolean;
    user?: { phone: string; name?: string };
  };
  assignedAt?: string;
  isHighPriority: boolean;
  priorityReason?: string;
  priorityChangedAt?: string;
  priorityChangedBy?: string;
  cancellationStatus:
    | 'NONE'
    | 'PENDING_APPROVAL'
    | 'APPROVED_CODE_AWAITED'
    | 'CODE_RECEIVED'
    | 'CRM_PENDING'
    | 'CRM_CONFIRMED'
    | 'REJECTED';
  cancellationReason?: string;
  cancellationCustomerCode?: string;
  cancellationRequestedAt?: string;
  cancellationApprovedAt?: string;
  cancellationCodeReceivedAt?: string;
  crmCancellationConfirmedAt?: string;
  crmCancellationConfirmedBy?: string;
  crmCancellationRemark?: string;
  completionOutcome?: string;
  completionRemark?: string;
  verifiedModel?: string;
  verifiedSerial?: string;
  crmSyncStatus: string;
  createdAt: string;
  updatedAt: string;
  assignments?: Array<{
    id: string;
    technicianId: string;
    assignedBy: string;
    reason?: string;
    status: 'ACTIVE' | 'ENDED';
    assignedAt: string;
    endedAt?: string;
    endedReason?: string;
    technician?: { fullName?: string; operatingCity?: string; user?: { phone: string } };
  }>;
  approvalRequests?: Array<{
    id: string;
    requestType: 'NEXT_DAY_APPOINTMENT' | 'CANCELLATION_REQUEST' | 'REASSIGN_REQUEST' | 'OTHER';
    technicianRemark: string;
    reason?: string;
    proposedDate?: string;
    proposedTimeSlot?: string;
    status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
    submittedAt: string;
    reviewedAt?: string;
    reviewedByAdminId?: string;
    reviewReason?: string;
    technician?: { id: string; fullName?: string };
  }>;
  documents?: Array<{
    id: string;
    documentType: string;
    documentName: string;
    fileUrl: string;
    originalFilename: string;
    mimeType: string;
    fileSize: number;
    uploadedAt: string;
  }>;
  evidences?: Array<{
    id: string;
    type: string;
    fileUrl: string;
    mimeType: string;
    uploadedAt: string;
  }>;
  auditLogs?: Array<{
    id: string;
    action: string;
    actorId: string;
    actorRole: string;
    reason?: string;
    beforeState?: any;
    afterState?: any;
    timestamp: string;
  }>;
}

export interface D2cMetrics {
  total: number;
  unassigned: number;
  assigned: number;
  inProgress: number;
  approvalPending: number;
  cancellationPending: number;
  crmConfirmed: number;
  completed: number;
  highPriority: number;
}

export interface EligibleTechnician {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  operatingCity: string;
  localityArea?: string;
  servicePincode: string;
  selectedSkills: string[];
  experienceYears?: string;
  isOnline: boolean;
  activeJobsCount: number;
  isCityMatch: boolean;
  isPincodeMatch: boolean;
  isSkillMatch: boolean;
  matchScore: number;
  isCurrentTechnician: boolean;
}

export interface D2cWorkspaceBatch {
  metrics: D2cMetrics;
  jobs: {
    items: D2cJob[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  approvals: {
    items: any[];
    totalPending: number;
  };
  cancellations: {
    items: any[];
    totalActive: number;
  };
  completed: {
    items: any[];
    totalCompleted: number;
  };
  auditLogs: any[];
  activeTechniciansCount: number;
  timestamp: string;
}

// Enterprise in-memory client cache with TTL
const CLIENT_CACHE = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 25000;

export function getClientCached<T>(key: string): T | null {
  const entry = CLIENT_CACHE.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    CLIENT_CACHE.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setClientCached<T>(key: string, data: T): void {
  CLIENT_CACHE.set(key, { data, timestamp: Date.now() });
}

export function clearClientCache(): void {
  CLIENT_CACHE.clear();
}

export const D2cApi = {
  clearCache(): void {
    clearClientCache();
  },

  async getWorkspaceBatch(params?: {
    page?: number;
    limit?: number;
    forceRefresh?: boolean;
  }): Promise<D2cWorkspaceBatch> {
    const page = params?.page || 1;
    const limit = params?.limit || 25;
    const cacheKey = `batch_${page}_${limit}`;

    if (!params?.forceRefresh) {
      const cached = getClientCached<D2cWorkspaceBatch>(cacheKey);
      if (cached) return cached;
    }

    const res = await fetch(
      `/api/d2c/proxy/jobs/workspace-batch?page=${page}&limit=${limit}`,
      { cache: 'no-store' },
    );
    const json = await res.json();
    let batch = json?.data;
    if (batch && typeof batch === 'object' && 'data' in batch && (batch as any).data) {
      batch = (batch as any).data;
    }
    if (batch) {
      setClientCached(cacheKey, batch);
      if (batch.metrics) setClientCached('metrics', batch.metrics);
    }
    return batch;
  },

  async getMetrics(forceRefresh = false): Promise<D2cMetrics> {
    if (!forceRefresh) {
      const cached = getClientCached<D2cMetrics>('metrics');
      if (cached) return cached;
    }
    const res = await fetch('/api/d2c/proxy/jobs/metrics', { cache: 'no-store' });
    const json = await res.json();
    let data = json?.data;
    if (data && typeof data === 'object' && 'data' in data && (data as any).data) {
      data = (data as any).data;
    }
    const metrics: D2cMetrics = data || {
      total: 0,
      unassigned: 0,
      assigned: 0,
      inProgress: 0,
      approvalPending: 0,
      cancellationPending: 0,
      crmConfirmed: 0,
      completed: 0,
      highPriority: 0,
    };
    if (data) setClientCached('metrics', metrics);
    return metrics;
  },

  async checkInquiryCode(code: string): Promise<{ exists: boolean; canonical: string; job?: any }> {
    const res = await fetch(`/api/d2c/proxy/jobs/check-inquiry?code=${encodeURIComponent(code)}`);
    return res.json();
  },

  async getJobs(params: Record<string, string | number | undefined>): Promise<{ items: D2cJob[]; total: number; totalPages: number }> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== 'ALL') searchParams.append(k, String(v));
    });
    const res = await fetch(`/api/d2c/proxy/jobs?${searchParams.toString()}`, { cache: 'no-store' });
    const json = await res.json();
    const items = json?.data || [];
    const meta = json?.meta || { total: items.length, totalPages: 1 };
    return { items, total: meta.total, totalPages: meta.totalPages };
  },

  async getJobById(id: string): Promise<D2cJob> {
    const res = await fetch(`/api/d2c/proxy/jobs/${id}`, { cache: 'no-store' });
    const json = await res.json();
    return json?.data;
  },

  async createJob(payload: any): Promise<{ success: boolean; data?: D2cJob; message?: string; existingJobId?: string }> {
    const res = await fetch('/api/d2c/proxy/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.message || 'Failed to register D2C job.');
    }
    clearClientCache();
    return json;
  },

  async updateJob(id: string, payload: any): Promise<any> {
    const res = await fetch(`/api/d2c/proxy/jobs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to update job details.');
    clearClientCache();
    return json;
  },

  async getEligibleTechnicians(jobId: string, search?: string): Promise<EligibleTechnician[]> {
    const url = `/api/d2c/proxy/jobs/${jobId}/eligible-technicians${search ? `?search=${encodeURIComponent(search)}` : ''}`;
    const res = await fetch(url, { cache: 'no-store' });
    const json = await res.json();
    const raw = json?.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(json?.items)) return json.items;
    return [];
  },

  async assignJob(jobId: string, technicianId: string, reason?: string): Promise<any> {
    const res = await fetch(`/api/d2c/proxy/jobs/${jobId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ technicianId, assignmentReason: reason }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to assign technician.');
    clearClientCache();
    return json;
  },

  async reassignJob(jobId: string, technicianId: string, reassignmentReason: string): Promise<any> {
    const res = await fetch(`/api/d2c/proxy/jobs/${jobId}/reassign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ technicianId, reassignmentReason }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to reassign job.');
    clearClientCache();
    return json;
  },

  async updatePriority(jobId: string, isHighPriority: boolean, reason?: string): Promise<any> {
    const res = await fetch(`/api/d2c/proxy/jobs/${jobId}/priority`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isHighPriority, reason }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to update priority.');
    clearClientCache();
    return json;
  },

  async getApprovalRequests(params: Record<string, string | number | undefined>): Promise<any> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== 'ALL') searchParams.append(k, String(v));
    });
    const res = await fetch(`/api/d2c/proxy/approval-requests?${searchParams.toString()}`, { cache: 'no-store' });
    return res.json();
  },

  async approveRequest(requestId: string, remarks?: string, replacementTechnicianId?: string): Promise<any> {
    const res = await fetch(`/api/d2c/proxy/approval-requests/${requestId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remarks, replacementTechnicianId }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to approve request.');
    clearClientCache();
    return json;
  },

  async rejectRequest(requestId: string, reviewReason: string): Promise<any> {
    const res = await fetch(`/api/d2c/proxy/approval-requests/${requestId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewReason }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to reject request.');
    clearClientCache();
    return json;
  },

  async getCancellations(params: Record<string, string | number | undefined>): Promise<any> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== 'ALL') searchParams.append(k, String(v));
    });
    const res = await fetch(`/api/d2c/proxy/cancellations?${searchParams.toString()}`, { cache: 'no-store' });
    return res.json();
  },

  async markCodeReceived(jobId: string, cancellationCode?: string, remark?: string): Promise<any> {
    const res = await fetch(`/api/d2c/proxy/cancellations/${jobId}/code-received`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cancellationCode, remark }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to record code received.');
    clearClientCache();
    return json;
  },

  async confirmCrmCancellation(jobId: string, confirmationRemark?: string, crmReference?: string): Promise<any> {
    const res = await fetch(`/api/d2c/proxy/cancellations/${jobId}/confirm-crm-cancellation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmationRemark, crmReference }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to confirm CRM cancellation.');
    clearClientCache();
    return json;
  },

  async revokeCancellation(
    jobId: string,
    payload?: { newDate?: string; newTimeSlot?: string; technicianId?: string; remark?: string },
  ): Promise<any> {
    const res = await fetch(`/api/d2c/proxy/cancellations/${jobId}/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {}),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to revoke cancellation.');
    clearClientCache();
    return json;
  },

  async getCompletedJobs(params: Record<string, string | number | undefined>): Promise<any> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== 'ALL') searchParams.append(k, String(v));
    });
    const res = await fetch(`/api/d2c/proxy/completed-jobs?${searchParams.toString()}`, { cache: 'no-store' });
    return res.json();
  },

  async getAuditLogs(params: Record<string, string | number | undefined>): Promise<any> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== 'ALL') searchParams.append(k, String(v));
    });
    const res = await fetch(`/api/d2c/proxy/audit-logs?${searchParams.toString()}`, { cache: 'no-store' });
    return res.json();
  },

  async getJobTimeline(jobId: string): Promise<any> {
    const res = await fetch(`/api/d2c/proxy/jobs/${jobId}/timeline`, { cache: 'no-store' });
    return res.json();
  },

  downloadDocument(docId: string, fallbackName?: string) {
    const link = document.createElement('a');
    link.href = `/api/d2c/proxy/documents/${docId}/download`;
    if (fallbackName) link.download = fallbackName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};

/**
 * Standardized Document Filename Formatter:
 * - Bill / Invoice: <customername>_bill.<ext>
 * - Model Plate:    <customername>_model.<ext>
 * - Happy Code:     <customername>_happycode.<ext>
 * - Demo:           <customername>_demo.<ext>
 */
export function formatStandardDocFilename(
  customerName: string,
  typeOrDoc: string,
  mimeTypeOrExt?: string,
): string {
  const safeCustomer = (customerName || 'Customer')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '');

  const upper = (typeOrDoc || '').toUpperCase();
  let suffix = 'document';

  if (
    upper === 'JOB_SHEET_DOCUMENT' ||
    upper.includes('BILL') ||
    upper.includes('INVOICE') ||
    upper.includes('SHEET')
  ) {
    suffix = 'bill';
  } else if (
    upper === 'NAMEPLATE_SCAN' ||
    upper.includes('MODEL') ||
    upper.includes('PLATE') ||
    upper.includes('BARCODE')
  ) {
    suffix = 'model';
  } else if (
    upper === 'PRE_INSPECTION_PHOTO' ||
    upper.includes('HAPPY') ||
    upper.includes('CODE') ||
    upper.includes('INSPECTION') ||
    upper.includes('PRE')
  ) {
    suffix = 'happycode';
  } else if (
    upper === 'POST_REPAIR_PHOTO' ||
    upper.includes('DEMO') ||
    upper.includes('WORKING') ||
    upper.includes('REPAIR') ||
    upper.includes('POST')
  ) {
    suffix = 'demo';
  } else {
    suffix = typeOrDoc.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  }

  let ext = 'jpg';
  if (mimeTypeOrExt) {
    if (mimeTypeOrExt.includes('pdf')) ext = 'pdf';
    else if (mimeTypeOrExt.includes('png')) ext = 'png';
    else if (mimeTypeOrExt.includes('webp')) ext = 'webp';
    else if (mimeTypeOrExt.includes('jpeg') || mimeTypeOrExt.includes('jpg')) ext = 'jpg';
    else if (mimeTypeOrExt.includes('.')) ext = mimeTypeOrExt.split('.').pop() || 'jpg';
  }

  return `${safeCustomer}_${suffix}.${ext}`;
}
