export type UserRole = 'CUSTOMER' | 'TECHNICIAN' | 'ADMIN' | 'SUPER_ADMIN';

export type OnboardingStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export type DocumentType = 
  | 'AADHAAR'
  | 'PAN'
  | 'DRIVING_LICENSE'
  | 'PASSPORT'
  | 'VOTER_ID'
  | 'OTHER';

export interface TechnicianDocumentMock {
  id: string;
  technicianId: string;
  type: DocumentType;
  objectKey: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
  documentNumber?: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rejectionReason?: string;
  previewUrl?: string;
}

export interface TechnicianExperienceMock {
  id: string;
  technicianId: string;
  totalExperience: string;
  companyName: string;
  role: string;
  startDate: string;
  endDate: string;
  city?: string;
  responsibilities?: string;
}

export interface CategorySkillMock {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface TechnicianMock {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: Gender;
  currentCity: string;
  pinCode: string;
  bio: string;
  experienceYears: number;
  onboardingStatus: OnboardingStatus;
  submittedAt: string | null;
  profilePhoto: string;
  createdAt: string;
  updatedAt: string;
  skills: CategorySkillMock[];
  experiences: TechnicianExperienceMock[];
  documents: TechnicianDocumentMock[];
  reviewNotes?: string;
}



export function getStatusBadgeColor(status: OnboardingStatus): string {
  switch (status) {
    case 'SUBMITTED':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'UNDER_REVIEW':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'APPROVED':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'REJECTED':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    case 'SUSPENDED':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'DRAFT':
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function formatDocType(type: DocumentType): string {
  switch (type) {
    case 'AADHAAR':
      return 'Aadhaar Card';
    case 'PAN':
      return 'PAN Card';
    case 'DRIVING_LICENSE':
      return 'Driving License';
    case 'PASSPORT':
      return 'Passport';
    case 'VOTER_ID':
      return 'Voter ID';
    default:
      return 'Other Document';
  }
}
