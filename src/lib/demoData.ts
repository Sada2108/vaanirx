export type Language = 'English' | 'Hindi' | 'Tamil' | 'Malayalam' | 'Marathi';

export interface Patient {
  id: string;
  name: string;
  initials: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  language: Language;
  phone: string;
  allergies: string[];
  medicalHistory: string[];
  preferredLanguage: Language;
  createdAt: string;
  lastVisit?: string;
}

export interface Consultation {
  id: string;
  patientId: string;
  patientName: string;
  patientLanguage: Language;
  type: 'General consultation' | 'Follow-up consultation';
  date: string;
  status: 'Completed' | 'In review' | 'Scheduled';
  transcript?: string;
  clinicalNotes?: string;
}

export interface PrescriptionItem {
  id: string;
  medicineName: string;
  strength: string;
  dosage: string;
  frequency: string;
  duration: string;
  timing: string;
  instructions: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  status: 'Draft' | 'Pending Approval' | 'Issued' | 'Rejected';
  items: PrescriptionItem[];
  qrToken?: string;
  audioUrl?: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface ClinicalNote {
  id: string;
  consultationId: string;
  symptom?: string;
  duration?: string;
  severity?: string;
  allergies?: string[];
  medicalHistory?: string[];
  medications?: string[];
  redFlags?: string[];
  originalExpression?: string;
  clinicalMapping?: string;
  requiresDoctorReview: boolean;
  notes: string;
  status: 'Draft' | 'Reviewed' | 'Approved';
}

const LANGUAGES: Language[] = ['English', 'Hindi', 'Tamil', 'Malayalam', 'Marathi'];

export const DEMO_PATIENTS: Patient[] = [
  {
    id: 'p1',
    name: 'Rohan Kapoor',
    initials: 'RK',
    age: 34,
    gender: 'Male',
    language: 'Hindi',
    phone: '+91 98765 43210',
    allergies: ['Penicillin'],
    medicalHistory: ['Hypertension'],
    preferredLanguage: 'Hindi',
    createdAt: '2026-10-20',
    lastVisit: '12 September 2024',
  },
  {
    id: 'p2',
    name: 'Priya Menon',
    initials: 'PM',
    age: 29,
    gender: 'Female',
    language: 'Malayalam',
    phone: '+91 91234 56789',
    allergies: [],
    medicalHistory: ['Asthma'],
    preferredLanguage: 'Malayalam',
    createdAt: '2026-10-21',
    lastVisit: '05 August 2024',
  },
  {
    id: 'p3',
    name: 'Arjun Kumar',
    initials: 'AK',
    age: 41,
    gender: 'Male',
    language: 'Tamil',
    phone: '+91 99887 76655',
    allergies: ['Sulfa drugs'],
    medicalHistory: ['Diabetes type 2'],
    preferredLanguage: 'Tamil',
    createdAt: '2026-10-20',
    lastVisit: '22 July 2024',
  },
  {
    id: 'p4',
    name: 'Sneha Patil',
    initials: 'SP',
    age: 38,
    gender: 'Female',
    language: 'Marathi',
    phone: '+91 98223 34455',
    allergies: [],
    medicalHistory: [],
    preferredLanguage: 'Marathi',
    createdAt: '2026-10-20',
    lastVisit: '14 June 2024',
  },
  {
    id: 'p5',
    name: 'Meera Shah',
    initials: 'MS',
    age: 34,
    gender: 'Female',
    language: 'Hindi',
    phone: '+91 97654 32109',
    allergies: ['None reported'],
    medicalHistory: ['Migraine'],
    preferredLanguage: 'Hindi',
    createdAt: '2026-11-20',
    lastVisit: '01 November 2024',
  },
];

export const DEMO_CONSULTATIONS: Consultation[] = [
  {
    id: 'c1',
    patientId: 'p1',
    patientName: 'Rohan Kapoor',
    patientLanguage: 'Hindi',
    type: 'Follow-up consultation',
    date: '21 Nov',
    status: 'Completed',
  },
  {
    id: 'c2',
    patientId: 'p2',
    patientName: 'Priya Menon',
    patientLanguage: 'Malayalam',
    type: 'General consultation',
    date: '21 Nov',
    status: 'Completed',
  },
  {
    id: 'c3',
    patientId: 'p3',
    patientName: 'Arjun Kumar',
    patientLanguage: 'Tamil',
    type: 'General consultation',
    date: '20 Nov',
    status: 'In review',
  },
  {
    id: 'c4',
    patientId: 'p4',
    patientName: 'Sneha Patil',
    patientLanguage: 'Marathi',
    type: 'Follow-up consultation',
    date: '20 Nov',
    status: 'Completed',
  },
];

export const DEMO_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'rx1',
    patientId: 'p1',
    patientName: 'Rohan Kapoor',
    doctorId: 'd1',
    doctorName: 'Dr. Ananya Sharma',
    date: '21 Nov 2026',
    status: 'Issued',
    items: [
      {
        id: 'rx1-i1',
        medicineName: 'Paracetamol',
        strength: '500 mg',
        dosage: '1 tablet',
        frequency: 'Twice daily',
        duration: '3 days',
        timing: 'After meals',
        instructions: 'Take after food with water. Avoid alcohol.',
      },
    ],
    qrToken: 'vaanirx_rx_demo_1',
    audioUrl: '/assets/audio/demo-prescription-1.mp3',
    approvedAt: '21 Nov 2026',
    approvedBy: 'Dr. Ananya Sharma',
  },
];

export function getDemoPatient(id: string) {
  return DEMO_PATIENTS.find((p) => p.id === id);
}

export function getDemoPrescription(id: string) {
  return DEMO_PRESCRIPTIONS.find((p) => p.id === id);
}

export function getPrescriptionByQrToken(token: string) {
  return DEMO_PRESCRIPTIONS.find((p) => p.qrToken === token);
}

export { LANGUAGES };
