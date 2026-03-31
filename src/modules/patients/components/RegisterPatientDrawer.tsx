import {
  Alert,
  Button,
  DatePicker,
  Drawer,
  Form,
  Input,
  Select,
  Space,
  Typography,
} from "antd";
import { useState } from "react";
import { Patient, RegisterPatientInput } from "../types/patient.types";
import { usePatientStore } from "../store/patient.store";

const { Text } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (patient: Patient) => void;
}

interface FormValues {
  name: string;
  dateOfBirth: { format: (f: string) => string };
  gender: "male" | "female";
  phone: string;
  email?: string;
  address?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRelationship?: string;
}

export function RegisterPatientDrawer({ open, onClose, onSuccess }: Props) {
  const [form] = Form.useForm<FormValues>();
  const { register, saving } = usePatientStore();
  const [duplicateWarning, setDuplicateWarning] = useState<Patient | null>(
    null,
  );
  const [confirmedDuplicate, setConfirmedDuplicate] = useState(false);

  const handleClose = () => {
    form.resetFields();
    setDuplicateWarning(null);
    setConfirmedDuplicate(false);
    onClose();
  };

  const handleSubmit = async (values: FormValues) => {
    const data: RegisterPatientInput = {
      name: values.name.trim(),
      dateOfBirth: values.dateOfBirth.format("YYYY-MM-DD"),
      gender: values.gender,
      phone: values.phone.trim(),
      email: values.email?.trim() || undefined,
      address: values.address?.trim() || undefined,
      emergencyContact: values.emergencyName
        ? {
            name: values.emergencyName.trim(),
            phone: values.emergencyPhone?.trim() ?? "",
            relationship: values.emergencyRelationship?.trim() ?? "",
          }
        : undefined,
    };

    try {
      const { patient, duplicate } = await register(data);

      if (duplicate && !confirmedDuplicate) {
        setDuplicateWarning(duplicate);
        return;
      }

      onSuccess(patient);
      handleClose();
    } catch {
      // error displayed via store
    }
  };

  return (
    <Drawer
      title="Register New Patient"
      placement="right"
      width={520}
      open={open}
      onClose={handleClose}
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="primary" loading={saving} onClick={() => form.submit()}>
            Register Patient
          </Button>
        </div>
      }
    >
      {duplicateWarning && !confirmedDuplicate && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Possible Duplicate"
          description={
            <Space direction="vertical" size={4}>
              <Text>
                A patient named <Text strong>{duplicateWarning.name}</Text> with
                the same date of birth already exists (File #
                {duplicateWarning.fileNumber}).
              </Text>
              <Space>
                <Button
                  size="small"
                  onClick={() => {
                    setDuplicateWarning(null);
                    handleClose();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  type="primary"
                  danger
                  onClick={() => {
                    setConfirmedDuplicate(true);
                    setDuplicateWarning(null);
                    form.submit();
                  }}
                >
                  Register Anyway
                </Button>
              </Space>
            </Space>
          }
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark="optional"
      >
        {/* ── Personal Info ── */}
        <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 12 }}>
          Personal Information
        </Typography.Title>

        <Form.Item
          label="Full Name"
          name="name"
          rules={[{ required: true, message: "Full name is required" }]}
        >
          <Input placeholder="e.g. Fatima Ibrahim Lawal" />
        </Form.Item>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <Form.Item
            label="Date of Birth"
            name="dateOfBirth"
            rules={[{ required: true, message: "Date of birth is required" }]}
          >
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item
            label="Gender"
            name="gender"
            rules={[{ required: true, message: "Gender is required" }]}
          >
            <Select placeholder="Select gender">
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
          <Input placeholder="e.g. 0801 234 5678" />
        </Form.Item>

        <Form.Item label="Email Address" name="email">
          <Input placeholder="e.g. patient@example.com" type="email" />
        </Form.Item>

        <Form.Item label="Residential Address" name="address">
          <Input.TextArea rows={2} placeholder="Street address, city, state" />
        </Form.Item>

        {/* ── Emergency Contact ── */}
        <Typography.Title level={5} style={{ marginTop: 8, marginBottom: 12 }}>
          Emergency Contact{" "}
          <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
            (optional)
          </Text>
        </Typography.Title>

        <Form.Item label="Contact Name" name="emergencyName">
          <Input placeholder="Full name" />
        </Form.Item>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <Form.Item label="Contact Phone" name="emergencyPhone">
            <Input placeholder="Phone number" />
          </Form.Item>

          <Form.Item label="Relationship" name="emergencyRelationship">
            <Select placeholder="Select">
              {[
                "Spouse",
                "Parent",
                "Sibling",
                "Child",
                "Friend",
                "Guardian",
              ].map((r) => (
                <Select.Option key={r} value={r}>
                  {r}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </div>
      </Form>
    </Drawer>
  );
}
