import {
  Patient,
  PatientStatus,
  RegisterPatientInput,
  UpdatePatientInput,
} from "./types/patient.types";
import { Visit } from "./types/visit.types";
import { Appointment } from "./types/appointment.types";
import { Prescription } from "./types/prescription.types";
import { Invoice, Payment } from "./types/billing.types";

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
  addVisit(
    patientId: string,
    visit: Omit<Visit, "id" | "patientId">,
    actor: PatientActor,
  ): Promise<Patient | null>;
  addPrescription(
    patientId: string,
    prescription: Omit<Prescription, "id">,
    actor: PatientActor,
  ): Promise<Patient | null>;
  cancelPrescription(
    patientId: string,
    prescriptionId: string,
    actor: PatientActor,
  ): Promise<Patient | null>;
  addAppointment(
    patientId: string,
    appointment: Omit<Appointment, "id" | "patientId">,
    actor: PatientActor,
  ): Promise<Patient | null>;
  updateAppointment(
    patientId: string,
    appointmentId: string,
    data: Partial<Omit<Appointment, "id" | "patientId">>,
    actor: PatientActor,
  ): Promise<Patient | null>;
  cancelAppointment(
    patientId: string,
    appointmentId: string,
    actor: PatientActor,
  ): Promise<Patient | null>;
  addInvoice(
    patientId: string,
    invoice: Omit<Invoice, "id" | "patientId">,
    actor: PatientActor,
  ): Promise<Patient | null>;
  addPayment(
    patientId: string,
    payment: Omit<Payment, "id" | "patientId">,
    actor: PatientActor,
  ): Promise<Patient | null>;
  checkDuplicate(name: string, dateOfBirth: string): Promise<Patient | null>;
  getNextFileNumber(): Promise<string>;
  isFileNumberTaken(fileNumber: string): Promise<boolean>;
}
