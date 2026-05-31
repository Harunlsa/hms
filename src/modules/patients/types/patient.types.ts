import { Visit } from "./visit.types";

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
}

export interface Patient {
  id: string;
  fileNumber: string;
  fileType: FileType;
  familyFileId?: string;
  familyFileNumber?: string;
  name: string;
  dateOfBirth: string;
  gender: PatientGender;
  phone?: string;
  email?: string;
  address?: string;
  emergencyContacts: EmergencyContact[];
  status: PatientStatus;
  createdAt: string;
  updatedAt?: string;
  auditLog: AuditEntry[];
  visits: Visit[];
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
>;
