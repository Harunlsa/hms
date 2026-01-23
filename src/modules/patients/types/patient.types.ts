// src/modules/patients/patient.types.ts
export interface Patient {
  fileNumber: string;
  id: string;
  name: string;
  dateOfBirth?: string;
  gender: "male" | "female";
  phone?: string;
  email?: string;
  address?: string;
  createdAt: string;
}
