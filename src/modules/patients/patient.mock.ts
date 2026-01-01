import { PatientRepository } from "./patient.repository";

const mockPatients = new Map<string, any>();

export const patientMockRepo: PatientRepository = {
  async getAll() {
    return Array.from(mockPatients.values());
  },

  async getById(id) {
    return mockPatients.get(id) ?? null;
  },

  async create(data) {
    const patient = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    mockPatients.set(patient.id, patient);
    return patient;
  },
};
