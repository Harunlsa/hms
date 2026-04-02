import {
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Form,
  Input,
  Row,
  Select,
  Space,
  Typography,
  message,
} from "antd";
import {
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { EmergencyContact, Patient } from "../types/patient.types";
import { usePatientStore } from "../store/patient.store";
import { useEffect, useState } from "react";

const { Text } = Typography;

interface Props {
  patient: Patient;
  editing: boolean;
  onEditClose: () => void;
  onEditOpen: () => void;
}

interface FormValues {
  name: string;
  dateOfBirth: dayjs.Dayjs;
  gender: string;
  phone: string;
  email?: string;
  address?: string;
  // emergencyName?: string;
  // emergencyPhone?: string;
  // emergencyRelationship?: string;
}

const RELATIONSHIPS = [
  "Spouse",
  "Parent",
  "Sibling",
  "Child",
  "Friend",
  "Guardian",
];

function formatDob(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function calcAge(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

export function OverviewTab({
  patient,
  editing,
  onEditClose,
  onEditOpen,
}: Props) {
  const [form] = Form.useForm<FormValues>();
  const { update, saving } = usePatientStore();
  const [messageApi, contextHolder] = message.useMessage();

  // Local state for emergency contacts (managed outside AntD Form for flexibility)
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);

  // ── Sync form values whenever editing becomes true ─────────────────────────
  useEffect(() => {
    if (editing) {
      form.setFieldsValue({
        name: patient.name,
        dateOfBirth: patient.dateOfBirth
          ? dayjs(patient.dateOfBirth)
          : undefined,
        gender: patient.gender,
        phone: patient.phone,
        email: patient.email ?? "",
        address: patient.address ?? "",
      });
      setContacts((patient.emergencyContacts ?? []).map((c) => ({ ...c })));
    }
  }, [editing, patient, form]);

  // ── Emergency contact helpers ──────────────────────────────────────────────
  const addContact = () =>
    setContacts((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", phone: "", relationship: "" },
    ]);

  const removeContact = (id: string) =>
    setContacts((prev) => prev.filter((c) => c.id !== id));

  const updateContact = (
    id: string,
    field: keyof EmergencyContact,
    value: string,
  ) =>
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );

  // const openEdit = () => {
  //   form.setFieldsValue({
  //     name: patient.name,
  //     dateOfBirth: patient.dateOfBirth ? dayjs(patient.dateOfBirth) : undefined,
  //     gender: patient.gender,
  //     phone: patient.phone,
  //     email: patient.email,
  //     address: patient.address,
  //     emergencyName: patient.emergencyContact?.name,
  //     emergencyPhone: patient.emergencyContact?.phone,
  //     emergencyRelationship: patient.emergencyContact?.relationship,
  //   });
  //   onEditOpen();
  // };

  const handleSave = async (values: FormValues) => {
    try {
      await update(patient.id, {
        name: values.name.trim(),
        dateOfBirth: values.dateOfBirth?.format("YYYY-MM-DD"),
        gender: values.gender as Patient["gender"],
        phone: values.phone.trim(),
        email: values.email?.trim() || undefined,
        address: values.address?.trim() || undefined,
        emergencyContacts: contacts
          .filter((c) => c.name.trim())
          .map((c) => ({
            id: c.id,
            name: c.name.trim(),
            phone: c.phone.trim(),
            relationship: c.relationship,
          })),
      });
      messageApi.success("Patient record updated");
      onEditClose();
    } catch {
      messageApi.error("Failed to update patient record");
    }
  };

  // ── Edit form ──────────────────────────────────────────────────────────────
  if (editing) {
    return (
      <>
        {contextHolder}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          requiredMark="optional"
        >
          <div className="flex flex-col gap-4">
            {/* Personal information card */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <Text className="font-semibold text-base">
                  Personal Information
                </Text>
                <div className="flex gap-2">
                  <Button icon={<CloseOutlined />} onClick={onEditClose}>
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={saving}
                    onClick={() => form.submit()}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <Form.Item
                  label="Full Name"
                  name="name"
                  rules={[{ required: true }]}
                  className="mb-0"
                >
                  <Input size="large" />
                </Form.Item>

                <div className="grid grid-cols-2 gap-4">
                  <Form.Item
                    label="Date of Birth"
                    name="dateOfBirth"
                    rules={[{ required: true }]}
                    className="mb-0"
                  >
                    <DatePicker
                      className="w-full"
                      format="DD/MM/YYYY"
                      size="large"
                    />
                  </Form.Item>
                  <Form.Item
                    label="Gender"
                    name="gender"
                    rules={[{ required: true }]}
                    className="mb-0"
                  >
                    <Select size="large">
                      <Select.Option value="female">Female</Select.Option>
                      <Select.Option value="male">Male</Select.Option>
                      <Select.Option value="other">Other</Select.Option>
                    </Select>
                  </Form.Item>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Form.Item
                    label="Phone"
                    name="phone"
                    rules={[{ required: true }]}
                    className="mb-0"
                  >
                    <Input size="large" />
                  </Form.Item>
                  <Form.Item label="Email" name="email" className="mb-0">
                    <Input type="email" size="large" />
                  </Form.Item>
                </div>

                <Form.Item
                  label="Residential Address"
                  name="address"
                  className="mb-0"
                >
                  <Input.TextArea rows={2} />
                </Form.Item>
              </div>
            </div>

            {/* Emergency contacts card */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <Text className="font-semibold text-base block mb-4">
                Emergency Contacts
              </Text>

              <div className="flex flex-col gap-3">
                {contacts.map((contact, idx) => (
                  <div
                    key={contact.id}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4 relative"
                  >
                    <button
                      type="button"
                      onClick={() => removeContact(contact.id)}
                      className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <DeleteOutlined />b
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
                          onChange={(v) =>
                            updateContact(contact.id, "relationship", v)
                          }
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
          </div>
        </Form>
      </>
    );
  }

  // ── Read-only view ───────────────────────────────────────────────────────────
  return (
    <>
      {contextHolder}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Demographics — spans 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <Text className="font-semibold text-base">Demographics</Text>
            <Button icon={<EditOutlined />} size="small" onClick={onEditOpen}>
              Edit
            </Button>
          </div>
          <Descriptions
            column={1}
            size="small"
            className="[&_.ant-descriptions-item-label]:text-gray-500 [&_.ant-descriptions-item-label]:w-36"
          >
            <Descriptions.Item label="Full Name">
              <span className="font-medium">{patient.name}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Date of Birth">
              {patient.dateOfBirth ? formatDob(patient.dateOfBirth) : "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Gender">
              {patient.gender[0].toUpperCase() + patient.gender.slice(1)}
            </Descriptions.Item>
            <Descriptions.Item label="Phone">
              {patient.phone || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {patient.email || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Address">
              {patient.address || "—"}
            </Descriptions.Item>
          </Descriptions>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* File info */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <Text className="font-semibold text-base block mb-3">
              File Info
            </Text>
            <Descriptions
              column={1}
              size="small"
              className="[&_.ant-descriptions-item-label]:text-gray-500"
            >
              <Descriptions.Item label="File #">
                <span className="font-mono">#{patient.fileNumber}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                {patient.fileType === "family" ? (
                  <span>
                    Family{" "}
                    <span className="text-gray-400 text-xs">
                      ({patient.familyFileNumber})
                    </span>
                  </span>
                ) : (
                  "Individual"
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Registered">
                {new Date(patient.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </Descriptions.Item>
              {patient.updatedAt && (
                <Descriptions.Item label="Last Updated">
                  {new Date(patient.updatedAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>

          {/* Emergency contacts */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <Text className="font-semibold text-base block mb-3">
              Emergency Contacts
            </Text>
            {(patient.emergencyContacts ?? []).length === 0 ? (
              <Text type="secondary" className="text-sm">
                No emergency contacts on record.
              </Text>
            ) : (
              <div className="flex flex-col divide-y divide-gray-100">
                {(patient.emergencyContacts ?? []).map((c) => (
                  <div key={c.id} className="py-2 first:pt-0 last:pb-0">
                    <div className="font-medium text-sm">{c.name}</div>
                    <div className="text-gray-500 text-xs mt-0.5">
                      {[c.relationship, c.phone].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
