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
import { Visit, VisitStatus, VisitType } from "./types/visit.types";
import { Prescription, PrescriptionStatus } from "./types/prescription.types";
import { Appointment, AppointmentStatus } from "./types/appointment.types";
import {
  Invoice,
  InvoiceStatus,
  Payment,
  PaymentMethod,
} from "./types/billing.types";

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

const CONDITIONS = [
  "Hypertension",
  "Type 2 Diabetes",
  "Asthma",
  "Arthritis",
  "None",
];

const ALLERGIES = [
  "Penicillin",
  "Peanuts",
  "Dust Mites",
  "Sulfa drugs",
  "Latex",
  "None",
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const APPOINTMENT_REASONS = [
  "Routine checkup",
  "Follow-up on hypertension",
  "Consultation with specialist",
  "Lab result review",
  "Vaccination",
  "Dental cleaning",
  "Annual physical",
];

const LOCATIONS = [
  "Main Clinic, Room 102",
  "Specialist Wing, Room 305",
  "Lab Collection Center",
  "General OPD",
  "Emergency Unit",
];

const INVOICE_DESCRIPTIONS = [
  "General Consultation Fee",
  "Laboratory Investigation - Full Blood Count",
  "Radiology - Chest X-Ray",
  "Pharmacy - Prescription Medication",
  "Emergency Room Service",
  "Follow-up Consultation",
];

function makeAppointments(patientId: string): Appointment[] {
  return Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, () => {
    const isPast = faker.datatype.boolean({ probability: 0.7 });
    const date = isPast
      ? faker.date.past({ years: 1 }).toISOString()
      : faker.date.soon({ days: 30 }).toISOString();

    const status: AppointmentStatus = isPast
      ? faker.helpers.arrayElement(["completed", "missed", "cancelled"])
      : faker.helpers.arrayElement(["confirmed", "pending"]);

    return {
      id: crypto.randomUUID(),
      patientId,
      date,
      doctorId: crypto.randomUUID(),
      doctorName: faker.helpers.arrayElement(DOCTOR_NAMES),
      reason: faker.helpers.arrayElement(APPOINTMENT_REASONS),
      status,
      location: faker.helpers.arrayElement(LOCATIONS),
      notes: faker.datatype.boolean({ probability: 0.3 })
        ? faker.lorem.sentence()
        : undefined,
    };
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

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
    const date = faker.date.past({ years: 1 }).toISOString();
    const doctorName = faker.helpers.arrayElement(DOCTOR_NAMES);

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
        notes: faker.datatype.boolean({ probability: 0.2 })
          ? faker.lorem.sentence()
          : undefined,
        status: faker.helpers.arrayElement(["active", "completed"]),
        issuedDate: date,
        prescribingDoctor: doctorName,
      }),
    );

    return {
      id: crypto.randomUUID(),
      patientId,
      date,
      doctorName,
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

function makeBilling(patientId: string): {
  invoices: Invoice[];
  payments: Payment[];
} {
  const invoices: Invoice[] = Array.from(
    { length: faker.number.int({ min: 1, max: 5 }) },
    () => {
      const itemCount = faker.number.int({ min: 1, max: 3 });
      const items = Array.from({ length: itemCount }, () => ({
        id: crypto.randomUUID(),
        description: faker.helpers.arrayElement(INVOICE_DESCRIPTIONS),
        amount: faker.number.int({ min: 1000, max: 10000, multipleOf: 500 }),
      }));
      const amount = items.reduce((sum, item) => sum + item.amount, 0);
      const status: InvoiceStatus = faker.helpers.arrayElement([
        "paid",
        "paid",
        "pending",
        "overdue",
      ]);
      return {
        id: `INV-${faker.number.int({ min: 1000, max: 9999 })}`,
        patientId,
        date: faker.date.past({ years: 1 }).toISOString(),
        items,
        amount,
        paidAmount: status === "paid" ? amount : 0,
        status,
      };
    },
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const payments: Payment[] = [];
  invoices.forEach((inv) => {
    if (inv.status === "paid") {
      payments.push({
        id: `PAY-${faker.number.int({ min: 1000, max: 9999 })}`,
        patientId,
        invoiceId: inv.id,
        date: inv.date,
        amount: inv.amount,
        method: faker.helpers.arrayElement<PaymentMethod>([
          "cash",
          "transfer",
          "card",
        ]),
        reference: faker.string.alphanumeric(8).toUpperCase(),
      });
    }
  });

  return { invoices, payments };
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
  const nameParts = name.split(" ");
  const firstName = nameParts[0];
  const lastName = nameParts[nameParts.length - 1];
  const dob = faker.date.birthdate({ min: 1, max: 80, mode: "age" });
  const createdAt = faker.date.past({ years: 3 }).toISOString();
  const id = crypto.randomUUID();

  const conditions = faker.helpers.arrayElements(CONDITIONS, {
    min: 0,
    max: 2,
  });
  const allergies = faker.helpers.arrayElements(ALLERGIES, {
    min: 0,
    max: 2,
  });

  const { invoices, payments } = makeBilling(id);

  return {
    id,
    fileNumber:
      fileType === "family"
        ? (familyFileNumber ?? makeFileNumber(seq))
        : makeFileNumber(seq),
    fileType,
    familyFileId,
    familyFileName:
      fileType === "family"
        ? (lastName ? `${lastName} Family` : "Unknown Family")
        : undefined,
    name,
    dateOfBirth: isoDate(dob),
    gender,
    phone: fakerEN_NG.phone.number({ style: "national" }),
    email: fakerEN_NG.internet.email({ firstName, lastName }),
    address: fakerEN_NG.location.streetAddress(),
    emergencyContacts: makeEmergencyContacts(),
    conditions: conditions.includes("None") ? [] : conditions,
    allergies: allergies.includes("None") ? [] : allergies,
    bloodGroup: faker.helpers.arrayElement(BLOOD_GROUPS),
    upcomingAppointment: faker.datatype.boolean({ probability: 0.3 })
      ? faker.date.soon({ days: 14 }).toISOString()
      : undefined,
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
        source: "system",
      },
    ],
    visits: makeVisits(id),
    appointments: makeAppointments(id),
    invoices,
    payments,
  };
}

// Seeded family file stubs
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
const usedFileNumbers = new Set<string>(
  seededPatients.map((p) => p.fileNumber),
);
let fileSeq = 12;

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
    const now = new Date().toISOString();
    let familyFileId = data.familyFileId;
    let fileNumber = data.fileNumber;

    if (data.fileType === "family" && data.createFamilyFile) {
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
      conditions: [],
      allergies: [],
      bloodGroup: "Pending",
      status: "active",
      createdAt: now,
      auditLog: [
        {
          id: crypto.randomUUID(),
          timestamp: now,
          userId: actor.id,
          userName: actor.name,
          action: "created",
          source: "UI",
        },
      ],
      visits: [],
      appointments: [],
      invoices: [],
      payments: [],
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
          source: "UI",
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
          source: "UI",
        },
      ],
    };
    store.set(id, updated);
    return updated;
  },

  async addVisit(patientId, visit, actor) {
    const existing = store.get(patientId);
    if (!existing) return null;
    const now = new Date().toISOString();
    const newVisit: Visit = {
      id: crypto.randomUUID(),
      patientId,
      date: visit.date,
      doctorName: visit.doctorName,
      doctorId: visit.doctorId,
      reason: visit.reason,
      summary: visit.summary,
      status: visit.status,
      type: visit.type,
      notes: visit.notes,
      diagnosis: visit.diagnosis,
      observations: visit.observations,
      prescriptions: visit.prescriptions,
    };
    const updated: Patient = {
      ...existing,
      visits: [newVisit, ...existing.visits],
      updatedAt: now,
      auditLog: [
        ...existing.auditLog,
        {
          id: crypto.randomUUID(),
          timestamp: now,
          userId: actor.id,
          userName: actor.name,
          action: "updated",
          changes: { visits: { from: "...", to: "added new visit" } },
          source: "UI",
        },
      ],
    };
    store.set(patientId, updated);
    return updated;
  },

  async addPrescription(patientId, prescription, actor) {
    const existing = store.get(patientId);
    if (!existing) return null;
    const now = new Date().toISOString();
    const newPrescription: Prescription = {
      ...prescription,
      id: crypto.randomUUID(),
    };

    const newVisit: Visit = {
      id: crypto.randomUUID(),
      patientId,
      date: now,
      doctorName: actor.name,
      doctorId: actor.id,
      reason: "Standalone Prescription",
      summary: `Prescribed ${newPrescription.medicine}`,
      status: "completed",
      type: "routine-checkup",
      notes: "Standalone prescription entry.",
      diagnosis: "N/A",
      observations: "N/A",
      prescriptions: [newPrescription],
    };

    const updated: Patient = {
      ...existing,
      visits: [newVisit, ...existing.visits],
      updatedAt: now,
      auditLog: [
        ...existing.auditLog,
        {
          id: crypto.randomUUID(),
          timestamp: now,
          userId: actor.id,
          userName: actor.name,
          action: "updated",
          changes: {
            prescriptions: { from: "none", to: newPrescription.medicine },
          },
          source: "UI",
        },
      ],
    };
    store.set(patientId, updated);
    return updated;
  },

  async cancelPrescription(patientId, prescriptionId, actor) {
    const existing = store.get(patientId);
    if (!existing) return null;
    const now = new Date().toISOString();

    const updatedVisits = existing.visits.map((v) => ({
      ...v,
      prescriptions: v.prescriptions.map((p) =>
        p.id === prescriptionId
          ? { ...p, status: "cancelled" as PrescriptionStatus }
          : p,
      ),
    }));

    const updated: Patient = {
      ...existing,
      visits: updatedVisits,
      updatedAt: now,
      auditLog: [
        ...existing.auditLog,
        {
          id: crypto.randomUUID(),
          timestamp: now,
          userId: actor.id,
          userName: actor.name,
          action: "updated",
          changes: { prescriptions: { from: "active", to: "cancelled" } },
          source: "UI",
        },
      ],
    };
    store.set(patientId, updated);
    return updated;
  },

  async addAppointment(patientId, appointment, actor) {
    const existing = store.get(patientId);
    if (!existing) return null;
    const now = new Date().toISOString();
    const newAppointment: Appointment = {
      id: crypto.randomUUID(),
      patientId,
      date: appointment.date,
      doctorId: appointment.doctorId,
      doctorName: appointment.doctorName,
      reason: appointment.reason,
      status: appointment.status,
      location: appointment.location,
      notes: appointment.notes,
    };
    const updated: Patient = {
      ...existing,
      appointments: [newAppointment, ...existing.appointments],
      updatedAt: now,
      auditLog: [
        ...existing.auditLog,
        {
          id: crypto.randomUUID(),
          timestamp: now,
          userId: actor.id,
          userName: actor.name,
          action: "updated",
          changes: {
            appointments: { from: "...", to: "added new appointment" },
          },
          source: "UI",
        },
      ],
    };
    store.set(patientId, updated);
    return updated;
  },

  async updateAppointment(patientId, appointmentId, data, actor) {
    const existing = store.get(patientId);
    if (!existing) return null;
    const now = new Date().toISOString();
    const updatedAppointments = existing.appointments.map((a) =>
      a.id === appointmentId ? { ...a, ...data } : a,
    );
    const updated: Patient = {
      ...existing,
      appointments: updatedAppointments,
      updatedAt: now,
      auditLog: [
        ...existing.auditLog,
        {
          id: crypto.randomUUID(),
          timestamp: now,
          userId: actor.id,
          userName: actor.name,
          action: "updated",
          changes: {
            appointments: { from: "...", to: `updated appointment ${appointmentId}` },
          },
          source: "UI",
        },
      ],
    };
    store.set(patientId, updated);
    return updated;
  },

  async cancelAppointment(patientId, appointmentId, actor) {
    const existing = store.get(patientId);
    if (!existing) return null;
    const now = new Date().toISOString();
    const updatedAppointments = existing.appointments.map((a) =>
      a.id === appointmentId
        ? { ...a, status: "cancelled" as AppointmentStatus }
        : a,
    );
    const updated: Patient = {
      ...existing,
      appointments: updatedAppointments,
      updatedAt: now,
      auditLog: [
        ...existing.auditLog,
        {
          id: crypto.randomUUID(),
          timestamp: now,
          userId: actor.id,
          userName: actor.name,
          action: "updated",
          changes: {
            appointments: { from: "confirmed/pending", to: "cancelled" },
          },
          source: "UI",
        },
      ],
    };
    store.set(patientId, updated);
    return updated;
  },

  async addInvoice(patientId, invoice, actor) {
    const existing = store.get(patientId);
    if (!existing) return null;
    const now = new Date().toISOString();
    const newInvoice: Invoice = {
      id: `INV-${faker.number.int({ min: 1000, max: 9999 })}`,
      patientId,
      date: invoice.date,
      items: invoice.items,
      amount: invoice.amount,
      paidAmount: invoice.paidAmount,
      status: invoice.status,
      visitId: invoice.visitId,
    };
    const updated: Patient = {
      ...existing,
      invoices: [newInvoice, ...existing.invoices],
      updatedAt: now,
      auditLog: [
        ...existing.auditLog,
        {
          id: crypto.randomUUID(),
          timestamp: now,
          userId: actor.id,
          userName: actor.name,
          action: "updated",
          changes: { billing: { from: "...", to: "added invoice" } },
          source: "UI",
        },
      ],
    };
    store.set(patientId, updated);
    return updated;
  },

  async addPayment(patientId, payment, actor) {
    const existing = store.get(patientId);
    if (!existing) return null;
    const now = new Date().toISOString();
    const newPayment: Payment = {
      id: `PAY-${faker.number.int({ min: 1000, max: 9999 })}`,
      patientId,
      invoiceId: payment.invoiceId,
      date: payment.date,
      amount: payment.amount,
      method: payment.method,
      reference: payment.reference,
    };

    // Correct partial payment logic
    const updatedInvoices = existing.invoices.map((inv) => {
      if (inv.id === payment.invoiceId) {
        const newPaidAmount = inv.paidAmount + payment.amount;
        // Only mark as paid if total paid >= invoice amount
        const newStatus: InvoiceStatus =
          newPaidAmount >= inv.amount ? "paid" : "pending";
        return { ...inv, paidAmount: newPaidAmount, status: newStatus };
      }
      return inv;
    });

    const updated: Patient = {
      ...existing,
      invoices: updatedInvoices,
      payments: [newPayment, ...existing.payments],
      updatedAt: now,
      auditLog: [
        ...existing.auditLog,
        {
          id: crypto.randomUUID(),
          timestamp: now,
          userId: actor.id,
          userName: actor.name,
          action: "updated",
          changes: {
            billing: {
              from: "...",
              to: `recorded payment of ₦${payment.amount}`,
            },
          },
          source: "UI",
        },
      ],
    };
    store.set(patientId, updated);
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
