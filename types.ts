
export enum UserRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  password?: string;
  isAvailable?: boolean;
  specialization?: string;
  age?: string;
  bio?: string;
  medicalHistory?: string;
  bloodGroup?: string;
  emergencyContact?: string;
  allergies?: string[];
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  status: 'pending' | 'approved' | 'cancelled' | 'completed';
  reason: string;
  tokenNumber?: number;
  billId?: string;
}

export interface MedicationDetail {
  name: string;
  dosage: string;
  duration: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  date: string;
  diagnosis: string;
  vitals: {
    bp: string;
    temp: string;
    weight: string;
  };
  doctorName: string;
  medications: MedicationDetail[];
  allergies: string[];
  treatmentSummary: string;
  prescriptionImage?: string; // Base64
}

export interface Billing {
  id: string;
  patientId: string;
  appointmentId?: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending';
  service: string;
}

export interface Review {
  id: string;
  author: string;
  role: string;
  content: string;
  rating: number;
  date: string;
}
