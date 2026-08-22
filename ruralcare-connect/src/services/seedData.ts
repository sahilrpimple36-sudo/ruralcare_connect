import { Doctor, Hospital, User, Appointment, Availability, Consultation, Referral, HealthAssessment } from '../types';


export const SEED_SPECIALTIES = [
  'Oncology',
  'Cardiology',
  'Neurology',
  'Dermatology',
  'Orthopedics',
  'Pediatrics',
  'Gynecology',
  'ENT',
  'Psychiatry',
  'General Medicine'
];

export const SEED_HOSPITALS: Hospital[] = [
  {
    id: 'hosp-1',
    name: 'National Oncology & Cancer Institute',
    city: 'Mumbai',
    district: 'Mumbai City',
    state: 'Maharashtra',
    latitude: 19.0020,
    longitude: 72.8428,
    address: '12, Sector 4, Parel, Mumbai, 400012',
    specialties: ['Oncology', 'Gynecology'],
    phone: '+91 22 5555 1234',
    teleconsultationAvailable: true
  },
  {
    id: 'hosp-2',
    name: 'Apex Heart & Cardiology Institute',
    city: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
    latitude: 18.5314,
    longitude: 73.8446,
    address: '78, University Road, Shivaji Nagar, Pune, 411005',
    specialties: ['Cardiology', 'General Medicine'],
    phone: '+91 20 5555 5678',
    teleconsultationAvailable: true
  },
  {
    id: 'hosp-3',
    name: 'Rural Wellness Hospital',
    city: 'Nagpur',
    district: 'Nagpur',
    state: 'Maharashtra',
    latitude: 21.1458,
    longitude: 79.0882,
    address: 'Vikas Marg, Near Bus Stand, Nagpur, 440001',
    specialties: ['General Medicine', 'Pediatrics', 'ENT'],
    phone: '+91 712 5555 9012',
    teleconsultationAvailable: true
  },
  {
    id: 'hosp-4',
    name: 'Community Care Center',
    city: 'Amravati',
    district: 'Amravati',
    state: 'Maharashtra',
    latitude: 20.9320,
    longitude: 77.7523,
    address: 'Station Road, Badnera, Amravati, 444601',
    specialties: ['General Medicine', 'Pediatrics', 'Dermatology'],
    phone: '+91 721 5555 3456',
    teleconsultationAvailable: true
  },
  {
    id: 'hosp-5',
    name: 'District General Hospital',
    city: 'Satara',
    district: 'Satara',
    state: 'Maharashtra',
    latitude: 17.6805,
    longitude: 73.9918,
    address: 'Sadar Bazar, Satara, 415001',
    specialties: ['Orthopedics', 'Gynecology', 'Neurology', 'Psychiatry'],
    phone: '+91 2162 555 7890',
    teleconsultationAvailable: true
  }
];

export const SEED_DOCTORS: Doctor[] = [
  {
    id: 'doc-1',
    name: 'Dr. Priya Sharma',
    specialty: 'Oncology',
    qualifications: 'MD, DM (Oncology)',
    experience: 12,
    hospitalId: 'hosp-1',
    city: 'Mumbai',
    state: 'Maharashtra',
    latitude: 19.0020,
    longitude: 72.8428,
    consultationFee: 500,
    teleconsultationAvailable: true,
    availabilityStatus: 'available',
    verificationStatus: 'verified',
    profileImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    areasOfSpecialization: ['Breast Cancer', 'Chemotherapy', 'Immunotherapy']
  },
  {
    id: 'doc-2',
    name: 'Dr. Rahul Patil',
    specialty: 'Cardiology',
    qualifications: 'MD, DNB (Cardiology)',
    experience: 15,
    hospitalId: 'hosp-2',
    city: 'Pune',
    state: 'Maharashtra',
    latitude: 18.5314,
    longitude: 73.8446,
    consultationFee: 600,
    teleconsultationAvailable: true,
    availabilityStatus: 'available',
    verificationStatus: 'verified',
    profileImage: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
    areasOfSpecialization: ['Heart Blockage', 'Hypertension', 'Angioplasty']
  },
  {
    id: 'doc-3',
    name: 'Dr. Amit Verma',
    specialty: 'Neurology',
    qualifications: 'MD, DM (Neurology)',
    experience: 10,
    hospitalId: 'hosp-5',
    city: 'Satara',
    state: 'Maharashtra',
    latitude: 17.6805,
    longitude: 73.9918,
    consultationFee: 550,
    teleconsultationAvailable: true,
    availabilityStatus: 'available',
    verificationStatus: 'verified',
    profileImage: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300',
    areasOfSpecialization: ['Migraine', 'Stroke Recovery', 'Epilepsy']
  },
  {
    id: 'doc-4',
    name: 'Dr. Sunita Rao',
    specialty: 'Dermatology',
    qualifications: 'MD (Dermatology, Venereology)',
    experience: 8,
    hospitalId: 'hosp-4',
    city: 'Amravati',
    state: 'Maharashtra',
    latitude: 20.9320,
    longitude: 77.7523,
    consultationFee: 400,
    teleconsultationAvailable: true,
    availabilityStatus: 'available',
    verificationStatus: 'verified',
    profileImage: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=300',
    areasOfSpecialization: ['Skin Infections', 'Eczema', 'Allergy Management']
  },
  {
    id: 'doc-5',
    name: 'Dr. Vikram Singh',
    specialty: 'Orthopedics',
    qualifications: 'MS (Orthopedics), M.Ch',
    experience: 14,
    hospitalId: 'hosp-5',
    city: 'Satara',
    state: 'Maharashtra',
    latitude: 17.6805,
    longitude: 73.9918,
    consultationFee: 450,
    teleconsultationAvailable: true,
    availabilityStatus: 'available',
    verificationStatus: 'verified',
    profileImage: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300',
    areasOfSpecialization: ['Joint Pain', 'Fractures', 'Spine Disorders']
  },
  {
    id: 'doc-6',
    name: 'Dr. Meera Nair',
    specialty: 'Pediatrics',
    qualifications: 'MD (Pediatrics), DCH',
    experience: 9,
    hospitalId: 'hosp-3',
    city: 'Nagpur',
    state: 'Maharashtra',
    latitude: 21.1458,
    longitude: 79.0882,
    consultationFee: 350,
    teleconsultationAvailable: true,
    availabilityStatus: 'available',
    verificationStatus: 'verified',
    profileImage: 'https://images.unsplash.com/photo-1651008011912-bde19b4b2797?auto=format&fit=crop&q=80&w=300',
    areasOfSpecialization: ['Childhood Nutrition', 'Vaccination', 'Pediatric Asthma']
  },
  {
    id: 'doc-7',
    name: 'Dr. Anjali Gupta',
    specialty: 'Gynecology',
    qualifications: 'MS (Obstetrics & Gynecology)',
    experience: 11,
    hospitalId: 'hosp-1',
    city: 'Mumbai',
    state: 'Maharashtra',
    latitude: 19.0020,
    longitude: 72.8428,
    consultationFee: 500,
    teleconsultationAvailable: true,
    availabilityStatus: 'available',
    verificationStatus: 'verified',
    profileImage: 'https://images.unsplash.com/photo-1591604021695-0c69b7c05981?auto=format&fit=crop&q=80&w=300',
    areasOfSpecialization: ['Pregnancy Care', 'PCOS', 'Maternal Health']
  },
  {
    id: 'doc-8',
    name: 'Dr. Sandeep Kapoor',
    specialty: 'ENT',
    qualifications: 'MS (Otorhinolaryngology)',
    experience: 13,
    hospitalId: 'hosp-3',
    city: 'Nagpur',
    state: 'Maharashtra',
    latitude: 21.1458,
    longitude: 79.0882,
    consultationFee: 400,
    teleconsultationAvailable: true,
    availabilityStatus: 'available',
    verificationStatus: 'verified',
    profileImage: 'https://images.unsplash.com/photo-1536064402075-e85c4c37953c?auto=format&fit=crop&q=80&w=300',
    areasOfSpecialization: ['Sinusitis', 'Hearing Loss', 'Tonsils']
  },
  {
    id: 'doc-9',
    name: 'Dr. Rajesh Kumar',
    specialty: 'Psychiatry',
    qualifications: 'MD (Psychiatry), DPM',
    experience: 7,
    hospitalId: 'hosp-5',
    city: 'Satara',
    state: 'Maharashtra',
    latitude: 17.6805,
    longitude: 73.9918,
    consultationFee: 500,
    teleconsultationAvailable: true,
    availabilityStatus: 'available',
    verificationStatus: 'verified',
    profileImage: 'https://images.unsplash.com/photo-1582750433449-6493b2060ed8?auto=format&fit=crop&q=80&w=300',
    areasOfSpecialization: ['Anxiety Disorders', 'Rural Mental Health', 'Depression']
  },
  {
    id: 'doc-10',
    name: 'Dr. Kavitha Reddy',
    specialty: 'General Medicine',
    qualifications: 'MBBS, MD (General Medicine)',
    experience: 16,
    hospitalId: 'hosp-2',
    city: 'Pune',
    state: 'Maharashtra',
    latitude: 18.5314,
    longitude: 73.8446,
    consultationFee: 300,
    teleconsultationAvailable: true,
    availabilityStatus: 'available',
    verificationStatus: 'verified',
    profileImage: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=300',
    areasOfSpecialization: ['Diabetes Control', 'Infectious Diseases', 'General Wellness']
  }
];

export const SEED_PATIENTS: User[] = [
  {
    id: 'pat-1',
    name: 'Ramesh Sawant',
    email: 'ramesh@demo.com',
    role: 'patient',
    phone: '+91 98765 43210',
    village: 'Kasba',
    district: 'Satara',
    state: 'Maharashtra',
    latitude: 17.6805,
    longitude: 73.9918,
    createdAt: new Date().toISOString()
  },
  {
    id: 'pat-2',
    name: 'Sita Bai',
    email: 'sitabai@demo.com',
    role: 'patient',
    phone: '+91 98765 43211',
    village: 'Pargaon',
    district: 'Pune',
    state: 'Maharashtra',
    latitude: 18.5204,
    longitude: 73.8567,
    createdAt: new Date().toISOString()
  },
  {
    id: 'pat-3',
    name: 'Gopal Patil',
    email: 'gopal@demo.com',
    role: 'patient',
    phone: '+91 98765 43212',
    village: 'Shelu',
    district: 'Amravati',
    state: 'Maharashtra',
    latitude: 20.9320,
    longitude: 77.7523,
    createdAt: new Date().toISOString()
  }
];

export const SEED_USERS: User[] = [
  // Patients
  ...SEED_PATIENTS,
  // Doctors
  ...SEED_DOCTORS.map(doc => ({
    id: doc.id,
    name: doc.name,
    email: `${doc.id}@demo.com`,
    role: 'doctor' as const,
    phone: '+91 99999 88888',
    village: '',
    district: doc.city,
    state: doc.state,
    createdAt: new Date().toISOString()
  })),
  // Admins
  {
    id: 'admin-1',
    name: 'RuralCare Admin',
    email: 'admin@demo.com',
    role: 'admin' as const,
    phone: '+91 90000 00000',
    createdAt: new Date().toISOString()
  }
];

export const SEED_AVAILABILITY = (docId: string): Availability[] => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const nextDate = new Date();
    nextDate.setDate(today.getDate() + i);
    dates.push(nextDate.toISOString().split('T')[0]);
  }

  return dates.map((date, idx) => ({
    id: `avail-${docId}-${idx}`,
    doctorId: docId,
    date,
    slots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']
  }));
};

export const SEED_APPOINTMENTS = [
  {
    id: 'RC-APT-2026-0001',
    patientId: 'pat-1',
    doctorId: 'doc-1', // Dr. Priya Sharma - Oncology
    hospitalId: 'hosp-1',
    specialty: 'Oncology',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    consultationType: 'video' as const,
    status: 'confirmed' as const,
    createdAt: new Date().toISOString()
  },
  {
    id: 'RC-APT-2026-0002',
    patientId: 'pat-1',
    doctorId: 'doc-2', // Dr. Rahul Patil - Cardiology
    hospitalId: 'hosp-2',
    specialty: 'Cardiology',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    consultationType: 'video' as const,
    status: 'confirmed' as const,
    createdAt: new Date().toISOString()
  },
  {
    id: 'RC-APT-2026-0003',
    patientId: 'pat-1',
    doctorId: 'doc-3', // Dr. Amit Verma - Neurology
    hospitalId: 'hosp-5',
    specialty: 'Neurology',
    date: new Date().toISOString().split('T')[0],
    time: '11:00',
    consultationType: 'video' as const,
    status: 'confirmed' as const,
    createdAt: new Date().toISOString()
  },
  {
    id: 'RC-APT-2026-0004',
    patientId: 'pat-1',
    doctorId: 'doc-4', // Dr. Sunita Rao - Dermatology
    hospitalId: 'hosp-4',
    specialty: 'Dermatology',
    date: new Date().toISOString().split('T')[0],
    time: '12:00',
    consultationType: 'video' as const,
    status: 'confirmed' as const,
    createdAt: new Date().toISOString()
  },
  {
    id: 'RC-APT-2026-0005',
    patientId: 'pat-1',
    doctorId: 'doc-5', // Dr. Vikram Singh - Orthopedics
    hospitalId: 'hosp-5',
    specialty: 'Orthopedics',
    date: new Date().toISOString().split('T')[0],
    time: '14:00',
    consultationType: 'video' as const,
    status: 'confirmed' as const,
    createdAt: new Date().toISOString()
  },
  {
    id: 'RC-APT-2026-0006',
    patientId: 'pat-1',
    doctorId: 'doc-6', // Dr. Meera Nair - Pediatrics
    hospitalId: 'hosp-3',
    specialty: 'Pediatrics',
    date: new Date().toISOString().split('T')[0],
    time: '15:00',
    consultationType: 'video' as const,
    status: 'confirmed' as const,
    createdAt: new Date().toISOString()
  },
  {
    id: 'RC-APT-2026-0007',
    patientId: 'pat-1',
    doctorId: 'doc-7', // Dr. Anjali Gupta - Gynecology
    hospitalId: 'hosp-1',
    specialty: 'Gynecology',
    date: new Date().toISOString().split('T')[0],
    time: '16:00',
    consultationType: 'video' as const,
    status: 'confirmed' as const,
    createdAt: new Date().toISOString()
  },
  {
    id: 'RC-APT-2026-0008',
    patientId: 'pat-1',
    doctorId: 'doc-8', // Dr. Sandeep Kapoor - ENT
    hospitalId: 'hosp-3',
    specialty: 'ENT',
    date: new Date().toISOString().split('T')[0],
    time: '17:00',
    consultationType: 'video' as const,
    status: 'confirmed' as const,
    createdAt: new Date().toISOString()
  },
  {
    id: 'RC-APT-2026-0009',
    patientId: 'pat-1',
    doctorId: 'doc-9', // Dr. Rajesh Kumar - Psychiatry
    hospitalId: 'hosp-5',
    specialty: 'Psychiatry',
    date: new Date().toISOString().split('T')[0],
    time: '18:00',
    consultationType: 'video' as const,
    status: 'confirmed' as const,
    createdAt: new Date().toISOString()
  },
  {
    id: 'RC-APT-2026-0010',
    patientId: 'pat-1',
    doctorId: 'doc-10', // Dr. Kavitha Reddy - General Medicine
    hospitalId: 'hosp-2',
    specialty: 'General Medicine',
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    consultationType: 'video' as const,
    status: 'confirmed' as const,
    createdAt: new Date().toISOString()
  }
];

export const SEED_CONSULTATIONS: Consultation[] = [
  {
    id: 'RC-APT-2026-0003',
    appointmentId: 'RC-APT-2026-0003',
    patientId: 'pat-1',
    doctorId: 'doc-3',
    notes: 'Patient complained of frequent migraines. Prescribed mild analgesics and recommended reduced screen time.',
    recommendations: 'Take Paracetamol 500mg as needed, max twice a day. Get eyes checked locally.',
    followUpRequired: true,
    followUpDate: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0], // in 10 days
    followUpPriority: 'high',
    followUpNote: 'Review neurological symptoms and headache frequency log.',
    completedAt: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

export const SEED_REFERRALS: Referral[] = [
  {
    id: 'ref-1',
    patientId: 'pat-1',
    patientName: 'Ramesh Sawant',
    doctorId: 'doc-1',
    doctorName: 'Dr. Priya Sharma',
    appointmentId: 'RC-APT-2026-0001',
    hospitalId: 'hosp-1',
    hospitalName: 'National Oncology & Cancer Institute',
    specialty: 'Oncology',
    reason: 'Advanced physical biopsy and staging scan required.',
    status: 'appointment_requested',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    viewedAt: new Date(Date.now() - 80000000).toISOString(),
    acceptedAt: new Date(Date.now() - 70000000).toISOString(),
    appointmentRequestedAt: new Date(Date.now() - 60000000).toISOString()
  },
  {
    id: 'ref-2',
    patientId: 'pat-2',
    patientName: 'Sita Bai',
    doctorId: 'doc-2',
    doctorName: 'Dr. Rahul Patil',
    appointmentId: 'RC-APT-2026-0002',
    hospitalId: 'hosp-2',
    hospitalName: 'Apex Heart & Cardiology Institute',
    specialty: 'Cardiology',
    reason: 'Echocardiogram and in-person cardiac evaluation.',
    status: 'created',
    createdAt: new Date().toISOString()
  }
];

export const SEED_HEALTH_ASSESSMENTS: HealthAssessment[] = [
  {
    id: 'assess-1',
    patientId: 'pat-1',
    mainConcern: 'Cancer-related concern',
    duration: '1–4 weeks',
    previousConsultation: true,
    hasMedicalReport: true,
    suggestedSpecialty: 'Oncology',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString()
  }
];

