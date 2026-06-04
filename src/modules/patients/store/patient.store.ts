import { create } from "zustand";
import {
  Patient,
  PatientStatus,
  RegisterPatientInput,
  UpdatePatientInput,
} from "../types/patient.types";
import { FamilyFile } from "../types/family-file.types";
import { patientMockRepo } from "../patient.mock";
import { familyFileMockRepo } from "../family-file.mock";
import { PatientSearchParams } from "../patient.repository";
import { Visit } from "../types/visit.types";
import { Appointment } from "../types/appointment.types";
import { Prescription } from "../types/prescription.types";
import { Invoice, Payment } from "../types/billing.types";

const CURRENT_ACTOR = { id: "usr-001", name: "Dr Hugh Mann" };

interface PatientState {
  patients: Patient[];
  selectedPatient: Patient | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  searchQuery: string;
  statusFilter: PatientStatus | "all";

  // Family file state
  familyFileResults: FamilyFile[];
  familyFileSearching: boolean;

  // File number suggestion
  nextFileNumber: string;

  // Actions
  fetchAll: (params?: PatientSearchParams) => Promise<void>;
  fetchById: (id: string) => Promise<void>;
  register: (
    data: RegisterPatientInput,
  ) => Promise<{ patient: Patient; duplicate: Patient | null }>;
  update: (id: string, data: UpdatePatientInput) => Promise<void>;
  setStatus: (id: string, status: PatientStatus) => Promise<void>;
  addVisit: (
    patientId: string,
    visit: Omit<Visit, "id" | "patientId">,
  ) => Promise<void>;
  addAppointment: (
    patientId: string,
    appointment: Omit<Appointment, "id" | "patientId">,
  ) => Promise<void>;
  updateAppointment: (
    patientId: string,
    appointmentId: string,
    data: Partial<Omit<Appointment, "id" | "patientId">>,
  ) => Promise<void>;
  cancelAppointment: (
    patientId: string,
    appointmentId: string,
  ) => Promise<void>;
  addPrescription: (
    patientId: string,
    prescription: Omit<Prescription, "id">,
  ) => Promise<void>;
  cancelPrescription: (
    patientId: string,
    prescriptionId: string,
  ) => Promise<void>;
  addInvoice: (
    patientId: string,
    invoice: Omit<Invoice, "id" | "patientId">,
  ) => Promise<void>;
  addPayment: (
    patientId: string,
    payment: Omit<Payment, "id" | "patientId">,
  ) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: PatientStatus | "all") => void;
  clearSelected: () => void;
  searchFamilyFiles: (query: string) => Promise<void>;
  fetchNextFileNumber: () => Promise<void>;
  isFileNumberTaken: (fileNumber: string) => Promise<boolean>;
}

export const usePatientStore = create<PatientState>((set, get) => ({
  patients: [],
  selectedPatient: null,
  loading: false,
  saving: false,
  error: null,
  searchQuery: "",
  statusFilter: "all",
  familyFileResults: [],
  familyFileSearching: false,
  nextFileNumber: "",

  fetchAll: async (params) => {
    set({ loading: true, error: null });
    try {
      const { searchQuery, statusFilter } = get();
      const results = await patientMockRepo.getAll({
        query: params?.query ?? searchQuery,
        status: params?.status ?? statusFilter,
      });
      set({ patients: results });
    } catch (e) {
      set({ error: String(e) });
    } finally {
      set({ loading: false });
    }
  },

  fetchById: async (id) => {
    set({ loading: true, error: null });
    try {
      const patient = await patientMockRepo.getById(id);
      set({ selectedPatient: patient });
    } catch (e) {
      set({ error: String(e) });
    } finally {
      set({ loading: false });
    }
  },

  register: async (data) => {
    set({ saving: true, error: null });
    try {
      const duplicate = await patientMockRepo.checkDuplicate(
        data.name,
        data.dateOfBirth,
      );
      const patient = await patientMockRepo.create(data, CURRENT_ACTOR);
      await get().fetchAll();
      return { patient, duplicate };
    } catch (e) {
      set({ error: String(e) });
      throw e;
    } finally {
      set({ saving: false });
    }
  },

  update: async (id, data) => {
    set({ saving: true, error: null });
    try {
      const updated = await patientMockRepo.update(id, data, CURRENT_ACTOR);
      if (updated) {
        set((state) => ({
          selectedPatient:
            state.selectedPatient?.id === id ? updated : state.selectedPatient,
          patients: state.patients.map((p) => (p.id === id ? updated : p)),
        }));
      }
    } catch (e) {
      set({ error: String(e) });
      throw e;
    } finally {
      set({ saving: false });
    }
  },

  setStatus: async (id, status) => {
    set({ saving: true, error: null });
    try {
      const updated = await patientMockRepo.setStatus(
        id,
        status,
        CURRENT_ACTOR,
      );
      if (updated) {
        set((state) => ({
          selectedPatient:
            state.selectedPatient?.id === id ? updated : state.selectedPatient,
          patients: state.patients.map((p) => (p.id === id ? updated : p)),
        }));
      }
    } catch (e) {
      set({ error: String(e) });
      throw e;
    } finally {
      set({ saving: false });
    }
  },

  addVisit: async (patientId, visit) => {
    set({ saving: true, error: null });
    try {
      const updated = await patientMockRepo.addVisit(
        patientId,
        visit,
        CURRENT_ACTOR,
      );
      if (updated) {
        set((state) => ({
          selectedPatient:
            state.selectedPatient?.id === patientId
              ? updated
              : state.selectedPatient,
          patients: state.patients.map((p) => (p.id === patientId ? updated : p)),
        }));
      }
    } catch (e) {
      set({ error: String(e) });
      throw e;
    } finally {
      set({ saving: false });
    }
  },

  addAppointment: async (patientId, appointment) => {
    set({ saving: true, error: null });
    try {
      const updated = await patientMockRepo.addAppointment(
        patientId,
        appointment,
        CURRENT_ACTOR,
      );
      if (updated) {
        set((state) => ({
          selectedPatient:
            state.selectedPatient?.id === patientId
              ? updated
              : state.selectedPatient,
          patients: state.patients.map((p) => (p.id === patientId ? updated : p)),
        }));
      }
    } catch (e) {
      set({ error: String(e) });
      throw e;
    } finally {
      set({ saving: false });
    }
  },

  updateAppointment: async (patientId, appointmentId, data) => {
    set({ saving: true, error: null });
    try {
      const updated = await patientMockRepo.updateAppointment(
        patientId,
        appointmentId,
        data,
        CURRENT_ACTOR,
      );
      if (updated) {
        set((state) => ({
          selectedPatient:
            state.selectedPatient?.id === patientId
              ? updated
              : state.selectedPatient,
          patients: state.patients.map((p) => (p.id === patientId ? updated : p)),
        }));
      }
    } catch (e) {
      set({ error: String(e) });
      throw e;
    } finally {
      set({ saving: false });
    }
  },

  cancelAppointment: async (patientId, appointmentId) => {
    set({ saving: true, error: null });
    try {
      const updated = await patientMockRepo.cancelAppointment(
        patientId,
        appointmentId,
        CURRENT_ACTOR,
      );
      if (updated) {
        set((state) => ({
          selectedPatient:
            state.selectedPatient?.id === patientId
              ? updated
              : state.selectedPatient,
          patients: state.patients.map((p) => (p.id === patientId ? updated : p)),
        }));
      }
    } catch (e) {
      set({ error: String(e) });
      throw e;
    } finally {
      set({ saving: false });
    }
  },

  addPrescription: async (patientId, prescription) => {
    set({ saving: true, error: null });
    try {
      const updated = await patientMockRepo.addPrescription(
        patientId,
        prescription,
        CURRENT_ACTOR,
      );
      if (updated) {
        set((state) => ({
          selectedPatient:
            state.selectedPatient?.id === patientId
              ? updated
              : state.selectedPatient,
          patients: state.patients.map((p) => (p.id === patientId ? updated : p)),
        }));
      }
    } catch (e) {
      set({ error: String(e) });
      throw e;
    } finally {
      set({ saving: false });
    }
  },

  cancelPrescription: async (patientId, prescriptionId) => {
    set({ saving: true, error: null });
    try {
      const updated = await patientMockRepo.cancelPrescription(
        patientId,
        prescriptionId,
        CURRENT_ACTOR,
      );
      if (updated) {
        set((state) => ({
          selectedPatient:
            state.selectedPatient?.id === patientId
              ? updated
              : state.selectedPatient,
          patients: state.patients.map((p) => (p.id === patientId ? updated : p)),
        }));
      }
    } catch (e) {
      set({ error: String(e) });
      throw e;
    } finally {
      set({ saving: false });
    }
  },

  addInvoice: async (patientId, invoice) => {
    set({ saving: true, error: null });
    try {
      const updated = await patientMockRepo.addInvoice(
        patientId,
        invoice,
        CURRENT_ACTOR,
      );
      if (updated) {
        set((state) => ({
          selectedPatient:
            state.selectedPatient?.id === patientId
              ? updated
              : state.selectedPatient,
          patients: state.patients.map((p) => (p.id === patientId ? updated : p)),
        }));
      }
    } catch (e) {
      set({ error: String(e) });
      throw e;
    } finally {
      set({ saving: false });
    }
  },

  addPayment: async (patientId, payment) => {
    set({ saving: true, error: null });
    try {
      const updated = await patientMockRepo.addPayment(
        patientId,
        payment,
        CURRENT_ACTOR,
      );
      if (updated) {
        set((state) => ({
          selectedPatient:
            state.selectedPatient?.id === patientId
              ? updated
              : state.selectedPatient,
          patients: state.patients.map((p) => (p.id === patientId ? updated : p)),
        }));
      }
    } catch (e) {
      set({ error: String(e) });
      throw e;
    } finally {
      set({ saving: false });
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  clearSelected: () => set({ selectedPatient: null }),

  searchFamilyFiles: async (query) => {
    set({ familyFileSearching: true });
    try {
      const results = query.trim()
        ? await familyFileMockRepo.search(query)
        : await familyFileMockRepo.getAll();
      set({ familyFileResults: results });
    } finally {
      set({ familyFileSearching: false });
    }
  },

  fetchNextFileNumber: async () => {
    const next = await patientMockRepo.getNextFileNumber();
    set({ nextFileNumber: next });
  },
  isFileNumberTaken: async (fileNumber) => {
    return patientMockRepo.isFileNumberTaken(fileNumber);
  },
}));
