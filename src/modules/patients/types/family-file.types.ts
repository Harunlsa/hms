export interface FamilyFile {
  id: string;
  fileNumber: string;
  headName: string;
  memberIds: string[];
  createdAt: string;
}

export interface FamilyFileRepository {
  getAll(): Promise<FamilyFile[]>;
  getById(id: string): Promise<FamilyFile | null>;
  search(query: string): Promise<FamilyFile[]>;
  create(headName: string, fileNumber?: string): Promise<FamilyFile>;
  addMember(
    familyFileId: string,
    patientId: string,
  ): Promise<FamilyFile | null>;
}
