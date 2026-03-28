export type PatientStatus = "active" | "inactive" | "archived";
export type PatientGender = "male" | "female";

export interface EmergencyContact {
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
  fileNumber: string;
  id: string;
  name: string;
  dateOfBirth?: string;
  gender: PatientGender;
  phone?: string;
  email?: string;
  address?: string;
  emergencyContact?: EmergencyContact;
  status: PatientStatus;
  createdAt: string;
  updatedAt?: string;
  auditLog: AuditEntry[];
}

export type RegisterPatientInput = {
  name: string;
  dateOfBirth: string;
  gender: PatientGender;
  phone: string;
  email?: string;
  address?: string;
  emergencyContact?: EmergencyContact;
};

export type UpdatePatientInput = Partial<RegisterPatientInput>;
