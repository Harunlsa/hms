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
  const parts = [
    pickFirst(gender),
    faker.datatype.boolean({ probability: 0.35 }) ? pickFirst("male") : null,
    pickLast(),
  ].filter(Boolean);
  return parts.join(" ");
}

function isoDate(d: Date) {
  return d.toISOString().split("T")[0];
}
function makeFileNumber(seq: number) {
  return String(seq + 100000).padStart(6, "0");
}

import {
  Visit,
  VisitStatus,
  VisitType,
  Prescription,
} from "./types/visit.types";

// ... existing code ...

function makeEmergencyContacts(): EmergencyContact[] {
  return Array.from({ length: faker.number.int({ min: 0, max: 2 }) }, () => ({
    id: crypto.randomUUID(),
    name: buildName("male"),
    phone: fakerEN_NG.phone.number({ style: "national" }),
    relationship: faker.helpers.arrayElement(RELATIONSHIPS),
  }));
}

const DOCTOR_NAMES = [
  "Dr. Amina Abubakar",
  "Dr. Samuel Okoro",
  "Dr. Chioma Nnadi",
  "Dr. Ahmed Musa",
  "Dr. Sarah Williams",
];

const VISIT_REASONS = [
  "Routine checkup",
  "Severe headache and fever",
  "Follow-up on previous treatment",
  "Lower back pain",
  "Abdominal discomfort",
  "Chest pain and shortness of breath",
  "Skin rash",
];

const MEDICINES = [
  "Paracetamol",
  "Amoxicillin",
  "Ibuprofen",
  "Omeprazole",
  "Metformin",
  "Loratadine",
  "Ciprofloxacin",
];

function makeVisits(patientId: string): Visit[] {
  return Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => {
    const status: VisitStatus = faker.helpers.arrayElement([
      "completed",
      "completed",
      "ongoing",
    ]);
    const type: VisitType = faker.helpers.arrayElement([
      "consultation",
      "emergency",
      "follow-up",
      "routine-checkup",
    ]);
    const prescriptions: Prescription[] = Array.from(
      { length: faker.number.int({ min: 0, max: 3 }) },
      () => ({
        id: crypto.randomUUID(),
        medicine: faker.helpers.arrayElement(MEDICINES),
        dosage: faker.helpers.arrayElement(["500mg", "250mg", "10mg", "5ml"]),
        frequency: faker.helpers.arrayElement([
          "Once daily",
          "Twice daily",
          "Three times daily",
        ]),
        duration: faker.helpers.arrayElement(["5 days", "7 days", "14 days"]),
      }),
    );

    return {
      id: crypto.randomUUID(),
      patientId,
      date: faker.date.past({ years: 1 }).toISOString(),
      doctorName: faker.helpers.arrayElement(DOCTOR_NAMES),
      doctorId: crypto.randomUUID(),
      reason: faker.helpers.arrayElement(VISIT_REASONS),
      summary: faker.lorem.sentence(),
      status,
      type,
      notes: faker.lorem.paragraphs(2),
      diagnosis: faker.lorem.sentence(),
      observations: faker.lorem.sentences(3),
      prescriptions,
    };
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

const SYSTEM_ACTOR: PatientActor = { id: "system", name: "System" };

// Seeded family file stubs — plain numeric numbers, no prefix
const FAMILY_A = {
  id: crypto.randomUUID(),
  fileNumber: "100501",
  headName: "Abdullahi Family",
};
const FAMILY_B = {
  id: crypto.randomUUID(),
  fileNumber: "100502",
  headName: "Ibrahim Family",
};

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
  const nameParts = name.split(" ");
  const firstName = nameParts[0];
  const lastName = nameParts[nameParts.length - 1];
  const dob = faker.date.birthdate({ min: 1, max: 80, mode: "age" });
  const createdAt = faker.date.past({ years: 3 }).toISOString();
  const id = crypto.randomUUID();

  return {
    id,
    fileNumber:
      fileType === "family"
        ? (familyFileNumber ?? makeFileNumber(seq))
        : makeFileNumber(seq),
    fileType,
    familyFileId,
    name,
    dateOfBirth: isoDate(dob),
    gender,
    phone: fakerEN_NG.phone.number({ style: "national" }),
    email: fakerEN_NG.internet.email({ firstName, lastName }),
    address: fakerEN_NG.location.streetAddress(),
    emergencyContacts: makeEmergencyContacts(),
    status: faker.helpers.arrayElement<PatientStatus>([
      "active",
      "active",
      "active",
      "inactive",
      "archived",
    ]),
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
    visits: makeVisits(id),
  };
}

// // Seeded family file stubs (IDs used by patients below)
// const FAMILY_A = { id: crypto.randomUUID(), fileNumber: "F-110001" };
// const FAMILY_B = { id: crypto.randomUUID(), fileNumber: "F-110002" };

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
// Track all registered file numbers to enforce uniqueness
const usedFileNumbers = new Set<string>(
  seededPatients.map((p) => p.fileNumber),
);
let fileSeq = 12; // next individual will be makeFileNumber(13) = 100013
// let fileSeq = store.size + 1;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function normalize(s: string) {
  return s.toLowerCase().trim();
}

function matchesQuery(p: Patient, q: string) {
  const n = normalize(q);
  return (
    normalize(p.name).includes(n) ||
    p.fileNumber.includes(n) ||
    (p.phone ?? "").replace(/\s/g, "").includes(n.replace(/\s/g, ""))
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

  async getNextFileNumber() {
    let candidate = fileSeq + 1;
    while (usedFileNumbers.has(makeFileNumber(candidate))) candidate++;
    return makeFileNumber(candidate);
  },

  async create(data, actor) {
    // fileSeq += 1;
    const now = new Date().toISOString();
    let familyFileId = data.familyFileId;
    let fileNumber = data.fileNumber;

    if (data.fileType === "family" && data.createFamilyFile) {
      // New family file — the provided fileNumber becomes the family file number
      const nameParts = data.name.split(" ");
      const lastName = nameParts[nameParts.length - 1] ?? "";
      const label = data.familyFileName?.trim() || `${lastName} Family`;
      const newFile = await familyFileMockRepo.create(label, fileNumber);
      familyFileId = newFile.id;
      fileNumber = newFile.fileNumber;
    } else if (familyFileId) {
      const existing = await familyFileMockRepo.getById(familyFileId);
      if (existing) fileNumber = existing.fileNumber;
    }

    usedFileNumbers.add(fileNumber);
    if (data.fileType === "individual") fileSeq++;

    const patient: Patient = {
      id: crypto.randomUUID(),
      fileNumber,
      fileType: data.fileType,
      familyFileId,
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
      visits: [],
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

  async isFileNumberTaken(fileNumber) {
    return usedFileNumbers.has(fileNumber);
  },
};
