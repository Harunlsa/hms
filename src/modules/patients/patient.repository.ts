import {
  Patient,
  PatientStatus,
  RegisterPatientInput,
  UpdatePatientInput,
} from "./types/patient.types";

export interface PatientSearchParams {
  query?: string;
  status?: PatientStatus | "all";
}

export interface PatientActor {
  id: string;
  name: string;
}

export interface PatientRepository {
  getAll(params?: PatientSearchParams): Promise<Patient[]>;
  getById(id: string): Promise<Patient | null>;
  create(data: RegisterPatientInput, actor: PatientActor): Promise<Patient>;
  update(
    id: string,
    data: UpdatePatientInput,
    actor: PatientActor,
  ): Promise<Patient | null>;
  setStatus(
    id: string,
    status: PatientStatus,
    actor: PatientActor,
  ): Promise<Patient | null>;
  checkDuplicate(name: string, dateOfBirth: string): Promise<Patient | null>;
}
