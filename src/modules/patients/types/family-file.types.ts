export interface FamilyFile {
  id: string;
  fileNumber: string; // e.g. "F-100001"
  headName: string; // display label — first member's name or custom
  memberIds: string[];
  createdAt: string;
}

export interface FamilyFileRepository {
  getAll(): Promise<FamilyFile[]>;
  getById(id: string): Promise<FamilyFile | null>;
  search(query: string): Promise<FamilyFile[]>;
  create(headName: string): Promise<FamilyFile>;
  addMember(
    familyFileId: string,
    patientId: string,
  ): Promise<FamilyFile | null>;
}
