import { useState, useMemo, useEffect } from "react";
import {
  Button,
  Timeline,
  Card,
  Tag,
  Typography,
  Select,
  DatePicker,
  Empty,
  Divider,
  Collapse,
  Tooltip,
  Modal,
  Form,
  Input,
  message,
} from "antd";
import {
  PlusOutlined,
  PrinterOutlined,
  UserOutlined,
  DeleteOutlined,
  FileTextOutlined,
  MedicineBoxOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { Patient } from "../types/patient.types";
import { VisitType } from "../types/visit.types";
import { usePatientStore } from "../store/patient.store";
import { StatusTag } from "@/shared/components/StatusTag";
import { ValueGroup } from "@/shared/components/ValueGroup";
import { formatDate, formatTime } from "@/shared/utils/date";

const { RangePicker } = DatePicker;
const { Text, Paragraph } = Typography;

interface Props {
  patient: Patient;
  initialModalOpen?: boolean;
  onModalClose?: () => void;
}

const DOCTOR_NAMES = [
  "Dr. Amina Abubakar",
  "Dr. Samuel Okoro",
  "Dr. Chioma Nnadi",
  "Dr. Ahmed Musa",
  "Dr. Sarah Williams",
];

export function VisitsTab({ patient, initialModalOpen, onModalClose }: Props) {
  const [dateRange, setDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >(null);
  const [doctorFilter, setDoctorFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(initialModalOpen || false);

  const [form] = Form.useForm();
  const { addVisit, saving } = usePatientStore();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (initialModalOpen) setIsModalOpen(true);
  }, [initialModalOpen]);

  const handleCancel = () => {
    setIsModalOpen(false);
    onModalClose?.();
  };

  const doctors = useMemo(() => {
    const uniqueDoctors = new Set(
      (patient.visits || []).map((v) => v.doctorName),
    );
    return Array.from(uniqueDoctors);
  }, [patient.visits]);

  const filteredVisits = useMemo(() => {
    return (patient.visits || []).filter((visit) => {
      if (dateRange && dateRange[0] && dateRange[1]) {
        const visitDate = dayjs(visit.date);
        if (
          visitDate.isBefore(dateRange[0], "day") ||
          visitDate.isAfter(dateRange[1], "day")
        )
          return false;
      }
      if (doctorFilter !== "all" && visit.doctorName !== doctorFilter)
        return false;
      if (typeFilter !== "all" && visit.type !== typeFilter) return false;
      return true;
    });
  }, [patient.visits, dateRange, doctorFilter, typeFilter]);

  const handleRecordVisit = async (values: any) => {
    try {
      const visitData = {
        date: values.date.toISOString(),
        doctorName: values.doctorName,
        doctorId: crypto.randomUUID(),
        reason: values.reason,
        summary: values.summary,
        status: values.status,
        type: values.type,
        notes: values.notes,
        diagnosis: values.diagnosis,
        observations: values.observations,
        prescriptions: values.prescriptions || [],
      };

      await addVisit(patient.id, visitData);
      messageApi.success("Visit recorded successfully");
      setIsModalOpen(false);
      onModalClose?.();
      form.resetFields();
    } catch (error) {
      messageApi.error("Failed to record visit");
    }
  };

  const getTypeColor = (type: VisitType) => {
    switch (type) {
      case "emergency":
        return "volcano";
      case "consultation":
        return "blue";
      case "follow-up":
        return "green";
      case "routine-checkup":
        return "cyan";
      default:
        return "default";
    }
  };

  return (
    <div className="px-0 py-2">
      <style>{`
        @media (min-width: 640px) {
          .clinical-timeline .ant-timeline-item-label {
            width: 140px !important;
            flex-shrink: 0 !important;
            padding-inline-end: 24px !important;
          }
          .clinical-timeline .ant-timeline-item-tail,
          .clinical-timeline .ant-timeline-item-head {
            inset-inline-start: 140px !important;
          }
          .clinical-timeline .ant-timeline-item-content {
            inset-inline-start: 140px !important;
            width: calc(100% - 140px) !important;
            padding-inline-start: 24px !important;
          }
        }
      `}</style>
      {contextHolder}

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-4 sm:gap-8">
          <div className="flex flex-col gap-1">
            <Text
              type="secondary"
              className="text-[10px] font-black uppercase tracking-widest text-gray-400"
            >
              Date Range
            </Text>
            <RangePicker
              size="small"
              onChange={(dates) => setDateRange(dates as any)}
              className="w-full sm:w-60 h-9 rounded-lg"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Text
              type="secondary"
              className="text-[10px] font-black uppercase tracking-widest text-gray-400"
            >
              Physician
            </Text>
            <Select
              size="small"
              value={doctorFilter}
              onChange={setDoctorFilter}
              className="w-full sm:w-44 h-9 rounded-lg"
            >
              <Select.Option value="all">All Doctors</Select.Option>
              {doctors.map((doc) => (
                <Select.Option key={doc} value={doc}>
                  {doc}
                </Select.Option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Text
              type="secondary"
              className="text-[10px] font-black uppercase tracking-widest text-gray-400"
            >
              Encounter Type
            </Text>
            <Select
              size="small"
              value={typeFilter}
              onChange={setTypeFilter}
              className="w-full sm:w-36 h-9 rounded-lg"
            >
              <Select.Option value="all">All Types</Select.Option>
              <Select.Option value="consultation">Consultation</Select.Option>
              <Select.Option value="emergency">Emergency</Select.Option>
              <Select.Option value="follow-up">Follow-up</Select.Option>
              <Select.Option value="routine-checkup">
                Routine Checkup
              </Select.Option>
            </Select>
          </div>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          className="bg-blue-600 font-bold h-10 px-6 rounded-lg self-end shadow-blue-100"
          onClick={() => setIsModalOpen(true)}
        >
          Record Visit
        </Button>
      </div>

      {filteredVisits.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border-2 border-dashed border-gray-100 shadow-inner">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Text type="secondary" className="text-xs font-medium">
                No medical encounters found
              </Text>
            }
          />
        </div>
      ) : (
        <Timeline
          mode="left"
          titleSpan="140px"
          className="clinical-timeline pt-4"
          items={filteredVisits.map((visit) => ({
            label: (
              <div className="text-right hidden sm:block pt-1">
                <Text strong className="text-gray-900 text-sm">
                  {formatDate(visit.date)}
                </Text>
                <br />
                <Text
                  type="secondary"
                  className="text-[11px] font-bold text-blue-500 uppercase"
                >
                  {formatTime(visit.date)}
                </Text>
              </div>
            ),
            children: (
              <Card
                size="small"
                hoverable
                className="mb-8 shadow-sm border-gray-100 rounded-2xl overflow-hidden group"
                title={
                  <div className="flex flex-wrap justify-between items-center w-full gap-3 py-1.5 px-1">
                    <div className="flex items-center gap-3">
                      <div className="sm:hidden bg-blue-50 p-2 rounded-lg flex items-center justify-center shadow-inner">
                        <FileTextOutlined className="text-blue-500 text-sm" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Text
                          strong
                          className="text-gray-900 text-base leading-tight"
                        >
                          {visit.reason}
                        </Text>
                        <div className="flex items-center gap-2">
                          <Tag
                            color={getTypeColor(visit.type)}
                            className="rounded-full px-2 text-[8px] uppercase font-black m-0 border-none"
                          >
                            {visit.type.replace("-", " ")}
                          </Tag>
                          <StatusTag
                            status={visit.status}
                            className="text-[8px]"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden md:block text-[9px] text-gray-300 font-mono tracking-tighter">
                        #{visit.id.slice(0, 8)}
                      </div>
                      <Tooltip title="Print Summary">
                        <Button
                          type="text"
                          icon={<PrinterOutlined />}
                          size="small"
                          className="text-gray-400 group-hover:text-blue-500 transition-colors"
                        />
                      </Tooltip>
                    </div>
                  </div>
                }
              >
                <div className="px-1 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2 bg-gray-50/50 p-2 rounded-lg border border-gray-100/50 w-fit">
                      <UserOutlined className="text-blue-400 text-xs" />
                      <Text className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                        Seen by {visit.doctorName}
                      </Text>
                    </div>

                    {/* Mobile-only Date/Time Info */}
                    <div className="sm:hidden flex items-center gap-3 bg-blue-50/30 px-3 py-1.5 rounded-lg border border-blue-50/50 shadow-inner">
                      <div className="flex items-center gap-1.5">
                        <CalendarOutlined className="text-blue-400 text-[10px]" />
                        <Text className="text-[10px] font-bold text-blue-700">
                          {formatDate(visit.date)}
                        </Text>
                      </div>
                      <div className="w-px h-3 bg-blue-100" />
                      <div className="flex items-center gap-1.5">
                        <ClockCircleOutlined className="text-blue-400 text-[10px]" />
                        <Text className="text-[10px] font-bold text-blue-700">
                          {formatTime(visit.date)}
                        </Text>
                      </div>
                    </div>
                  </div>

                  <Paragraph className="text-sm text-gray-700 leading-relaxed font-medium mb-6 pl-3 border-l-4 border-blue-100 italic">
                    "{visit.summary}"
                  </Paragraph>

                  <Collapse
                    ghost
                    size="small"
                    className="bg-white rounded-xl border border-gray-100"
                    items={[
                      {
                        key: "details",
                        label: (
                          <div className="flex items-center gap-2">
                            <Text className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                              Encounter Details & Notes
                            </Text>
                          </div>
                        ),
                        children: (
                          <div className="space-y-8 pt-4 pb-2 px-1">
                            <ValueGroup
                              label="Clinical Narrative"
                              value={
                                <Text className="leading-loose text-gray-600 whitespace-pre-wrap">
                                  {visit.notes}
                                </Text>
                              }
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <ValueGroup
                                label="Diagnosis"
                                value={visit.diagnosis}
                                valueClassName="p-3 bg-gray-50/50 rounded-lg border border-gray-100 font-bold"
                              />
                              <ValueGroup
                                label="Observations"
                                value={visit.observations}
                                valueClassName="p-3 bg-gray-50/50 rounded-lg border border-gray-100"
                              />
                            </div>

                            {visit.prescriptions.length > 0 && (
                              <div className="bg-purple-50/30 p-5 rounded-2xl border border-purple-100 relative overflow-hidden">
                                <div className="absolute right-0 top-0 opacity-5 -mr-4 -mt-4 transform rotate-12">
                                  <MedicineBoxOutlined
                                    style={{ fontSize: "80px" }}
                                  />
                                </div>
                                <Text className="text-[10px] font-black text-purple-600 block mb-5 tracking-widest uppercase">
                                  Medications Issued
                                </Text>
                                <div className="space-y-3 relative z-10">
                                  {visit.prescriptions.map((p) => (
                                    <div
                                      key={p.id}
                                      className="flex justify-between items-center bg-white/80 p-3 rounded-xl border border-purple-50 shadow-sm"
                                    >
                                      <div className="flex flex-col">
                                        <Text className="text-sm font-black text-purple-900 leading-tight">
                                          {p.medicine}
                                        </Text>
                                        <Text className="text-[10px] text-purple-700 font-bold mt-0.5">
                                          {p.dosage} · {p.frequency}
                                        </Text>
                                      </div>
                                      <Tag className="bg-purple-600 border-none text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                                        {p.duration}
                                      </Tag>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ),
                      },
                    ]}
                  />
                </div>
              </Card>
            ),
          }))}
        />
      )}

      <Modal
        title={
          <Text className="font-black uppercase tracking-widest text-gray-500 text-xs">
            New Clinical Encounter
          </Text>
        }
        open={isModalOpen}
        onCancel={handleCancel}
        onOk={() => form.submit()}
        confirmLoading={saving}
        width={700}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleRecordVisit}
          initialValues={{
            date: dayjs(),
            status: "completed",
            type: "consultation",
          }}
          className="pt-2"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item
              label="Date & Time"
              name="date"
              rules={[{ required: true }]}
            >
              <DatePicker showTime className="w-full" variant="filled" />
            </Form.Item>
            <Form.Item
              label="Doctor"
              name="doctorName"
              rules={[{ required: true }]}
            >
              <Select
                showSearch
                placeholder="Physician"
                onSearch={(val) => {
                  if (val) form.setFieldValue("doctorName", val);
                }}
                onChange={(val) => form.setFieldValue("doctorName", val)}
                filterOption={(input, option) =>
                  String(option?.value ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                variant="filled"
              >
                {DOCTOR_NAMES.map((name) => (
                  <Select.Option key={name} value={name}>
                    {name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item label="Type" name="type" rules={[{ required: true }]}>
              <Select variant="filled">
                <Select.Option value="consultation">Consultation</Select.Option>
                <Select.Option value="emergency">Emergency</Select.Option>
                <Select.Option value="follow-up">Follow-up</Select.Option>
                <Select.Option value="routine-checkup">
                  Routine Checkup
                </Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="Status"
              name="status"
              rules={[{ required: true }]}
            >
              <Select variant="filled">
                <Select.Option value="completed">Completed</Select.Option>
                <Select.Option value="ongoing">Ongoing</Select.Option>
                <Select.Option value="cancelled">Cancelled</Select.Option>
              </Select>
            </Form.Item>
          </div>
          <Form.Item label="Reason" name="reason" rules={[{ required: true }]}>
            <Input placeholder="Reason for visit" variant="filled" />
          </Form.Item>
          <Form.Item
            label="Summary"
            name="summary"
            rules={[{ required: true }]}
          >
            <Input placeholder="One-line summary" variant="filled" />
          </Form.Item>
          <Form.Item label="Clinical Notes" name="notes">
            <Input.TextArea
              rows={4}
              placeholder="Narrative..."
              variant="filled"
            />
          </Form.Item>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item label="Diagnosis" name="diagnosis">
              <Input variant="filled" />
            </Form.Item>
            <Form.Item label="Observations" name="observations">
              <Input variant="filled" />
            </Form.Item>
          </div>
          <Divider titlePlacement="left">
            <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Prescriptions
            </Text>
          </Divider>
          <Form.List name="prescriptions">
            {(fields, { add, remove }) => (
              <>
                <div className="max-h-[300px] overflow-y-auto px-1">
                  {fields.map(({ key, name, ...restField }) => (
                    <div
                      key={key}
                      className="flex flex-wrap gap-2 mb-4 p-4 bg-gray-50 rounded-xl relative border border-gray-100 group"
                    >
                      <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        danger
                        size="small"
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => remove(name)}
                      />
                      <Form.Item
                        {...restField}
                        name={[name, "medicine"]}
                        className="mb-0 flex-1 min-w-[150px]"
                        rules={[{ required: true, message: "Req" }]}
                      >
                        <Input placeholder="Medicine" variant="filled" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, "dosage"]}
                        className="mb-0 w-24"
                      >
                        <Input placeholder="Dos" variant="filled" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, "frequency"]}
                        className="mb-0 w-32"
                      >
                        <Input placeholder="Freq" variant="filled" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, "duration"]}
                        className="mb-0 w-24"
                      >
                        <Input placeholder="Dur" variant="filled" />
                      </Form.Item>
                    </div>
                  ))}
                </div>
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                    className="h-10 rounded-xl font-bold"
                  >
                    Add Medication
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
}
