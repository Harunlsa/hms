import { useState, useMemo } from "react";
import {
  Button,
  Typography,
  Space,
  Empty,
  Tooltip,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Select,
  Tag,
} from "antd";
import {
  PlusOutlined,
  MedicineBoxOutlined,
  ReloadOutlined,
  CloseCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { Patient } from "../types/patient.types";
import { Prescription } from "../types/prescription.types";
import { usePatientStore } from "../store/patient.store";
import { StatusTag } from "@/shared/components/StatusTag";
import { formatDate } from "@/shared/utils/date";

const { Text } = Typography;

interface Props {
  patient: Patient;
}

const DOCTOR_NAMES = [
  "Dr. Amina Abubakar",
  "Dr. Samuel Okoro",
  "Dr. Chioma Nnadi",
  "Dr. Ahmed Musa",
  "Dr. Sarah Williams",
];

export function PrescriptionsTab({ patient }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const { addPrescription, cancelPrescription, saving } = usePatientStore();
  const [messageApi, contextHolder] = message.useMessage();

  const prescriptionGroups = useMemo(() => {
    return (patient.visits || [])
      .filter((v) => v.prescriptions && v.prescriptions.length > 0)
      .map((v) => ({
        visitId: v.id,
        date: v.date,
        doctorName: v.doctorName,
        reason: v.reason,
        prescriptions: v.prescriptions,
      }))
      .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());
  }, [patient.visits]);

  const handleAddPrescription = async (values: any) => {
    try {
      await addPrescription(patient.id, {
        medicine: values.medicine,
        dosage: values.dosage,
        frequency: values.frequency,
        duration: values.duration,
        notes: values.notes,
        status: "active",
        issuedDate: new Date().toISOString(),
        prescribingDoctor: values.doctorName,
      });
      messageApi.success("Medication added to patient record");
      setIsModalOpen(false);
      form.resetFields();
    } catch (e) {
      messageApi.error("Failed to add prescription");
    }
  };

  const handleReissue = async (p: Prescription) => {
    try {
      await addPrescription(patient.id, {
        medicine: p.medicine,
        dosage: p.dosage,
        frequency: p.frequency,
        duration: p.duration,
        notes: `Reissued from ${formatDate(p.issuedDate, "DD/MM/YY")}. ${p.notes || ""}`,
        status: "active",
        issuedDate: new Date().toISOString(),
        prescribingDoctor: p.prescribingDoctor,
      });
      messageApi.success(`Reissued ${p.medicine} successfully`);
    } catch (e) {
      messageApi.error(`Failed to reissue ${p.medicine}`);
    }
  };

  const handleCancel = async (prescriptionId: string) => {
    try {
      await cancelPrescription(patient.id, prescriptionId);
      messageApi.success("Medication stopped/cancelled");
    } catch (e) {
      messageApi.error("Failed to cancel medication");
    }
  };

  const PrescriptionEntry = ({ p }: { p: Prescription }) => (
    <div className="bg-white border border-gray-100 rounded-xl p-4 mb-3 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <Text className="text-base font-black text-gray-900 block leading-tight truncate mr-2">{p.medicine}</Text>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <StatusTag status={p.status} className="h-fit" />
            <Text type="secondary" className="text-[11px] font-bold text-gray-400">{p.dosage} · {p.frequency} · {p.duration}</Text>
          </div>
        </div>
        <Space className="bg-gray-50/80 p-1 rounded-lg backdrop-blur-sm opacity-60 group-hover:opacity-100 transition-opacity">
          <Tooltip title="Reissue"><Button type="text" icon={<ReloadOutlined />} size="small" className="text-blue-600 hover:bg-blue-100/50" onClick={() => handleReissue(p)} /></Tooltip>
          {p.status === "active" && (
            <Popconfirm title="Stop Medication" description="Are you sure?" onConfirm={() => handleCancel(p.id)} okText="Yes" cancelText="No" okButtonProps={{ danger: true }}>
              <Tooltip title="Stop/Cancel"><Button type="text" danger icon={<CloseCircleOutlined />} size="small" className="hover:bg-red-50" /></Tooltip>
            </Popconfirm>
          )}
        </Space>
      </div>

      {p.notes && (
        <div className="mt-3 bg-gray-50/50 p-2.5 rounded-lg border-l-2 border-blue-200">
          <Text strong className="text-[9px] uppercase text-gray-400 block mb-1 tracking-widest">Instructions / Notes</Text>
          <Text className="text-[11px] text-gray-600 italic leading-relaxed">{p.notes}</Text>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-full overflow-x-hidden">
      {contextHolder}
      <div className="flex justify-end mb-6"><Button type="primary" icon={<PlusOutlined />} className="bg-blue-600 font-bold h-10 px-6 rounded-lg shadow-blue-100" onClick={() => setIsModalOpen(true)}>Add Prescription</Button></div>

      {prescriptionGroups.length === 0 ? (<div className="bg-white rounded-2xl p-20 text-center border-2 border-dashed border-gray-100 shadow-inner"><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<Text type="secondary" className="font-medium text-xs">No medications found</Text>} /></div>) : (
        <div className="space-y-12">
          {prescriptionGroups.map((group) => (
            <div key={group.visitId} className="relative pl-8 sm:pl-10">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-100 ml-[11px] sm:ml-[13px]" />
              <div className="absolute left-0 top-1 w-6 h-6 sm:w-7 sm:h-7 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-center -ml-0.5 sm:-ml-1 z-10"><MedicineBoxOutlined className="text-blue-500 text-xs sm:text-sm" /></div>

              <div className="mb-6">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <Text className="text-sm font-black text-gray-900 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">{formatDate(group.date)}</Text>
                  <Tag className="bg-white border-gray-200 text-gray-400 text-[10px] font-black uppercase px-2 m-0 tracking-tight">Encounter: {group.reason}</Tag>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase text-[9px] tracking-widest pl-1"><UserOutlined className="text-blue-300" /><span>By {group.doctorName}</span></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.prescriptions.map((p) => (<PrescriptionEntry key={p.id} p={p} />))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal title={<Text className="font-black uppercase tracking-widest text-gray-500 text-xs">Add Standalone Prescription</Text>} open={isModalOpen} onCancel={() => { setIsModalOpen(false); form.resetFields(); }} onOk={() => form.submit()} confirmLoading={saving} width={500} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleAddPrescription}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item label="Doctor" name="doctorName" rules={[{ required: true }]}><Select showSearch placeholder="Physician name" onSearch={(val) => { if(val) form.setFieldValue('doctorName', val) }} onChange={(val) => form.setFieldValue('doctorName', val)} filterOption={(input, option) => String(option?.value ?? '').toLowerCase().includes(input.toLowerCase())}>{DOCTOR_NAMES.map((name) => (<Select.Option key={name} value={name}>{name}</Select.Option>))}</Select></Form.Item>
            <Form.Item label="Medicine" name="medicine" rules={[{ required: true }]}><Input placeholder="e.g. Paracetamol" /></Form.Item>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Form.Item label="Dosage" name="dosage" rules={[{ required: true }]}><Input placeholder="e.g. 500mg" /></Form.Item>
            <Form.Item label="Frequency" name="frequency" rules={[{ required: true }]}><Input placeholder="e.g. 1x daily" /></Form.Item>
            <Form.Item label="Duration" name="duration" rules={[{ required: true }]}><Input placeholder="e.g. 5 days" /></Form.Item>
          </div>
          <Form.Item label="Instructions / Notes" name="notes"><Input.TextArea placeholder="Special instructions..." rows={3} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
