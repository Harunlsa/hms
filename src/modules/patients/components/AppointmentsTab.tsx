import { useState, useMemo, useEffect } from "react";
import {
  Button,
  Card,
  Typography,
  Space,
  Empty,
  Badge,
  Tooltip,
  Collapse,
  Modal,
  Form,
  DatePicker,
  Select,
  Input,
  message,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  HistoryOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { Patient } from "../types/patient.types";
import { Appointment } from "../types/appointment.types";
import { usePatientStore } from "../store/patient.store";
import { StatusTag } from "@/shared/components/StatusTag";
import { ValueGroup } from "@/shared/components/ValueGroup";
import { formatDate, formatTime, isToday } from "@/shared/utils/date";

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

const APPOINTMENT_REASONS = [
  "Routine checkup",
  "Follow-up on hypertension",
  "Consultation with specialist",
  "Lab result review",
  "Vaccination",
  "Dental cleaning",
  "Annual physical",
];

export function AppointmentsTab({
  patient,
  initialModalOpen,
  onModalClose,
}: Props) {
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(
    initialModalOpen || false,
  );
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  const [form] = Form.useForm();
  const [rescheduleForm] = Form.useForm();
  const { addAppointment, updateAppointment, cancelAppointment, saving } =
    usePatientStore();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (initialModalOpen) setIsScheduleModalOpen(true);
  }, [initialModalOpen]);

  const handleCancelModal = () => {
    setIsScheduleModalOpen(false);
    onModalClose?.();
    form.resetFields();
  };

  const appointments = patient.appointments || [];

  const { upcoming, past } = useMemo(() => {
    const now = dayjs();
    const sorted = [...appointments].sort(
      (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf(),
    );

    return {
      upcoming: sorted.filter(
        (a) =>
          a.status !== "cancelled" &&
          (dayjs(a.date).isAfter(now) || dayjs(a.date).isSame(now, "day")),
      ),
      past: sorted
        .filter((a) => a.status === "cancelled" || dayjs(a.date).isBefore(now, "day"))
        .reverse(),
    };
  }, [appointments]);

  const handleSchedule = async (values: any) => {
    try {
      await addAppointment(patient.id, {
        date: values.date.toISOString(),
        doctorId: crypto.randomUUID(),
        doctorName: values.doctorName,
        reason: values.reason,
        status: "confirmed",
        location: values.location,
        notes: values.notes,
      });
      messageApi.success("Appointment scheduled successfully");
      setIsScheduleModalOpen(false);
      onModalClose?.();
      form.resetFields();
    } catch (e) {
      messageApi.error("Failed to schedule appointment");
    }
  };

  const handleReschedule = async (values: any) => {
    if (!selectedAppointment) return;
    try {
      await updateAppointment(patient.id, selectedAppointment.id, {
        date: values.date.toISOString(),
        doctorName: values.doctorName,
        reason: values.reason,
        location: values.location,
        notes: values.notes,
      });
      messageApi.success("Appointment rescheduled successfully");
      setIsRescheduleModalOpen(false);
      setSelectedAppointment(null);
      rescheduleForm.resetFields();
    } catch (e) {
      messageApi.error("Failed to reschedule appointment");
    }
  };

  const handleCancelAppointment = async (apptId: string) => {
    try {
      await cancelAppointment(patient.id, apptId);
      messageApi.success("Appointment cancelled");
    } catch (e) {
      messageApi.error("Failed to cancel appointment");
    }
  };

  const AppointmentCard = ({
    appt,
    isUpcoming,
  }: {
    appt: Appointment;
    isUpcoming: boolean;
  }) => {
    const today = isToday(appt.date);

    return (
      <Card
        size="small"
        className={`mb-4 border-l-4 shadow-sm hover:shadow-md transition-shadow ${
          today ? "border-l-blue-500 bg-blue-50/10" : "border-l-gray-200"
        } ${appt.status === "missed" ? "bg-orange-50 border-l-orange-400" : ""}`}
        title={
          <div className="flex flex-wrap justify-between items-center w-full py-1 gap-2">
            <Space wrap>
              {today && (
                <Badge
                  status="processing"
                  text={<Text strong className="text-blue-600 text-[10px] uppercase">TODAY</Text>}
                />
              )}
              <Text strong className="text-gray-800 text-sm">
                {formatDate(appt.date, "ddd, MMM DD, YYYY")}
              </Text>
              <StatusTag status={appt.status} />
            </Space>
            <Text type="secondary" className="text-[11px] font-medium">
              <ClockCircleOutlined className="mr-1" />
              {formatTime(appt.date)}
            </Text>
          </div>
        }
        extra={
          isUpcoming && appt.status !== "cancelled" && (
            <Space>
              <Tooltip title="Reschedule">
                <Button
                  type="text"
                  icon={<ReloadOutlined />}
                  size="small"
                  className="text-blue-500"
                  onClick={() => {
                    setSelectedAppointment(appt);
                    rescheduleForm.setFieldsValue({
                      date: dayjs(appt.date),
                      doctorName: appt.doctorName,
                      reason: appt.reason,
                      location: appt.location,
                      notes: appt.notes,
                    });
                    setIsRescheduleModalOpen(true);
                  }}
                />
              </Tooltip>
              <Popconfirm
                title="Cancel Appointment"
                description="Are you sure?"
                onConfirm={() => handleCancelAppointment(appt.id)}
                okText="Yes"
                cancelText="No"
                okButtonProps={{ danger: true }}
              >
                <Tooltip title="Cancel"><Button type="text" danger icon={<CloseCircleOutlined />} size="small" /></Tooltip>
              </Popconfirm>
            </Space>
          )
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-sm">
          <div className="space-y-3">
             <ValueGroup label="Reason" value={appt.reason} valueClassName="font-bold text-gray-800" />
             <ValueGroup label="Doctor" value={appt.doctorName} />
          </div>

          <div className="space-y-3 border-t md:border-t-0 md:border-l border-gray-50 pt-3 md:pt-0 md:pl-4">
            <ValueGroup label="Location" value={appt.location || "General Clinic"} />
            {appt.notes && (
              <div className="flex items-start gap-3">
                <HistoryOutlined className="text-gray-400 mt-1" />
                <Paragraph className="text-[11px] text-gray-500 italic mb-0 leading-snug">{appt.notes}</Paragraph>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const AppointmentFormFields = ({ formInstance }: { formInstance: any }) => (
    <>
      <Form.Item label="Date & Time" name="date" rules={[{ required: true }]}><DatePicker showTime={{ format: "h:mm A", use12Hours: true, minuteStep: 15, showSecond: false }} format="YYYY-MM-DD h:mm A" className="w-full" /></Form.Item>
      <Form.Item label="Doctor" name="doctorName" rules={[{ required: true }]}><Select showSearch placeholder="Select or type" onSearch={(val) => { if (val) formInstance.setFieldValue("doctorName", val); }} onChange={(val) => formInstance.setFieldValue("doctorName", val)} filterOption={(input, option) => String(option?.value ?? "").toLowerCase().includes(input.toLowerCase())}>{DOCTOR_NAMES.map((n) => (<Select.Option key={n} value={n}>{n}</Select.Option>))}</Select></Form.Item>
      <Form.Item label="Reason for Visit" name="reason" rules={[{ required: true }]}><Select showSearch placeholder="Select or type" onSearch={(val) => { if (val) formInstance.setFieldValue("reason", val); }} onChange={(val) => formInstance.setFieldValue("reason", val)} filterOption={(input, option) => String(option?.value ?? "").toLowerCase().includes(input.toLowerCase())}>{APPOINTMENT_REASONS.map((r) => (<Select.Option key={r} value={r}>{r}</Select.Option>))}</Select></Form.Item>
      <Form.Item label="Location" name="location"><Input placeholder="Clinic branch or room" /></Form.Item>
      <Form.Item label="Notes" name="notes"><Input.TextArea placeholder="Instructions..." rows={3} /></Form.Item>
    </>
  );

  return (
    <div className="px-0 py-2">
      {contextHolder}
      <div className="flex justify-end mb-6"><Button type="primary" icon={<PlusOutlined />} className="bg-blue-600 font-bold h-10 px-6 rounded-lg shadow-blue-100" onClick={() => setIsScheduleModalOpen(true)}>Schedule New</Button></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-50"><CalendarOutlined className="text-blue-500" /><Text className="font-black uppercase text-[10px] tracking-widest text-gray-500">Upcoming & Scheduled</Text></div>
          {upcoming.length === 0 ? (<div className="bg-gray-50 rounded-2xl p-16 text-center border-2 border-dashed border-gray-200 shadow-inner"><Empty description={<Text type="secondary" className="text-xs font-medium">No upcoming clinical appointments</Text>} /></div>) : (
            <div className="space-y-4">
              {upcoming.map(appt => <AppointmentCard key={appt.id} appt={appt} isUpcoming={true} />)}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-50"><HistoryOutlined className="text-gray-400" /><Text className="font-black uppercase text-[10px] tracking-widest text-gray-500">Interaction History</Text></div>
          <Collapse ghost expandIconPosition="end" className="appointment-history-collapse bg-gray-50/50 border border-gray-100 rounded-xl overflow-hidden" items={[{ key: "past", label: (<Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest">View records ({past.length})</Text>), children: (<div className="space-y-4 px-1 pb-2">{past.length === 0 ? (<div className="py-8 text-center"><Text type="secondary" italic className="text-xs">No records</Text></div>) : (past.map((appt) => (<AppointmentCard key={appt.id} appt={appt} isUpcoming={false} />)))}</div>), },]} />
        </div>
      </div>

      <Modal title={<Text className="font-black uppercase tracking-widest text-gray-500 text-xs">Schedule New Appointment</Text>} open={isScheduleModalOpen} onCancel={handleCancelModal} onOk={() => form.submit()} confirmLoading={saving} width={500} destroyOnClose><Form form={form} layout="vertical" onFinish={handleSchedule}><AppointmentFormFields formInstance={form} /></Form></Modal>
      <Modal title={<Text className="font-black uppercase tracking-widest text-gray-500 text-xs">Reschedule Appointment</Text>} open={isRescheduleModalOpen} onCancel={() => { setIsRescheduleModalOpen(false); setSelectedAppointment(null); rescheduleForm.resetFields(); }} onOk={() => rescheduleForm.submit()} confirmLoading={saving} width={500} destroyOnClose><Form form={rescheduleForm} layout="vertical" onFinish={handleReschedule}><AppointmentFormFields formInstance={rescheduleForm} /></Form></Modal>
    </div>
  );
}
