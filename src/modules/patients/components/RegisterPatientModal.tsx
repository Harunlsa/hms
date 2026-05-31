// src/modules/patients/components/RegisterPatientModal.tsx
import {
  Alert,
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  Steps,
  Tag,
  Typography,
  message,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
  PhoneOutlined,
  TeamOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import {
  EmergencyContact,
  Patient,
  RegisterPatientInput,
} from "../types/patient.types";
import { FamilyFile } from "../types/family-file.types";
import { usePatientStore } from "../store/patient.store";

const { Text, Title } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (patient: Patient) => void;
}

type FileAssignment = "individual" | "existing-family" | "new-family";

// Stored after step 1 validation — avoids reading from an unmounted form
interface Step1Data {
  name: string;
  dateOfBirth: dayjs.Dayjs;
  gender: string;
  phone: string;
  email: string;
  address: string;
}

const RELATIONSHIPS = [
  "Spouse",
  "Parent",
  "Sibling",
  "Child",
  "Friend",
  "Guardian",
];

const STEPS = [
  { title: "Personal Info", icon: <UserOutlined /> },
  { title: "Emergency Contacts", icon: <PhoneOutlined /> },
  { title: "File Assignment", icon: <TeamOutlined /> },
  { title: "Review", icon: <CheckCircleOutlined /> },
];

function ReviewRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-gray-100 last:border-0">
      <Text type="secondary" className="text-sm w-32 shrink-0">
        {label}
      </Text>
      <Text className="text-sm font-medium text-right">{value || "—"}</Text>
    </div>
  );
}

export function RegisterPatientModal({ open, onClose, onSuccess }: Props) {
  const [step, setStep] = useState(0);
  const [step1Form] = Form.useForm<Step1Data>();

  // ── Committed step-1 data (populated when user clicks Next from step 1) ────
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);

  // ── Emergency contacts ─────────────────────────────────────────────────────
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);

  // ── File assignment ────────────────────────────────────────────────────────
  const [fileAssignment, setFileAssignment] =
    useState<FileAssignment>("individual");
  const [fileNumber, setFileNumber] = useState("");
  const [selectedFamilyFile, setSelectedFamilyFile] =
    useState<FamilyFile | null>(null);
  const [familySearchQuery, setFamilySearchQuery] = useState("");
  const [newFamilyName, setNewFamilyName] = useState("");

  // ── Duplicate warning ──────────────────────────────────────────────────────
  const [duplicateWarning, setDuplicateWarning] = useState<Patient | null>(
    null,
  );
  const [confirmedDuplicate, setConfirmedDuplicate] = useState(false);

  const [messageApi, contextHolder] = message.useMessage();

  // React 19 requires an initial value for useRef
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const {
    register,
    saving,
    familyFileResults,
    familyFileSearching,
    searchFamilyFiles,
    nextFileNumber,
    fetchNextFileNumber,
    isFileNumberTaken,
  } = usePatientStore();

  // Pre-fill the file number whenever the modal opens
  useEffect(() => {
    if (open) fetchNextFileNumber();
  }, [open]);

  // Once we have the next file number, pre-fill the state
  useEffect(() => {
    if (nextFileNumber) setFileNumber(nextFileNumber);
  }, [nextFileNumber]);

  // Load family files when step 2 is showing and user chose existing-family
  useEffect(() => {
    if (step === 2 && fileAssignment === "existing-family") {
      searchFamilyFiles(familySearchQuery);
    }
  }, [step, fileAssignment]);

  // Auto-suggest family name from the patient's last name
  useEffect(() => {
    if (fileAssignment === "new-family" && step1Data?.name && !newFamilyName) {
      const lastName = step1Data.name.trim().split(" ").at(-1) ?? "";
      if (lastName) setNewFamilyName(`${lastName} Family`);
    }
  }, [fileAssignment, step1Data]);

  const handleFamilySearch = (q: string) => {
    setFamilySearchQuery(q);
    setSelectedFamilyFile(null);
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => searchFamilyFiles(q), 300);
  };

  // ── Reset ──────────────────────────────────────────────────────────────────
  const resetAll = () => {
    setStep(0);
    step1Form.resetFields();
    setStep1Data(null);
    setContacts([]);
    setFileAssignment("individual");
    setFileNumber("");
    setSelectedFamilyFile(null);
    setFamilySearchQuery("");
    setNewFamilyName("");
    setDuplicateWarning(null);
    setConfirmedDuplicate(false);
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  // ── Emergency contact helpers ──────────────────────────────────────────────
  const addContact = () =>
    setContacts((p) => [
      ...p,
      { id: crypto.randomUUID(), name: "", phone: "", relationship: "" },
    ]);

  const removeContact = (id: string) =>
    setContacts((p) => p.filter((c) => c.id !== id));

  const updateContact = (
    id: string,
    field: keyof EmergencyContact,
    value: string,
  ) =>
    setContacts((p) =>
      p.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goNext = async () => {
    if (step === 0) {
      try {
        const values = await step1Form.validateFields();
        setStep1Data(values);
      } catch {
        return;
      }
    }
    if (
      step === 2 &&
      fileAssignment === "existing-family" &&
      !selectedFamilyFile
    ) {
      messageApi.warning(
        "Please select a family file or choose a different option.",
      );
      return;
    }
    if (
      step === 2 &&
      fileAssignment === "new-family" &&
      !newFamilyName.trim()
    ) {
      messageApi.warning("Please enter a name for the new family file.");
      return;
    }
    if (step === 2 && fileAssignment !== "existing-family") {
      if (!fileNumber.trim()) {
        messageApi.warning("Please enter a file number.");
        return;
      }
      const taken = await isFileNumberTaken(fileNumber.trim());
      if (taken) {
        messageApi.error(
          `File number ${fileNumber.trim()} is already registered.`,
        );
        return;
      }
    }
    setStep((s) => s + 1);
  };

  const goBack = () => {
    setDuplicateWarning(null);
    setStep((s) => s - 1);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (force = false) => {
    if (!step1Data) return;

    const data: RegisterPatientInput = {
      name: step1Data.name.trim(),
      dateOfBirth: step1Data.dateOfBirth.format("YYYY-MM-DD"),
      gender: step1Data.gender as RegisterPatientInput["gender"],
      phone: step1Data.phone?.trim() || undefined,
      email: step1Data.email?.trim() || undefined,
      address: step1Data.address?.trim() || undefined,
      emergencyContacts: contacts
        .filter((c) => c.name.trim())
        .map(({ id: _id, ...c }) => c),
      fileType: fileAssignment === "individual" ? "individual" : "family",
      // For individual + new family: user-confirmed number from step 2
      // For existing family: ignored — create() overrides with the family file's number
      fileNumber: fileNumber.trim(),
      familyFileId:
        fileAssignment === "existing-family"
          ? selectedFamilyFile?.id
          : undefined,
      createFamilyFile: fileAssignment === "new-family",
      familyFileName:
        fileAssignment === "new-family" ? newFamilyName.trim() : undefined,
    };

    try {
      const { patient, duplicate } = await register(data);
      if (duplicate && !force && !confirmedDuplicate) {
        setDuplicateWarning(duplicate);
        return;
      }
      resetAll();
      onSuccess(patient);
    } catch {
      messageApi.error("Registration failed. Please try again.");
    }
  };

  // ── Step 0: Personal Info ──────────────────────────────────────────────────
  const renderStep0 = () => (
    <Form
      form={step1Form}
      layout="vertical"
      requiredMark="optional"
      className="pt-2"
    >
      <Form.Item
        label="Full Name"
        name="name"
        rules={[{ required: true, message: "Full name is required" }]}
      >
        <Input placeholder="e.g. Fatima Ibrahim Lawal" size="large" />
      </Form.Item>

      <div className="grid grid-cols-2 gap-4">
        <Form.Item
          label="Date of Birth"
          name="dateOfBirth"
          rules={[{ required: true, message: "Required" }]}
        >
          <DatePicker className="w-full" format="DD/MM/YYYY" size="large" />
        </Form.Item>
        <Form.Item
          label="Gender"
          name="gender"
          rules={[{ required: true, message: "Required" }]}
        >
          <Select placeholder="Select gender" size="large">
            <Select.Option value="female">Female</Select.Option>
            <Select.Option value="male">Male</Select.Option>
            <Select.Option value="other">Other</Select.Option>
          </Select>
        </Form.Item>
      </div>

      <Form.Item
        label="Phone Number"
        name="phone"
        rules={[{ required: true, message: "Phone number is required" }]}
      >
        <Input placeholder="e.g. 0801 234 5678" size="large" />
      </Form.Item>

      <Form.Item label="Email Address" name="email">
        <Input
          placeholder="e.g. patient@example.com"
          type="email"
          size="large"
        />
      </Form.Item>

      <Form.Item label="Residential Address" name="address">
        <Input.TextArea rows={2} placeholder="Street address, city, state" />
      </Form.Item>
    </Form>
  );

  // ── Step 1: Emergency Contacts ─────────────────────────────────────────────
  const renderStep1 = () => (
    <div className="pt-2">
      <Text type="secondary" className="block mb-4 text-sm">
        Add one or more emergency contacts. This step is optional.
      </Text>

      <div className="flex flex-col gap-3">
        {contacts.map((contact, idx) => (
          <div
            key={contact.id}
            className="border border-gray-200 rounded-lg p-4 relative bg-gray-50"
          >
            <button
              type="button"
              onClick={() => removeContact(contact.id)}
              className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors"
            >
              <DeleteOutlined />
            </button>
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-3">
              Contact {idx + 1}
            </Text>
            <div className="flex flex-col gap-2">
              <Input
                placeholder="Full name"
                value={contact.name}
                onChange={(e) =>
                  updateContact(contact.id, "name", e.target.value)
                }
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Phone number"
                  value={contact.phone}
                  onChange={(e) =>
                    updateContact(contact.id, "phone", e.target.value)
                  }
                />
                <Select
                  placeholder="Relationship"
                  value={contact.relationship || undefined}
                  onChange={(v) => updateContact(contact.id, "relationship", v)}
                >
                  {RELATIONSHIPS.map((r) => (
                    <Select.Option key={r} value={r}>
                      {r}
                    </Select.Option>
                  ))}
                </Select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={addContact}
        className="w-full mt-3"
      >
        Add Emergency Contact
      </Button>
    </div>
  );

  // ── Step 2: File Assignment ────────────────────────────────────────────────
  const renderStep2 = () => (
    <div className="pt-2 flex flex-col gap-4">
      <Text type="secondary" className="text-sm">
        Choose how this patient's file should be structured.
      </Text>

      <Radio.Group
        value={fileAssignment}
        onChange={(e) => {
          setFileAssignment(e.target.value);
          setSelectedFamilyFile(null);
          setNewFamilyName("");
        }}
        className="flex flex-col gap-2"
      >
        {[
          {
            value: "individual",
            title: "Individual File",
            desc: "A standalone file solely for this patient.",
          },
          {
            value: "existing-family",
            title: "Add to Existing Family File",
            desc: "Link this patient to a family file that already exists.",
          },
          {
            value: "new-family",
            title: "Create New Family File",
            desc: "Start a new family file with this patient as the first member.",
          },
        ].map(({ value, title, desc }) => (
          <label
            key={value}
            className={`flex items-start gap-3 border rounded-lg p-3 cursor-pointer transition-colors ${
              fileAssignment === value
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-blue-300"
            }`}
          >
            <Radio value={value} className="mt-0.5" />
            <div>
              <Text strong>{title}</Text>
              <Text type="secondary" className="block text-sm">
                {desc}
              </Text>
            </div>
          </label>
        ))}
      </Radio.Group>

      {/* Existing family file search */}
      {fileAssignment === "existing-family" && (
        <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
          <Text className="block mb-2 text-sm font-medium">
            Search Family Files
          </Text>
          <Input
            prefix={<SearchOutlined className="text-gray-400" />}
            placeholder="Search by family name or file number…"
            value={familySearchQuery}
            onChange={(e) => handleFamilySearch(e.target.value)}
            allowClear
          />
          <div className="mt-2 flex flex-col gap-1 max-h-44 overflow-y-auto">
            {familyFileSearching && (
              <Text type="secondary" className="text-sm p-2">
                Searching…
              </Text>
            )}
            {!familyFileSearching && familyFileResults.length === 0 && (
              <Text type="secondary" className="text-sm p-2">
                No family files found.
              </Text>
            )}
            {familyFileResults.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFamilyFile(f)}
                className={`text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedFamilyFile?.id === f.id
                    ? "bg-blue-600 text-white"
                    : "hover:bg-blue-100 text-gray-700"
                }`}
              >
                <span className="font-medium">{f.headName}</span>
                <span
                  className={`ml-2 text-xs ${selectedFamilyFile?.id === f.id ? "text-blue-100" : "text-gray-400"}`}
                >
                  {f.fileNumber} · {f.memberIds.length} member
                  {f.memberIds.length !== 1 ? "s" : ""}
                </span>
              </button>
            ))}
          </div>
          {selectedFamilyFile && (
            <div className="mt-2">
              <Tag color="blue">
                Selected: {selectedFamilyFile.headName} (
                {selectedFamilyFile.fileNumber})
              </Tag>
            </div>
          )}
        </div>
      )}

      {/* New family file name input */}
      {fileAssignment === "new-family" && (
        <div className="border border-green-200 bg-green-50 rounded-lg p-4">
          <Text className="block mb-2 text-sm font-medium">
            Family File Name
          </Text>
          <Input
            placeholder="e.g. Ibrahim Family"
            value={newFamilyName}
            onChange={(e) => setNewFamilyName(e.target.value)}
            size="large"
          />
          <Text type="secondary" className="text-xs mt-1 block">
            A new family file will be created with this name.
          </Text>
        </div>
      )}

      {/* File number — shown for individual and new-family; hidden for existing-family */}
      {fileAssignment !== "existing-family" && (
        <div>
          <Text className="block mb-1 text-sm font-medium">
            File Number
            <Text type="secondary" className="text-xs font-normal ml-1">
              (auto-filled — editable)
            </Text>
          </Text>
          <Input
            value={fileNumber}
            onChange={(e) => setFileNumber(e.target.value)}
            placeholder="e.g. 100014"
            className="font-mono"
            size="large"
          />
          <Text type="secondary" className="text-xs mt-1 block">
            Pre-filled with the next available number. Edit to assign a custom
            number — must be unique.
          </Text>
        </div>
      )}
    </div>
  );

  // ── Step 3: Review ─────────────────────────────────────────────────────────
  const renderStep3 = () => {
    if (!step1Data) return null;

    const dobFormatted = step1Data.dateOfBirth
      ? step1Data.dateOfBirth.format("DD MMM YYYY")
      : "—";

    const genderLabel = step1Data.gender
      ? step1Data.gender[0].toUpperCase() + step1Data.gender.slice(1)
      : "—";

    const fileLabel =
      fileAssignment === "individual"
        ? `Individual — #${fileNumber}`
        : fileAssignment === "new-family"
          ? `New Family File "${newFamilyName}" — #${fileNumber}`
          : `Existing Family File — ${selectedFamilyFile?.headName ?? ""} (${selectedFamilyFile?.fileNumber ?? ""})`;

    const validContacts = contacts.filter((c) => c.name.trim());

    return (
      <div className="pt-2 flex flex-col gap-3">
        {duplicateWarning && (
          <Alert
            type="warning"
            showIcon
            message="Possible Duplicate Patient"
            description={
              <div className="flex flex-col gap-2 mt-1">
                <Text className="text-sm">
                  A patient named <Text strong>{duplicateWarning.name}</Text>{" "}
                  with the same date of birth already exists{" "}
                  {duplicateWarning.fileNumber
                    ? `(File #${duplicateWarning.fileNumber})`
                    : ""}
                  .
                </Text>
                <div className="flex gap-2">
                  <Button
                    size="small"
                    onClick={() => setDuplicateWarning(null)}
                  >
                    Dismiss
                  </Button>
                  <Button
                    size="small"
                    type="primary"
                    danger
                    onClick={() => {
                      setConfirmedDuplicate(true);
                      handleSubmit(true);
                    }}
                  >
                    Register Anyway
                  </Button>
                </div>
              </div>
            }
          />
        )}

        <div className="bg-gray-50 rounded-lg p-4">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">
            Personal Information
          </Text>
          <ReviewRow label="Full Name" value={step1Data.name} />
          <ReviewRow label="Date of Birth" value={dobFormatted} />
          <ReviewRow label="Gender" value={genderLabel} />
          <ReviewRow label="Phone" value={step1Data.phone} />
          <ReviewRow label="Email" value={step1Data.email} />
          <ReviewRow label="Address" value={step1Data.address} />
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">
            Emergency Contacts
          </Text>
          {validContacts.length === 0 ? (
            <Text type="secondary" className="text-sm">
              None provided
            </Text>
          ) : (
            validContacts.map((c, i) => (
              <div key={i} className="flex items-center gap-2 py-1">
                <Text className="text-sm">{c.name}</Text>
                {c.relationship && <Tag color="default">{c.relationship}</Tag>}
                {c.phone && (
                  <Text type="secondary" className="text-sm">
                    {c.phone}
                  </Text>
                )}
              </div>
            ))
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">
            File Assignment
          </Text>
          <Text className="text-sm">{fileLabel}</Text>
        </div>
      </div>
    );
  };

  const stepContent = [renderStep0, renderStep1, renderStep2, renderStep3];
  const isLastStep = step === STEPS.length - 1;

  return (
    <>
      {contextHolder}
      <Modal
        open={open}
        onCancel={handleClose}
        title={
          <div className="pr-6">
            <Title level={5} className="mb-0!">
              Register New Patient
            </Title>
            <Text type="secondary" className="text-sm font-normal">
              Step {step + 1} of {STEPS.length}
            </Text>
          </div>
        }
        footer={
          <div className="flex justify-between items-center pt-1">
            <Button onClick={handleClose} disabled={saving}>
              Cancel
            </Button>
            <div className="flex gap-2">
              {step > 0 && (
                <Button onClick={goBack} disabled={saving}>
                  Back
                </Button>
              )}
              {isLastStep ? (
                <Button
                  type="primary"
                  loading={saving}
                  onClick={() => handleSubmit(false)}
                >
                  Register Patient
                </Button>
              ) : (
                <Button type="primary" onClick={goNext}>
                  Next
                </Button>
              )}
            </div>
          </div>
        }
        width={580}
        styles={{
          body: { maxHeight: "62vh", overflowY: "auto", paddingTop: 8 },
        }}
        destroyOnHidden
      >
        <Steps
          current={step}
          items={STEPS}
          size="small"
          className="mb-6"
          labelPlacement="vertical"
        />
        {stepContent[step]?.()}
      </Modal>
    </>
  );
}
