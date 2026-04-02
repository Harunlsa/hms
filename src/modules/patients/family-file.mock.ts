import { FamilyFile, FamilyFileRepository } from "./types/family-file.types";

let familySeq = 0;

function makeFamilyFileNumber() {
  familySeq += 1;
  return `F-${String(familySeq + 10000).padStart(6, "0")}`;
}

function seedFamily(headName: string, memberIds: string[] = []): FamilyFile {
  const id = crypto.randomUUID();
  return {
    id,
    fileNumber: makeFamilyFileNumber(),
    headName,
    memberIds,
    createdAt: new Date(Date.now() - Math.random() * 1e10).toISOString(),
  };
}

// Seed a handful of family files
const familyStore = new Map<string, FamilyFile>([
  ...[
    seedFamily("Abdullahi Family"),
    seedFamily("Ibrahim Family"),
    seedFamily("Musa Family"),
    seedFamily("Lawal Family"),
  ].map((f): [string, FamilyFile] => [f.id, f]),
]);

function normalize(s: string) {
  return s.toLowerCase().trim();
}

export const familyFileMockRepo: FamilyFileRepository = {
  async getAll() {
    return Array.from(familyStore.values()).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  async getById(id) {
    return familyStore.get(id) ?? null;
  },

  async search(query) {
    const q = normalize(query);
    return Array.from(familyStore.values()).filter(
      (f) =>
        normalize(f.headName).includes(q) ||
        normalize(f.fileNumber).includes(q),
    );
  },

  async create(headName) {
    const file: FamilyFile = {
      id: crypto.randomUUID(),
      fileNumber: makeFamilyFileNumber(),
      headName,
      memberIds: [],
      createdAt: new Date().toISOString(),
    };
    familyStore.set(file.id, file);
    return file;
  },

  async addMember(familyFileId, patientId) {
    const file = familyStore.get(familyFileId);
    if (!file) return null;
    if (!file.memberIds.includes(patientId)) {
      file.memberIds.push(patientId);
    }
    return file;
  },
};
