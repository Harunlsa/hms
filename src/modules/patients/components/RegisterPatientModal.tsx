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
import { Patient, RegisterPatientInput } from "../types/patient.types";
import { FamilyFile } from "../types/family-file.types";
import { usePatientStore } from "../store/patient.store";

const { Text, Title } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (patient: Patient) => void;
}

type FileAssignment = "individual" | "existing-family" | "new-family";

interface StepOneValues {
  name: string;
  dateOfBirth: dayjs.Dayjs;
  gender: string;
  phone: string;
  email?: string;
  address?: string;
}

interface EmergencyContactForm {
  name: string;
  phone: string;
  relationship: string;
}

// ─── Step indicators ─────────────────────────────────────────────────────────
const STEPS = [
  { title: "Personal Info", icon: <UserOutlined /> },
  { title: "Emergency Contacts", icon: <PhoneOutlined /> },
  { title: "File Assignment", icon: <TeamOutlined /> },
  { title: "Review", icon: <CheckCircleOutlined /> },
];

const RELATIONSHIPS = [
  "Spouse",
  "Parent",
  "Sibling",
  "Child",
  "Friend",
  "Guardian",
];

// ─── Review row helper ────────────────────────────────────────────────────────
function ReviewRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-gray-100 last:border-0">
      <Text type="secondary" className="text-sm">
        {label}
      </Text>
      <Text className="text-sm font-medium">{value || "—"}</Text>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function RegisterPatientModal({ open, onClose, onSuccess }: Props) {
  const [step, setStep] = useState(0);
  const [step1Form] = Form.useForm<StepOneValues>();
  const [emergencyContacts, setEmergencyContacts] = useState<
    EmergencyContactForm[]
  >([]);
  const [fileAssignment, setFileAssignment] =
    useState<FileAssignment>("individual");
  const [selectedFamilyFile, setSelectedFamilyFile] =
    useState<FamilyFile | null>(null);
  const [familySearchQuery, setFamilySearchQuery] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState<Patient | null>(
    null,
  );
  const [confirmedDuplicate, setConfirmedDuplicate] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const {
    register,
    saving,
    familyFileResults,
    familyFileSearching,
    searchFamilyFiles,
  } = usePatientStore();

  // Load family files when that step is active
  useEffect(() => {
    if (step === 2 && fileAssignment === "existing-family") {
      searchFamilyFiles(familySearchQuery);
    }
  }, [step, fileAssignment]);

  const handleFamilySearch = (q: string) => {
    setFamilySearchQuery(q);
    setSelectedFamilyFile(null);
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => searchFamilyFiles(q), 300);
  };

  const resetAll = () => {
    setStep(0);
    step1Form.resetFields();
    setEmergencyContacts([]);
    setFileAssignment("individual");
    setSelectedFamilyFile(null);
    setFamilySearchQuery("");
    setDuplicateWarning(null);
    setConfirmedDuplicate(false);
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  // ── Emergency contacts helpers ─────────────────────────────────────────────
  const addContact = () =>
    setEmergencyContacts((prev) => [
      ...prev,
      { name: "", phone: "", relationship: "" },
    ]);

  const removeContact = (idx: number) =>
    setEmergencyContacts((prev) => prev.filter((_, i) => i !== idx));

  const updateContact = (
    idx: number,
    field: keyof EmergencyContactForm,
    value: string,
  ) =>
    setEmergencyContacts((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)),
    );

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goNext = async () => {
    if (step === 0) {
      try {
        await step1Form.validateFields();
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
    setStep((s) => s + 1);
  };

  const goBack = () => {
    setDuplicateWarning(null);
    setStep((s) => s - 1);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (force = false) => {
    const values = step1Form.getFieldsValue();

    const data: RegisterPatientInput = {
      name: values.name.trim(),
      dateOfBirth: values.dateOfBirth.format("YYYY-MM-DD"),
      gender: values.gender as RegisterPatientInput["gender"],
      phone: values.phone.trim(),
      email: values.email?.trim() || undefined,
      address: values.address?.trim() || undefined,
      emergencyContacts: emergencyContacts
        .filter((c) => c.name.trim())
        .map((c) => ({
          name: c.name.trim(),
          phone: c.phone.trim(),
          relationship: c.relationship,
        })),
      fileType: fileAssignment === "individual" ? "individual" : "family",
      familyFileId:
        fileAssignment === "existing-family"
          ? selectedFamilyFile?.id
          : undefined,
      createFamilyFile: fileAssignment === "new-family",
    };

    try {
      const { patient, duplicate } = await register(data);
      if (duplicate && !force && !confirmedDuplicate) {
        setDuplicateWarning(duplicate);
        return;
      }
      messageApi.success(
        `Patient "${patient.name}" registered — File #${patient.fileNumber}`,
      );
      resetAll();
      onSuccess(patient);
    } catch {
      messageApi.error("Registration failed. Please try again.");
    }
  };

  // ── Step 1: Personal Info ──────────────────────────────────────────────────
  const step1Values = step1Form.getFieldsValue();

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
        <Input placeholder="e.g. Fatima Ibrahim Umar" size="large" />
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

  // ── Step 2: Emergency Contacts ─────────────────────────────────────────────
  const renderStep1 = () => (
    <div className="pt-2">
      <Text type="secondary" className="block mb-4 text-sm">
        Add one or more emergency contacts. This step is optional.
      </Text>

      <div className="flex flex-col gap-3">
        {emergencyContacts.map((contact, idx) => (
          <div
            key={idx}
            className="border border-gray-200 rounded-lg p-4 relative bg-gray-50"
          >
            <button
              type="button"
              onClick={() => removeContact(idx)}
              className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors"
            >
              <DeleteOutlined />
            </button>
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-3">
              Contact {idx + 1}
            </Text>
            <div className="flex flex-col gap-2">
              <Input
                placeholder="Full name"
                value={contact.name}
                onChange={(e) => updateContact(idx, "name", e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Phone number"
                  value={contact.phone}
                  onChange={(e) => updateContact(idx, "phone", e.target.value)}
                />
                <Select
                  placeholder="Relationship"
                  value={contact.relationship || undefined}
                  onChange={(v) => updateContact(idx, "relationship", v)}
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

  // ── Step 3: File Assignment ────────────────────────────────────────────────
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
        }}
        className="flex flex-col gap-2"
      >
        <Radio
          value="individual"
          className="border border-gray-200 rounded-lg p-3 w-full hover:border-blue-400 transition-colors"
        >
          <div>
            <Text strong>Individual File</Text>
            <Text type="secondary" className="block text-sm">
              A standalone file solely for this patient.
            </Text>
          </div>
        </Radio>
        <Radio
          value="existing-family"
          className="border border-gray-200 rounded-lg p-3 w-full hover:border-blue-400 transition-colors"
        >
          <div>
            <Text strong>Add to Existing Family File</Text>
            <Text type="secondary" className="block text-sm">
              Link this patient to a family file that already exists.
            </Text>
          </div>
        </Radio>
        <Radio
          value="new-family"
          className="border border-gray-200 rounded-lg p-3 w-full hover:border-blue-400 transition-colors"
        >
          <div>
            <Text strong>Create New Family File</Text>
            <Text type="secondary" className="block text-sm">
              Start a new family file and add this patient as the first member.
            </Text>
          </div>
        </Radio>
      </Radio.Group>

      {fileAssignment === "existing-family" && (
        <div className="border border-blue-100 bg-blue-50 rounded-lg p-4">
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
            <div className="mt-2 flex items-center gap-2">
              <Tag color="blue">
                Selected: {selectedFamilyFile.headName} (
                {selectedFamilyFile.fileNumber})
              </Tag>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ── Step 4: Review ─────────────────────────────────────────────────────────
  const renderStep3 = () => {
    const dob = step1Values.dateOfBirth
      ? dayjs(step1Values.dateOfBirth).format("DD MMM YYYY")
      : "—";
    const fileLabel =
      fileAssignment === "individual"
        ? "Individual File"
        : fileAssignment === "new-family"
          ? "New Family File"
          : `Family File — ${selectedFamilyFile?.headName ?? ""} (${selectedFamilyFile?.fileNumber ?? ""})`;

    return (
      <div className="pt-2 flex flex-col gap-4">
        {duplicateWarning && (
          <Alert
            type="warning"
            showIcon
            message="Possible Duplicate Patient"
            description={
              <div className="flex flex-col gap-2 mt-1">
                <Text className="text-sm">
                  A patient named <Text strong>{duplicateWarning.name}</Text>{" "}
                  with the same date of birth already exists (File #
                  {duplicateWarning.fileNumber}).
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
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
            Personal Information
          </Text>
          <ReviewRow label="Full Name" value={step1Values.name} />
          <ReviewRow label="Date of Birth" value={dob} />
          <ReviewRow
            label="Gender"
            value={
              step1Values.gender
                ? step1Values.gender[0].toUpperCase() +
                  step1Values.gender.slice(1)
                : undefined
            }
          />
          <ReviewRow label="Phone" value={step1Values.phone} />
          <ReviewRow label="Email" value={step1Values.email} />
          <ReviewRow label="Address" value={step1Values.address} />
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
            Emergency Contacts
          </Text>
          {emergencyContacts.filter((c) => c.name.trim()).length === 0 ? (
            <Text type="secondary" className="text-sm">
              None provided
            </Text>
          ) : (
            emergencyContacts
              .filter((c) => c.name.trim())
              .map((c, i) => (
                <div key={i} className="mb-1">
                  <Text className="text-sm">{c.name}</Text>
                  {c.relationship && (
                    <Tag className="ml-2" color="default">
                      {c.relationship}
                    </Tag>
                  )}
                  {c.phone && (
                    <Text type="secondary" className="text-sm ml-2">
                      {c.phone}
                    </Text>
                  )}
                </div>
              ))
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
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
          body: { maxHeight: "60vh", overflowY: "auto", paddingTop: 8 },
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
