import { create } from "zustand";
import {
  Patient,
  PatientStatus,
  RegisterPatientInput,
  UpdatePatientInput,
} from "../types/patient.types";
import { patientMockRepo } from "../patient.mock";
import { PatientSearchParams } from "../patient.repository";
import { FamilyFile } from "../types/family-file.types";
import { familyFileMockRepo } from "../family-file.mock";

// Hardcoded actor until the auth store is wired up
const CURRENT_ACTOR = { id: "usr-001", name: "Dr Hugh Mann" };

interface PatientState {
  patients: Patient[];
  selectedPatient: Patient | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  searchQuery: string;
  statusFilter: PatientStatus | "all";

  familyFileResults: FamilyFile[];
  familyFileSearching: boolean;

  // Actions
  fetchAll: (params?: PatientSearchParams) => Promise<void>;
  fetchById: (id: string) => Promise<void>;
  register: (
    data: RegisterPatientInput,
  ) => Promise<{ patient: Patient; duplicate: Patient | null }>;
  update: (id: string, data: UpdatePatientInput) => Promise<void>;
  setStatus: (id: string, status: PatientStatus) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: PatientStatus | "all") => void;
  clearSelected: () => void;
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
      // Refresh list
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

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setStatusFilter: (status) => {
    set({ statusFilter: status });
  },

  clearSelected: () => set({ selectedPatient: null }),

  searchFamilyFiles: async (query: any) => {
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
}));
