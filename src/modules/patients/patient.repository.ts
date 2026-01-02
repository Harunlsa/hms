import { Patient } from "./types/patient.types";

export interface PatientRepository {
  getAll(): Promise<Patient[]>;
  getById(id: string): Promise<Patient | null>;
  create(data: Omit<Patient, "id" | "createdAt">): Promise<Patient>;
}
