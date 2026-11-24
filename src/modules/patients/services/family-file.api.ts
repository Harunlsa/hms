import { invoke } from "@tauri-apps/api/core";
import {
  FamilyFile,
  FamilyFileRepository,
} from "../types/family-file.types";
import { familyFileMockRepo } from "../family-file.mock";

const isTauri = (): boolean =>
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export const familyFileApi: FamilyFileRepository = {
  async getAll(): Promise<FamilyFile[]> {
    if (!isTauri()) return familyFileMockRepo.getAll();
    return invoke<FamilyFile[]>("get_family_files");
  },

  async getById(id: string): Promise<FamilyFile | null> {
    if (!isTauri()) return familyFileMockRepo.getById(id);
    const all = await this.getAll();
    return all.find((f) => f.id === id) ?? null;
  },

  async search(query: string): Promise<FamilyFile[]> {
    if (!isTauri()) return familyFileMockRepo.search(query);
    return invoke<FamilyFile[]>("search_family_files", { query });
  },

  async create(headName: string, fileNumber?: string): Promise<FamilyFile> {
    return familyFileMockRepo.create(headName, fileNumber);
  },

  async addMember(
    familyFileId: string,
    patientId: string,
  ): Promise<FamilyFile | null> {
    return familyFileMockRepo.addMember(familyFileId, patientId);
  },
};
