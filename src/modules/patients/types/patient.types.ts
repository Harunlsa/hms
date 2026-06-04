import { Visit } from "./visit.types";
import { Appointment } from "./appointment.types";
import { Invoice, Payment } from "./billing.types";

export type PatientStatus = "active" | "inactive" | "archived";
export type PatientGender = "male" | "female";
export type FileType = "individual" | "family";

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: "created" | "updated" | "status_changed";
  changes?: Record<string, { from: unknown; to: unknown }>;
  source: "UI" | "system" | "import";
}

export interface Patient {
  id: string;
  fileNumber: string;
  fileType: FileType;
  familyFileId?: string;
  familyFileNumber?: string;
  familyFileName?: string;
  name: string;
  dateOfBirth: string;
  gender: PatientGender;
  phone?: string;
  email?: string;
  address?: string;
  emergencyContacts: EmergencyContact[];
  
  // Medical Summary
  conditions: string[];
  allergies: string[];
  bloodGroup?: string;

  // Activity Snapshot
  upcomingAppointment?: string; // ISO string

  status: PatientStatus;
  createdAt: string;
  updatedAt?: string;
  auditLog: AuditEntry[];
  visits: Visit[];
  appointments: Appointment[];
  invoices: Invoice[];
  payments: Payment[];
}

export type RegisterPatientInput = {
  name: string;
  dateOfBirth: string;
  gender: PatientGender;
  phone?: string;
  email?: string;
  address?: string;
  emergencyContacts?: Omit<EmergencyContact, "id">[];
  fileType: FileType;
  fileNumber: string;
  familyFileId?: string;
  createFamilyFile?: boolean;
  familyFileName?: string;
};

export type UpdatePatientInput = Partial<
  Omit<
    RegisterPatientInput,
    | "fileType"
    | "fileNumber"
    | "familyFileId"
    | "createFamilyFile"
    | "familyFileName"
  >
> & {
  conditions?: string[];
  allergies?: string[];
  bloodGroup?: string;
  upcomingAppointment?: string;
};
