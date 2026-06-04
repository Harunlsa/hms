export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "missed";

export interface Appointment {
  id: string;
  patientId: string;
  date: string; // ISO string
  doctorId: string;
  doctorName: string;
  reason: string;
  status: AppointmentStatus;
  location?: string;
  notes?: string;
}
