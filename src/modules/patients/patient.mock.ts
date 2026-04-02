// src/modules/patients/patient.mock.ts
import { faker, fakerEN_NG } from "@faker-js/faker";
import {
  Patient,
  PatientGender,
  PatientStatus,
  EmergencyContact,
  FileType,
} from "./types/patient.types";
import {
  PatientRepository,
  PatientSearchParams,
  PatientActor,
} from "./patient.repository";
import { familyFileMockRepo } from "./family-file.mock";

// ─── Name pools ───────────────────────────────────────────────────────────────
const maleFirstNames = [
  "Abubakar",
  "Aminu",
  "Usman",
  "Ibrahim",
  "Bello",
  "Haruna",
  "Salihu",
  "Adamu",
  "Bashir",
  "Bilal",
  "Faruq",
  "Faisal",
  "Gambo",
  "Musa",
  "Sani",
  "Yusuf",
  "Abdullahi",
  "Suleiman",
  "Aliyu",
  "Umar",
  "Muhammad",
  "Audu",
];
const femaleFirstNames = [
  "Aisha",
  "Fatima",
  "Zainab",
  "Maryam",
  "Halima",
  "Khadija",
  "Rabi",
  "Asma'u",
  "Aminatu",
  "Hadiza",
  "Hauwa",
  "Jamila",
  "Safiya",
  "Hafsatu",
  "Zulaiha",
  "Aliyah",
  "Sa'adatu",
];
const lastNames = [
  "Abdullahi",
  "Suleiman",
  "Aliyu",
  "Umar",
  "Muhammad",
  "Ibrahim",
  "Audu",
  "Lawal",
  "Garba",
  "Danlami",
  "Bello",
  "Haruna",
  "Yusuf",
  "Musa",
  "Sani",
];
const RELATIONSHIPS = [
  "Spouse",
  "Parent",
  "Sibling",
  "Child",
  "Friend",
  "Guardian",
];

function pickFirst(gender: PatientGender) {
  return faker.helpers.arrayElement(
    gender === "male" ? maleFirstNames : femaleFirstNames,
  );
}
function pickLast() {
  return faker.helpers.arrayElement(lastNames);
}

function buildName(gender: PatientGender) {
  const first = pickFirst(gender);
  const middle = faker.datatype.boolean({ probability: 0.35 })
    ? pickFirst("male")
    : null;
  const last = pickLast();
  return [first, middle, last].filter(Boolean).join(" ");
}

function isoDate(d: Date) {
  return d.toISOString().split("T")[0];
}
function makeFileNumber(seq: number) {
  return String(seq + 100000).padStart(6, "0");
}

function makeEmergencyContacts(): EmergencyContact[] {
  const count = faker.number.int({ min: 0, max: 2 });
  return Array.from({ length: count }, () => ({
    id: crypto.randomUUID(),
    name: buildName("male"),
    phone: fakerEN_NG.phone.number({ style: "national" }),
    relationship: faker.helpers.arrayElement(RELATIONSHIPS),
  }));
}

const SYSTEM_ACTOR: PatientActor = { id: "system", name: "System" };

function seedPatient(
  seq: number,
  fileType: FileType = "individual",
  familyFileId?: string,
  familyFileNumber?: string,
): Patient {
  const gender: PatientGender = faker.datatype.boolean({ probability: 0.55 })
    ? "female"
    : "male";
  const name = buildName(gender);
  const firstName = name.split(" ")[0];
  const lastName = name.split(" ").at(-1) ?? "";
  const dob = faker.date.birthdate({ min: 1, max: 80, mode: "age" });
  const createdAt = faker.date.past({ years: 3 }).toISOString();
  const statusOptions: PatientStatus[] = [
    "active",
    "active",
    "active",
    "inactive",
    "archived",
  ];

  return {
    id: crypto.randomUUID(),
    fileNumber: makeFileNumber(seq),
    fileType,
    familyFileId,
    familyFileNumber,
    name,
    dateOfBirth: isoDate(dob),
    gender,
    phone: fakerEN_NG.phone.number({ style: "national" }),
    email: fakerEN_NG.internet.email({ firstName, lastName }),
    address: fakerEN_NG.location.streetAddress(),
    emergencyContacts: makeEmergencyContacts(),
    status: faker.helpers.arrayElement(statusOptions),
    createdAt,
    auditLog: [
      {
        id: crypto.randomUUID(),
        timestamp: createdAt,
        userId: SYSTEM_ACTOR.id,
        userName: SYSTEM_ACTOR.name,
        action: "created",
      },
    ],
  };
}

// Seeded family file stubs (IDs used by patients below)
const FAMILY_A = { id: crypto.randomUUID(), fileNumber: "F-110001" };
const FAMILY_B = { id: crypto.randomUUID(), fileNumber: "F-110002" };

const seededPatients: Patient[] = [
  ...Array.from({ length: 8 }, (_, i) => seedPatient(i + 1)),
  ...Array.from({ length: 2 }, (_, i) =>
    seedPatient(i + 9, "family", FAMILY_A.id, FAMILY_A.fileNumber),
  ),
  ...Array.from({ length: 2 }, (_, i) =>
    seedPatient(i + 11, "family", FAMILY_B.id, FAMILY_B.fileNumber),
  ),
];

const store = new Map<string, Patient>(seededPatients.map((p) => [p.id, p]));
let fileSeq = store.size + 1;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function normalize(s: string) {
  return s.toLowerCase().trim();
}

function matchesQuery(p: Patient, q: string) {
  const n = normalize(q);
  return (
    normalize(p.name).includes(n) ||
    p.fileNumber.includes(n) ||
    (p.familyFileNumber ?? "").toLowerCase().includes(n) ||
    p.phone.replace(/\s/g, "").includes(n.replace(/\s/g, ""))
  );
}

// ─── Repository ───────────────────────────────────────────────────────────────
export const patientMockRepo: PatientRepository = {
  async getAll(params: PatientSearchParams = {}) {
    let results = Array.from(store.values());
    if (params.status && params.status !== "all") {
      results = results.filter((p) => p.status === params.status);
    }
    if (params.query?.trim()) {
      results = results.filter((p) => matchesQuery(p, params.query!));
    }
    return results.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  async getById(id) {
    return store.get(id) ?? null;
  },

  async create(data, actor) {
    fileSeq += 1;
    const now = new Date().toISOString();
    let familyFileId = data.familyFileId;
    let familyFileNumber: string | undefined;

    if (data.fileType === "family" && data.createFamilyFile) {
      const newFile = await familyFileMockRepo.create(
        `${data.name.split(" ").at(-1)} Family`,
      );
      familyFileId = newFile.id;
      familyFileNumber = newFile.fileNumber;
    } else if (familyFileId) {
      const existing = await familyFileMockRepo.getById(familyFileId);
      familyFileNumber = existing?.fileNumber;
    }

    const patient: Patient = {
      id: crypto.randomUUID(),
      fileNumber: makeFileNumber(fileSeq),
      fileType: data.fileType,
      familyFileId,
      familyFileNumber,
      name: data.name,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      phone: data.phone,
      email: data.email,
      address: data.address,
      emergencyContacts: (data.emergencyContacts ?? []).map((c) => ({
        ...c,
        id: crypto.randomUUID(),
      })),
      status: "active",
      createdAt: now,
      auditLog: [
        {
          id: crypto.randomUUID(),
          timestamp: now,
          userId: actor.id,
          userName: actor.name,
          action: "created",
        },
      ],
    };

    store.set(patient.id, patient);
    if (familyFileId)
      await familyFileMockRepo.addMember(familyFileId, patient.id);
    return patient;
  },

  async update(id, data, actor) {
    const existing = store.get(id);
    if (!existing) return null;
    const now = new Date().toISOString();
    const changes: Record<string, { from: unknown; to: unknown }> = {};

    for (const key of Object.keys(data) as (keyof typeof data)[]) {
      const from = existing[key as keyof Patient];
      const to = data[key];
      if (JSON.stringify(from) !== JSON.stringify(to))
        changes[key] = { from, to };
    }

    const updated: Patient = {
      ...existing,
      ...data,
      emergencyContacts: data.emergencyContacts
        ? data.emergencyContacts.map((c) => ({
            ...c,
            id: (c as EmergencyContact).id ?? crypto.randomUUID(),
          }))
        : (existing.emergencyContacts ?? []),
      updatedAt: now,
      auditLog: [
        ...existing.auditLog,
        {
          id: crypto.randomUUID(),
          timestamp: now,
          userId: actor.id,
          userName: actor.name,
          action: "updated",
          changes,
        },
      ],
    };
    store.set(id, updated);
    return updated;
  },

  async setStatus(id, status, actor) {
    const existing = store.get(id);
    if (!existing) return null;
    const now = new Date().toISOString();
    const updated: Patient = {
      ...existing,
      status,
      updatedAt: now,
      auditLog: [
        ...existing.auditLog,
        {
          id: crypto.randomUUID(),
          timestamp: now,
          userId: actor.id,
          userName: actor.name,
          action: "status_changed",
          changes: { status: { from: existing.status, to: status } },
        },
      ],
    };
    store.set(id, updated);
    return updated;
  },

  async checkDuplicate(name, dateOfBirth) {
    const n = normalize(name);
    return (
      Array.from(store.values()).find(
        (p) =>
          normalize(p.name) === n &&
          p.dateOfBirth === dateOfBirth &&
          p.status !== "archived",
      ) ?? null
    );
  },
};
