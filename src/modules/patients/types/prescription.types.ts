export type PrescriptionStatus = "active" | "completed" | "cancelled";

export interface Prescription {
  id: string;
  medicine: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
  status: PrescriptionStatus;
  issuedDate: string; // ISO string
  prescribingDoctor: string;
}
