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
import { EditOutlined, SaveOutlined, CloseOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { Patient } from "../types/patient.types";
import { usePatientStore } from "../store/patient.store";

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
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRelationship?: string;
}

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

  const openEdit = () => {
    form.setFieldsValue({
      name: patient.name,
      dateOfBirth: patient.dateOfBirth ? dayjs(patient.dateOfBirth) : undefined,
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email,
      address: patient.address,
      emergencyName: patient.emergencyContact?.name,
      emergencyPhone: patient.emergencyContact?.phone,
      emergencyRelationship: patient.emergencyContact?.relationship,
    });
    onEditOpen();
  };

  const handleSave = async (values: FormValues) => {
    try {
      await update(patient.id, {
        name: values.name.trim(),
        dateOfBirth: values.dateOfBirth?.format("YYYY-MM-DD"),
        gender: values.gender as Patient["gender"],
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
      });
      messageApi.success("Patient record updated");
      onEditClose();
    } catch {
      messageApi.error("Failed to update patient record");
    }
  };

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
          <Row gutter={16}>
            <Col span={24}>
              <Card
                title="Personal Information"
                extra={
                  <Space>
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
                  </Space>
                }
              >
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item
                      label="Full Name"
                      name="name"
                      rules={[{ required: true }]}
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Date of Birth"
                      name="dateOfBirth"
                      rules={[{ required: true }]}
                    >
                      <DatePicker
                        style={{ width: "100%" }}
                        format="DD/MM/YYYY"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Gender"
                      name="gender"
                      rules={[{ required: true }]}
                    >
                      <Select>
                        <Select.Option value="female">Female</Select.Option>
                        <Select.Option value="male">Male</Select.Option>
                        <Select.Option value="other">Other</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Phone"
                      name="phone"
                      rules={[{ required: true }]}
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Email" name="email">
                      <Input type="email" />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item label="Address" name="address">
                      <Input.TextArea rows={2} />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col span={24} style={{ marginTop: 16 }}>
              <Card title="Emergency Contact">
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item label="Contact Name" name="emergencyName">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Phone" name="emergencyPhone">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Relationship"
                      name="emergencyRelationship"
                    >
                      <Select allowClear>
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
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </Form>
      </>
    );
  }

  // ── Read-only view ───────────────────────────────────────────────────────────
  return (
    <>
      {contextHolder}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            title="Demographics"
            extra={
              <Button icon={<EditOutlined />} size="small" onClick={openEdit} />
            }
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Full Name">
                <Text strong>{patient.name}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Date of Birth">
                {(() => {
                  if (!patient.dateOfBirth) return "—";
                  const age = calcAge(patient.dateOfBirth);
                  return `${formatDob(patient.dateOfBirth)} (${age} ${
                    age === 1 ? "yr" : "yrs"
                  })`;
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="Gender">
                {patient.gender[0].toUpperCase() + patient.gender.slice(1)}
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                {patient.phone || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {patient.email?.toLowerCase() || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Address">
                {patient.address || "—"}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title="Emergency Contact">
            {patient.emergencyContact ? (
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Name">
                  {patient.emergencyContact.name || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Phone">
                  {patient.emergencyContact.phone || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Relationship">
                  {patient.emergencyContact.relationship || "—"}
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <Text type="secondary">No emergency contact on record.</Text>
            )}
          </Card>

          <Card title="Registration Info" style={{ marginTop: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="File Number">
                {patient.fileNumber}
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
          </Card>
        </Col>
      </Row>
    </>
  );
}
