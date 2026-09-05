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

export const MOCK_TECHNICIANS: TechnicianMock[] = [
  {
    id: 'tech_01',
    userId: 'usr_tech_01',
    fullName: 'Rajesh Kumar',
    phone: '+919876543210',
    email: 'rajesh.kumar@mubryx.com',
    dateOfBirth: '1992-05-14',
    gender: 'MALE',
    currentCity: 'Ahmedabad',
    pinCode: '380015',
    bio: 'Certified master electrician with 7 years of industrial & home electrical fitting experience.',
    experienceYears: 7,
    onboardingStatus: 'UNDER_REVIEW',
    submittedAt: '2026-08-08T10:30:00Z',
    profilePhoto: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-08T10:30:00Z',
    skills: [
      { id: 'cat_elec', name: 'Electrical Wiring', slug: 'electrical-wiring', description: 'Switchboards, MCB, Wiring repairs' },
      { id: 'cat_appl', name: 'Appliance Repair', slug: 'appliance-repair', description: 'AC, Washing machine, Microwave' },
    ],
    experiences: [
      {
        id: 'exp_01',
        technicianId: 'tech_01',
        totalExperience: '5 Years',
        companyName: 'Torrent Power Electricals',
        role: 'Senior Electrician',
        startDate: '2019-01',
        endDate: '2024-02',
        city: 'Ahmedabad',
        responsibilities: 'Maintained transformer systems, high-voltage wiring, residential trouble resolution.'
      },
      {
        id: 'exp_02',
        technicianId: 'tech_01',
        totalExperience: '2 Years',
        companyName: 'Self-Employed / Independent Contractor',
        role: 'Home Services Specialist',
        startDate: '2024-03',
        endDate: 'Present',
        city: 'Ahmedabad',
        responsibilities: 'On-demand home electrical installations, emergency callouts, smart home switch setups.'
      }
    ],
    documents: [
      {
        id: 'doc_01',
        technicianId: 'tech_01',
        type: 'AADHAAR',
        documentNumber: '4589 1204 8892',
        objectKey: 'technicians/tech_01/documents/AADHAAR_1723112000.pdf',
        mimeType: 'image/jpeg',
        fileSize: 1420000,
        createdAt: '2026-08-08T10:15:00Z',
        updatedAt: '2026-08-08T10:15:00Z',
        status: 'VERIFIED',
        previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80'
      },
      {
        id: 'doc_02',
        technicianId: 'tech_01',
        type: 'PAN',
        documentNumber: 'ABCDE1234F',
        objectKey: 'technicians/tech_01/documents/PAN_1723112100.jpg',
        mimeType: 'image/jpeg',
        fileSize: 980000,
        createdAt: '2026-08-08T10:20:00Z',
        updatedAt: '2026-08-08T10:20:00Z',
        status: 'PENDING',
        previewUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    id: 'tech_02',
    userId: 'usr_tech_02',
    fullName: 'Priya Sharma',
    phone: '+919812345678',
    email: 'priya.sharma@mubryx.com',
    dateOfBirth: '1995-11-20',
    gender: 'FEMALE',
    currentCity: 'Surat',
    pinCode: '395007',
    bio: 'Professional plumber & sanitation engineer specializing in modern bathroom fixtures and leak detection.',
    experienceYears: 5,
    onboardingStatus: 'SUBMITTED',
    submittedAt: '2026-08-09T14:20:00Z',
    profilePhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-08-05T09:00:00Z',
    updatedAt: '2026-08-09T14:20:00Z',
    skills: [
      { id: 'cat_plumb', name: 'Plumbing & Drainage', slug: 'plumbing-drainage', description: 'Pipe fitting, Leak repairs, Tap & Flush fixing' },
    ],
    experiences: [
      {
        id: 'exp_03',
        technicianId: 'tech_02',
        totalExperience: '5 Years',
        companyName: 'L&T Plumbing Solutions',
        role: 'Senior Plumbing Technician',
        startDate: '2021-04',
        endDate: 'Present',
        city: 'Surat',
        responsibilities: 'Commercial pipeline installation, water heater repairs, drainage unblocking.'
      }
    ],
    documents: [
      {
        id: 'doc_03',
        technicianId: 'tech_02',
        type: 'AADHAAR',
        documentNumber: '8910 4421 9901',
        objectKey: 'technicians/tech_02/documents/AADHAAR_1723200000.png',
        mimeType: 'image/png',
        fileSize: 2100000,
        createdAt: '2026-08-09T14:00:00Z',
        updatedAt: '2026-08-09T14:00:00Z',
        status: 'PENDING',
        previewUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80'
      },
      {
        id: 'doc_04',
        technicianId: 'tech_02',
        type: 'PAN',
        documentNumber: 'PQRSW5678K',
        objectKey: 'technicians/tech_02/documents/PAN_1723200100.png',
        mimeType: 'image/png',
        fileSize: 1800000,
        createdAt: '2026-08-09T14:10:00Z',
        updatedAt: '2026-08-09T14:10:00Z',
        status: 'PENDING',
        previewUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80'
      },
      {
        id: 'doc_05',
        technicianId: 'tech_02',
        type: 'DRIVING_LICENSE',
        documentNumber: 'GJ-05-2018-009281',
        objectKey: 'technicians/tech_02/documents/DRIVING_LICENSE_1723200150.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1200000,
        createdAt: '2026-08-09T14:15:00Z',
        updatedAt: '2026-08-09T14:15:00Z',
        status: 'PENDING',
        previewUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    id: 'tech_03',
    userId: 'usr_tech_03',
    fullName: 'Amit Patel',
    phone: '+919723456789',
    email: 'amit.patel@mubryx.com',
    dateOfBirth: '1988-03-10',
    gender: 'MALE',
    currentCity: 'Vadodara',
    pinCode: '390001',
    bio: 'AC Repair & HVAC expert with over 10 years in split, window, and central duct cooling services.',
    experienceYears: 10,
    onboardingStatus: 'APPROVED',
    submittedAt: '2026-07-25T11:00:00Z',
    profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-07-20T10:00:00Z',
    updatedAt: '2026-07-26T16:45:00Z',
    skills: [
      { id: 'cat_ac', name: 'AC Servicing & Repair', slug: 'ac-servicing', description: 'Gas refill, Filter cleaning, Compressor repair' },
      { id: 'cat_appl', name: 'Appliance Repair', slug: 'appliance-repair', description: 'Refrigerator & Washing Machine' }
    ],
    experiences: [
      {
        id: 'exp_04',
        technicianId: 'tech_03',
        totalExperience: '10 Years',
        companyName: 'Voltas Authorized Service Center',
        role: 'Lead HVAC Engineer',
        startDate: '2014-06',
        endDate: '2026-01',
        city: 'Vadodara',
        responsibilities: 'Managed team of 12 HVAC technicians, split & cassette AC troubleshooting.'
      }
    ],
    documents: [
      {
        id: 'doc_06',
        technicianId: 'tech_03',
        type: 'AADHAAR',
        documentNumber: '6712 9012 3411',
        objectKey: 'technicians/tech_03/documents/AADHAAR_1721900000.pdf',
        mimeType: 'application/pdf',
        fileSize: 1100000,
        createdAt: '2026-07-25T10:00:00Z',
        updatedAt: '2026-07-26T16:00:00Z',
        status: 'VERIFIED'
      },
      {
        id: 'doc_07',
        technicianId: 'tech_03',
        type: 'PAN',
        documentNumber: 'LMNOP9876Z',
        objectKey: 'technicians/tech_03/documents/PAN_1721900100.jpg',
        mimeType: 'image/jpeg',
        fileSize: 850000,
        createdAt: '2026-07-25T10:30:00Z',
        updatedAt: '2026-07-26T16:00:00Z',
        status: 'VERIFIED'
      }
    ]
  },
  {
    id: 'tech_04',
    userId: 'usr_tech_04',
    fullName: 'Vikram Singh',
    phone: '+919988776655',
    email: 'vikram.singh@mubryx.com',
    dateOfBirth: '1996-08-19',
    gender: 'MALE',
    currentCity: 'Rajkot',
    pinCode: '360005',
    bio: 'Carpenter & woodwork specialist for custom furniture assembly, modular kitchen installation, and door repairs.',
    experienceYears: 4,
    onboardingStatus: 'REJECTED',
    submittedAt: '2026-08-02T16:00:00Z',
    profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-08-01T12:00:00Z',
    updatedAt: '2026-08-03T11:20:00Z',
    reviewNotes: 'PAN card image was blurry and unreadable. Aadhaar address mismatch with current city.',
    skills: [
      { id: 'cat_carp', name: 'Carpentry & Woodwork', slug: 'carpentry', description: 'Furniture repair, Door lock fitting, Wood polish' }
    ],
    experiences: [
      {
        id: 'exp_05',
        technicianId: 'tech_04',
        totalExperience: '4 Years',
        companyName: 'Royal Furniture Workshop',
        role: 'Junior Carpenter',
        startDate: '2020-01',
        endDate: '2024-07',
        city: 'Rajkot',
        responsibilities: 'Custom plywood cutting, veneer pressing, cupboard assembly.'
      }
    ],
    documents: [
      {
        id: 'doc_08',
        technicianId: 'tech_04',
        type: 'AADHAAR',
        documentNumber: '1122 3344 5566',
        objectKey: 'technicians/tech_04/documents/AADHAAR_1722600000.jpg',
        mimeType: 'image/jpeg',
        fileSize: 950000,
        createdAt: '2026-08-02T15:30:00Z',
        updatedAt: '2026-08-03T11:20:00Z',
        status: 'REJECTED',
        rejectionReason: 'Address on Aadhaar card does not match city provided'
      },
      {
        id: 'doc_09',
        technicianId: 'tech_04',
        type: 'PAN',
        documentNumber: 'VWXYZ1122M',
        objectKey: 'technicians/tech_04/documents/PAN_1722600100.png',
        mimeType: 'image/png',
        fileSize: 450000,
        createdAt: '2026-08-02T15:45:00Z',
        updatedAt: '2026-08-03T11:20:00Z',
        status: 'REJECTED',
        rejectionReason: 'Image is extremely blurry and text is illegible'
      }
    ]
  },
  {
    id: 'tech_05',
    userId: 'usr_tech_05',
    fullName: 'Sangeeta Mehta',
    phone: '+919654321098',
    email: 'sangeeta.mehta@mubryx.com',
    dateOfBirth: '1994-02-04',
    gender: 'FEMALE',
    currentCity: 'Ahmedabad',
    pinCode: '380054',
    bio: 'Professional home deep cleaning & pest control expert with eco-friendly sanitization solutions.',
    experienceYears: 6,
    onboardingStatus: 'DRAFT',
    submittedAt: null,
    profilePhoto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-08-10T07:15:00Z',
    updatedAt: '2026-08-10T07:30:00Z',
    skills: [
      { id: 'cat_clean', name: 'Home Deep Cleaning', slug: 'home-cleaning', description: 'Kitchen, Bathroom, Sofa & Carpet deep cleaning' }
    ],
    experiences: [
      {
        id: 'exp_06',
        technicianId: 'tech_05',
        totalExperience: '6 Years',
        companyName: 'CleanHome Services Pvt Ltd',
        role: 'Cleaning Team Lead',
        startDate: '2018-05',
        endDate: '2024-05',
        city: 'Ahmedabad',
        responsibilities: 'Supervised 5-member cleaning crews for luxury villas and corporate offices.'
      }
    ],
    documents: [
      {
        id: 'doc_10',
        technicianId: 'tech_05',
        type: 'AADHAAR',
        documentNumber: '9988 7766 5544',
        objectKey: 'technicians/tech_05/documents/AADHAAR_1723270000.pdf',
        mimeType: 'application/pdf',
        fileSize: 1300000,
        createdAt: '2026-08-10T07:25:00Z',
        updatedAt: '2026-08-10T07:25:00Z',
        status: 'PENDING'
      }
    ]
  },
  {
    id: 'tech_06',
    userId: 'usr_tech_06',
    fullName: 'Manoj Verma',
    phone: '+919543210987',
    email: 'manoj.verma@mubryx.com',
    dateOfBirth: '1990-12-01',
    gender: 'MALE',
    currentCity: 'Gandhinagar',
    pinCode: '382010',
    bio: 'House painting & waterproofing expert with airless sprayer proficiency.',
    experienceYears: 8,
    onboardingStatus: 'SUSPENDED',
    submittedAt: '2026-06-10T09:00:00Z',
    profilePhoto: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-08-01T14:10:00Z',
    reviewNotes: 'Suspended due to multiple customer safety complaints and policy violations.',
    skills: [
      { id: 'cat_paint', name: 'Painting & Waterproofing', slug: 'painting', description: 'Wall painting, Texture coat, Terrace waterproofing' }
    ],
    experiences: [
      {
        id: 'exp_07',
        technicianId: 'tech_06',
        totalExperience: '8 Years',
        companyName: 'Asian Paints Authorized Decorator',
        role: 'Master Painter',
        startDate: '2016-02',
        endDate: '2024-04',
        city: 'Gandhinagar',
        responsibilities: 'Interior/exterior wall painting, dampness treatments.'
      }
    ],
    documents: [
      {
        id: 'doc_11',
        technicianId: 'tech_06',
        type: 'AADHAAR',
        documentNumber: '3344 5566 7788',
        objectKey: 'technicians/tech_06/documents/AADHAAR_1718000000.pdf',
        mimeType: 'application/pdf',
        fileSize: 1500000,
        createdAt: '2026-06-10T08:30:00Z',
        updatedAt: '2026-06-10T09:00:00Z',
        status: 'VERIFIED'
      },
      {
        id: 'doc_12',
        technicianId: 'tech_06',
        type: 'PAN',
        documentNumber: 'JKLMN4433P',
        objectKey: 'technicians/tech_06/documents/PAN_1718000100.jpg',
        mimeType: 'image/jpeg',
        fileSize: 900000,
        createdAt: '2026-06-10T08:45:00Z',
        updatedAt: '2026-06-10T09:00:00Z',
        status: 'VERIFIED'
      }
    ]
  },
  {
    id: 'tech_07',
    userId: 'usr_tech_07',
    fullName: 'Anil Joshi',
    phone: '+919423456781',
    email: 'anil.joshi@mubryx.com',
    dateOfBirth: '1993-09-18',
    gender: 'MALE',
    currentCity: 'Ahmedabad',
    pinCode: '380009',
    bio: 'Dual specialist in electrical fitting and plumbing maintenance for residential complexes.',
    experienceYears: 6,
    onboardingStatus: 'SUBMITTED',
    submittedAt: '2026-08-10T09:45:00Z',
    profilePhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-08-08T11:00:00Z',
    updatedAt: '2026-08-10T09:45:00Z',
    skills: [
      { id: 'cat_elec', name: 'Electrical Wiring', slug: 'electrical-wiring', description: 'Switchboards, MCB, Wiring repairs' },
      { id: 'cat_plumb', name: 'Plumbing & Drainage', slug: 'plumbing-drainage', description: 'Pipe fitting, Leak repairs, Tap & Flush fixing' }
    ],
    experiences: [
      {
        id: 'exp_08',
        technicianId: 'tech_07',
        totalExperience: '6 Years',
        companyName: 'City Maintenance Services',
        role: 'Facility Maintenance Tech',
        startDate: '2018-08',
        endDate: '2024-06',
        city: 'Ahmedabad',
        responsibilities: 'Complete residential society electrical & plumbing upkeep.'
      }
    ],
    documents: [
      {
        id: 'doc_13',
        technicianId: 'tech_07',
        type: 'AADHAAR',
        documentNumber: '7788 9900 1122',
        objectKey: 'technicians/tech_07/documents/AADHAAR_1723282800.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1750000,
        createdAt: '2026-08-10T09:30:00Z',
        updatedAt: '2026-08-10T09:30:00Z',
        status: 'PENDING',
        previewUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80'
      },
      {
        id: 'doc_14',
        technicianId: 'tech_07',
        type: 'PAN',
        documentNumber: 'GHJKL8877Q',
        objectKey: 'technicians/tech_07/documents/PAN_1723282900.png',
        mimeType: 'image/png',
        fileSize: 1350000,
        createdAt: '2026-08-10T09:40:00Z',
        updatedAt: '2026-08-10T09:40:00Z',
        status: 'PENDING',
        previewUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    id: 'tech_08',
    userId: 'usr_tech_08',
    fullName: 'Deepak Solanki',
    phone: '+919312345672',
    email: 'deepak.solanki@mubryx.com',
    dateOfBirth: '1991-04-25',
    gender: 'MALE',
    currentCity: 'Vadodara',
    pinCode: '390020',
    bio: 'Washing machine and refrigerator servicing technician with inverter model expertise.',
    experienceYears: 5,
    onboardingStatus: 'UNDER_REVIEW',
    submittedAt: '2026-08-07T14:10:00Z',
    profilePhoto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-08-05T12:00:00Z',
    updatedAt: '2026-08-07T14:10:00Z',
    reviewNotes: 'Pending PAN card re-upload. Aadhaar verified.',
    skills: [
      { id: 'cat_appl', name: 'Appliance Repair', slug: 'appliance-repair', description: 'AC, Washing machine, Microwave' }
    ],
    experiences: [
      {
        id: 'exp_09',
        technicianId: 'tech_08',
        totalExperience: '5 Years',
        companyName: 'LG Care India',
        role: 'Appliance Service Engineer',
        startDate: '2019-03',
        endDate: '2024-04',
        city: 'Vadodara',
        responsibilities: 'Front-load washing machine PCB repair and compressor replacement.'
      }
    ],
    documents: [
      {
        id: 'doc_15',
        technicianId: 'tech_08',
        type: 'AADHAAR',
        documentNumber: '5566 7788 9900',
        objectKey: 'technicians/tech_08/documents/AADHAAR_1723040000.pdf',
        mimeType: 'application/pdf',
        fileSize: 1600000,
        createdAt: '2026-08-07T13:50:00Z',
        updatedAt: '2026-08-07T14:00:00Z',
        status: 'VERIFIED'
      },
      {
        id: 'doc_16',
        technicianId: 'tech_08',
        type: 'PAN',
        documentNumber: 'ZXCVB9900R',
        objectKey: 'technicians/tech_08/documents/PAN_1723040100.jpg',
        mimeType: 'image/jpeg',
        fileSize: 410000,
        createdAt: '2026-08-07T14:00:00Z',
        updatedAt: '2026-08-07T14:10:00Z',
        status: 'REJECTED',
        rejectionReason: 'Document image was cut off and name was partially truncated'
      }
    ]
  }
];

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
