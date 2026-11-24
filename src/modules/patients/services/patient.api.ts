import { invoke } from "@tauri-apps/api/core";
import {
  Patient,
  PatientStatus,
  RegisterPatientInput,
  UpdatePatientInput,
} from "../types/patient.types";
import { Visit } from "../types/visit.types";
import { Appointment } from "../types/appointment.types";
import { Prescription } from "../types/prescription.types";
import { Invoice, Payment } from "../types/billing.types";
import {
  PatientRepository,
  PatientSearchParams,
  PatientActor,
} from "../patient.repository";
import { patientMockRepo } from "../patient.mock";

const isTauri = (): boolean =>
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export const patientApi: PatientRepository = {
  async getAll(params?: PatientSearchParams): Promise<Patient[]> {
    if (!isTauri()) return patientMockRepo.getAll(params);
    return invoke<Patient[]>("get_patients", { params });
  },

  async getById(id: string): Promise<Patient | null> {
    if (!isTauri()) return patientMockRepo.getById(id);
    return invoke<Patient | null>("get_patient_by_id", { id });
  },

  async create(data: RegisterPatientInput, actor: PatientActor): Promise<Patient> {
    if (!isTauri()) return patientMockRepo.create(data, actor);
    return invoke<Patient>("create_patient", { data, actor });
  },

  async update(
    id: string,
    data: UpdatePatientInput,
    actor: PatientActor,
  ): Promise<Patient | null> {
    if (!isTauri()) return patientMockRepo.update(id, data, actor);
    return invoke<Patient | null>("update_patient", { id, data, actor });
  },

  async setStatus(
    id: string,
    status: PatientStatus,
    actor: PatientActor,
  ): Promise<Patient | null> {
    if (!isTauri()) return patientMockRepo.setStatus(id, status, actor);
    return invoke<Patient | null>("set_patient_status", { id, status, actor });
  },

  async addVisit(
    patientId: string,
    visit: Omit<Visit, "id" | "patientId">,
    actor: PatientActor,
  ): Promise<Patient | null> {
    if (!isTauri()) return patientMockRepo.addVisit(patientId, visit, actor);
    return invoke<Patient | null>("add_patient_visit", {
      patientId,
      visit,
      actor,
    });
  },

  async addPrescription(
    patientId: string,
    prescription: Omit<Prescription, "id">,
    actor: PatientActor,
  ): Promise<Patient | null> {
    if (!isTauri())
      return patientMockRepo.addPrescription(patientId, prescription, actor);
    return invoke<Patient | null>("add_patient_prescription", {
      patientId,
      prescription,
      actor,
    });
  },

  async cancelPrescription(
    patientId: string,
    prescriptionId: string,
    actor: PatientActor,
  ): Promise<Patient | null> {
    if (!isTauri())
      return patientMockRepo.cancelPrescription(
        patientId,
        prescriptionId,
        actor,
      );
    return invoke<Patient | null>("cancel_patient_prescription", {
      patientId,
      prescriptionId,
      actor,
    });
  },

  async addAppointment(
    patientId: string,
    appointment: Omit<Appointment, "id" | "patientId">,
    actor: PatientActor,
  ): Promise<Patient | null> {
    if (!isTauri())
      return patientMockRepo.addAppointment(patientId, appointment, actor);
    return invoke<Patient | null>("add_patient_appointment", {
      patientId,
      appointment,
      actor,
    });
  },

  async updateAppointment(
    patientId: string,
    appointmentId: string,
    data: Partial<Omit<Appointment, "id" | "patientId">>,
    actor: PatientActor,
  ): Promise<Patient | null> {
    if (!isTauri())
      return patientMockRepo.updateAppointment(
        patientId,
        appointmentId,
        data,
        actor,
      );
    return invoke<Patient | null>("update_patient_appointment", {
      patientId,
      appointmentId,
      data,
      actor,
    });
  },

  async cancelAppointment(
    patientId: string,
    appointmentId: string,
    actor: PatientActor,
  ): Promise<Patient | null> {
    if (!isTauri())
      return patientMockRepo.cancelAppointment(
        patientId,
        appointmentId,
        actor,
      );
    return invoke<Patient | null>("cancel_patient_appointment", {
      patientId,
      appointmentId,
      actor,
    });
  },

  async addInvoice(
    patientId: string,
    invoice: Omit<Invoice, "id" | "patientId">,
    actor: PatientActor,
  ): Promise<Patient | null> {
    if (!isTauri()) return patientMockRepo.addInvoice(patientId, invoice, actor);
    return invoke<Patient | null>("add_patient_invoice", {
      patientId,
      invoice,
      actor,
    });
  },

  async addPayment(
    patientId: string,
    payment: Omit<Payment, "id" | "patientId">,
    actor: PatientActor,
  ): Promise<Patient | null> {
    if (!isTauri()) return patientMockRepo.addPayment(patientId, payment, actor);
    return invoke<Patient | null>("add_patient_payment", {
      patientId,
      payment,
      actor,
    });
  },

  async checkDuplicate(
    name: string,
    dateOfBirth: string,
  ): Promise<Patient | null> {
    if (!isTauri()) return patientMockRepo.checkDuplicate(name, dateOfBirth);
    return invoke<Patient | null>("check_duplicate_patient", {
      name,
      dateOfBirth,
    });
  },

  async getNextFileNumber(): Promise<string> {
    if (!isTauri()) return patientMockRepo.getNextFileNumber();
    return invoke<string>("get_next_file_number");
  },

  async isFileNumberTaken(fileNumber: string): Promise<boolean> {
    if (!isTauri()) return patientMockRepo.isFileNumberTaken(fileNumber);
    return invoke<boolean>("is_file_number_taken", { fileNumber });
  },
};
