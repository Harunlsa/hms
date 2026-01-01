// src/modules/patients/patient.types.ts
export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender: "male" | "female";
  phone?: string;
  createdAt: string;
}
