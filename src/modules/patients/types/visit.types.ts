export type VisitStatus = "completed" | "ongoing" | "cancelled";
export type VisitType = "consultation" | "emergency" | "follow-up" | "routine-checkup";

export interface Prescription {
  id: string;
  medicine: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface Visit {
  id: string;
  patientId: string;
  date: string; // ISO string
  doctorName: string;
  doctorId: string;
  reason: string;
  summary: string;
  status: VisitStatus;
  type: VisitType;
  notes: string;
  diagnosis: string;
  observations: string;
  prescriptions: Prescription[];
  // attachments: string[]; // Future
}
