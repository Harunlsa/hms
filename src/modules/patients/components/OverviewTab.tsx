import {
  Button,
  DatePicker,
  Form,
  Input,
  Select,
  Typography,
  message,
  Tag,
  Empty,
  Divider,
  Badge,
  Modal,
} from "antd";
import {
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  CalendarOutlined,
  MedicineBoxOutlined,
  AlertOutlined,
  HistoryOutlined,
  ArrowRightOutlined,
  UserOutlined,
  FileTextOutlined,
  TeamOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { EmergencyContact, Patient } from "../types/patient.types";
import { usePatientStore } from "../store/patient.store";
import { ClinicalCard } from "@/shared/components/ClinicalCard";
import { ValueGroup } from "@/shared/components/ValueGroup";
import { StatusTag } from "@/shared/components/StatusTag";
import { formatDate, fromNow, formatDob } from "@/shared/utils/date";

const { Text, Title } = Typography;

interface Props {
  patient: Patient;
  editMode: "none" | "info" | "all";
  allEditSaveTrigger: number;
  onEditClose: () => void;
  onEditOpen: () => void;
  onTabChange?: (key: string) => void;
  onAddVisit?: () => void;
  onScheduleAppointment?: () => void;
}

interface FormValues {
  name: string;
  dateOfBirth: dayjs.Dayjs;
  gender: string;
  phone: string;
  email?: string;
  address?: string;
  conditions: string[];
  allergies: string[];
  bloodGroup: string;
}

const RELATIONSHIPS = [
  "Spouse",
  "Parent",
  "Sibling",
  "Child",
  "Friend",
  "Guardian",
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export function OverviewTab({
  patient,
  editMode,
  allEditSaveTrigger,
  onEditClose,
  onEditOpen,
  onTabChange,
  onAddVisit,
  onScheduleAppointment,
}: Props) {
  const [form] = Form.useForm<FormValues>();
  const [medicalForm] = Form.useForm<any>();
  const { update, saving } = usePatientStore();
  const [messageApi, contextHolder] = message.useMessage();

  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [medicalModalOpen, setMedicalModalOpen] = useState(false);

  const lastVisit = (patient.visits || [])[0];
  const lastPrescription = (patient.visits || [])
    .flatMap((v) => v.prescriptions || [])
    .find(() => true);

  const isEditingInfo = editMode === "info" || editMode === "all";
  const isEditingMedical = editMode === "all";

  useEffect(() => {
    if (allEditSaveTrigger > 0 && editMode === "all") {
      form.submit();
    }
  }, [allEditSaveTrigger, editMode, form]);

  useEffect(() => {
    if (editMode !== "none") {
      form.setFieldsValue({
        name: patient.name,
        dateOfBirth: patient.dateOfBirth
          ? dayjs(patient.dateOfBirth)
          : undefined,
        gender: patient.gender,
        phone: patient.phone,
        email: patient.email ?? "",
        address: patient.address ?? "",
        conditions: patient.conditions || [],
        allergies: patient.allergies || [],
        bloodGroup: patient.bloodGroup || "",
      });
      setContacts((patient.emergencyContacts ?? []).map((c) => ({ ...c })));
    }
  }, [editMode, patient, form]);

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

  const handleSave = async (values: FormValues) => {
    try {
      const updateData: any = {
        name: values.name?.trim(),
        dateOfBirth: values.dateOfBirth?.format("YYYY-MM-DD"),
        gender: values.gender as Patient["gender"],
        phone: values.phone?.trim(),
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
      };

      if (isEditingMedical) {
        updateData.conditions = values.conditions;
        updateData.allergies = values.allergies;
        updateData.bloodGroup = values.bloodGroup;
      }

      await update(patient.id, updateData);
      messageApi.success("Patient record updated");
      onEditClose();
    } catch {
      messageApi.error("Failed to update patient record");
    }
  };

  const handleMedicalSave = async (values: any) => {
    try {
      await update(patient.id, {
        conditions: values.conditions,
        allergies: values.allergies,
        bloodGroup: values.bloodGroup,
      });
      messageApi.success("Medical summary updated");
      setMedicalModalOpen(false);
    } catch {
      messageApi.error("Failed to update medical summary");
    }
  };

  return (
    <>
      {contextHolder}
      <div className="flex flex-col gap-6 max-w-full overflow-x-hidden">
        {/* Quick Actions Bar */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 px-2">
            <Title level={5} className="!mb-0 text-blue-800 font-bold uppercase text-[10px] tracking-widest">
              Quick Actions
            </Title>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="primary" icon={<PlusOutlined />} className="bg-blue-600 shadow-sm text-xs h-8 px-3" onClick={() => onAddVisit?.()}>
              Add Visit
            </Button>
            <Button icon={<CalendarOutlined />} className="shadow-sm border-blue-100 text-blue-700 bg-white text-xs h-8 px-3" onClick={() => onScheduleAppointment?.()}>
              Schedule Appointment
            </Button>
            <Button icon={<MedicineBoxOutlined />} className="shadow-sm border-blue-100 text-blue-700 bg-white text-xs h-8 px-3" onClick={() => onTabChange?.('prescriptions')}>
              Add Prescription
            </Button>
          </div>
        </div>

        <Form form={form} layout="vertical" onFinish={handleSave} requiredMark={false}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Column */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              <ClinicalCard 
                title="Patient Information" 
                icon={<UserOutlined />}
                extra={editMode === "none" ? (
                  <Button type="text" icon={<EditOutlined />} size="small" className="text-blue-600 font-medium" onClick={onEditOpen}>Edit</Button>
                ) : editMode === "info" ? (
                  <div className="flex gap-2">
                    <Button size="small" onClick={onEditClose}>Cancel</Button>
                    <Button size="small" type="primary" className="bg-blue-600 font-bold" loading={saving} onClick={() => form.submit()}>Save</Button>
                  </div>
                ) : null}
              >
                <div className="flex flex-col gap-8">
                  {/* Personal Information */}
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 border-b border-gray-50 pb-2">
                      <UserOutlined className="text-blue-500 text-xs" />
                      <Text className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Personal Information</Text>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-4">
                      <ValueGroup label="Full Name" value={isEditingInfo ? (
                        <Form.Item name="name" className="mb-0" rules={[{ required: true }]}><Input variant="filled" className="font-bold" /></Form.Item>
                      ) : patient.name} valueClassName="text-base font-bold" />
                      
                      <ValueGroup label="Date of Birth" value={isEditingInfo ? (
                        <Form.Item name="dateOfBirth" className="mb-0" rules={[{ required: true }]}><DatePicker variant="filled" className="w-full" format="DD/MM/YYYY" /></Form.Item>
                      ) : formatDob(patient.dateOfBirth)} />

                      <ValueGroup label="Gender" value={isEditingInfo ? (
                        <Form.Item name="gender" className="mb-0" rules={[{ required: true }]}><Select variant="filled"><Select.Option value="male">Male</Select.Option><Select.Option value="female">Female</Select.Option></Select></Form.Item>
                      ) : <span className="capitalize">{patient.gender}</span>} />
                    </div>
                  </div>

                  {/* Contact Details */}
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 border-b border-gray-50 pb-2">
                      <PhoneOutlined className="text-blue-500 text-xs" />
                      <Text className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Contact Details</Text>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
                      <ValueGroup label="Phone Number" value={isEditingInfo ? (
                        <Form.Item name="phone" className="mb-0" rules={[{ required: true }]}><Input variant="filled" className="font-bold font-mono" /></Form.Item>
                      ) : patient.phone} valueClassName="font-mono text-blue-600 font-bold" />

                      <ValueGroup label="Email Address" value={isEditingInfo ? (
                        <Form.Item name="email" className="mb-0"><Input variant="filled" type="email" /></Form.Item>
                      ) : patient.email} valueClassName="underline decoration-gray-200" />

                      <ValueGroup className="sm:col-span-2" label="Residential Address" value={isEditingInfo ? (
                        <Form.Item name="address" className="mb-0"><Input.TextArea variant="filled" rows={2} /></Form.Item>
                      ) : patient.address} />
                    </div>
                  </div>
                </div>
              </ClinicalCard>

              {/* Key Medical Summary */}
              <ClinicalCard 
                title="Key Medical Summary" 
                icon={<MedicineBoxOutlined />}
                extra={
                  <div className="flex items-center gap-3">
                    <Badge count={patient.allergies?.length || 0} offset={[10, 0]} size="small"><AlertOutlined className="text-orange-500" /></Badge>
                    {!isEditingMedical && (
                      <><Divider type="vertical" /><Button type="text" icon={<EditOutlined />} size="small" className="text-blue-600 font-medium" onClick={() => { medicalForm.setFieldsValue({ conditions: patient.conditions || [], allergies: patient.allergies || [], bloodGroup: patient.bloodGroup || "" }); setMedicalModalOpen(true); }}>Modify</Button></>
                    )}
                  </div>
                }
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                  <div className="sm:col-span-2">
                    <Text type="secondary" className="text-[10px] uppercase font-bold block mb-3 text-gray-400">Allergies</Text>
                    {isEditingMedical ? (
                      <Form.Item name="allergies" className="mb-0"><Select mode="tags" placeholder="Add allergies..." className="w-full" status="error" tokenSeparators={[',']} open={false} suffixIcon={null} /></Form.Item>
                    ) : (
                      patient.allergies?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">{patient.allergies.map(a => <Tag key={a} color="error" className="rounded-full px-3 py-0.5 border-none shadow-sm font-bold text-[11px]">{a}</Tag>)}</div>
                      ) : <Text className="text-gray-400 italic font-medium">No known allergies</Text>
                    )}
                  </div>

                  <div>
                    <Text type="secondary" className="text-[10px] uppercase font-bold block mb-3 text-gray-400">Blood Group</Text>
                    {isEditingMedical ? (
                      <Form.Item name="bloodGroup" className="mb-0"><Select placeholder="Group" className="w-full" variant="filled">{BLOOD_GROUPS.map(bg => <Select.Option key={bg} value={bg}>{bg}</Select.Option>)}</Select></Form.Item>
                    ) : (
                      <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center border border-red-100 shadow-inner"><Text className="text-red-600 font-black text-xl">{patient.bloodGroup || "??"}</Text></div>
                    )}
                  </div>

                  <div className="sm:col-span-3">
                    <Divider className="my-2 border-gray-100" />
                    <Text type="secondary" className="text-[10px] uppercase font-bold block mt-2 mb-3 text-gray-400">Known Conditions</Text>
                    {isEditingMedical ? (
                      <Form.Item name="conditions" className="mb-0"><Select mode="tags" placeholder="Add conditions..." className="w-full" tokenSeparators={[',']} open={false} suffixIcon={null} /></Form.Item>
                    ) : (
                      patient.conditions?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">{patient.conditions.map(c => <Tag key={c} className="bg-gray-50 border-gray-200 text-gray-700 px-3 py-0.5 rounded-md font-medium text-[11px]">{c}</Tag>)}</div>
                      ) : <Text className="text-gray-400 italic font-medium">No chronic conditions recorded</Text>
                    )}
                  </div>
                </div>
              </ClinicalCard>

              {/* Recent Activity Snapshot */}
              <ClinicalCard title="Recent Activity Snapshot" icon={<HistoryOutlined />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all cursor-pointer group" onClick={() => onTabChange?.('visits')}>
                    <div className="flex items-center justify-between mb-2">
                      <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Last Visit</Text>
                      <ArrowRightOutlined className="text-gray-300 text-[10px] group-hover:translate-x-1 transition-transform" />
                    </div>
                    {lastVisit ? (
                      <div><div className="font-bold text-gray-800 text-base">{formatDate(lastVisit.date)}</div><div className="text-xs text-gray-500 line-clamp-1 mt-1 font-medium">{lastVisit.reason}</div></div>
                    ) : <Text className="text-gray-400 italic text-sm">No previous visits</Text>}
                  </div>

                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 hover:border-emerald-300 transition-all cursor-pointer group" onClick={() => onTabChange?.('appointments')}>
                    <div className="flex items-center justify-between mb-2">
                      <Text className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Next Appointment</Text>
                      <CalendarOutlined className="text-emerald-300 text-[10px] group-hover:scale-110 transition-transform" />
                    </div>
                    {patient.upcomingAppointment ? (
                      <div><div className="font-bold text-emerald-900 text-base">{formatDate(patient.upcomingAppointment)}</div><div className="text-xs text-emerald-700 font-medium mt-1">{dayjs(patient.upcomingAppointment).format("h:mm A")}</div></div>
                    ) : <Text className="text-emerald-400 italic text-sm font-medium">No pending appointments</Text>}
                  </div>

                  <div className="sm:col-span-2 bg-purple-50 rounded-xl p-4 border border-purple-100 hover:border-purple-300 transition-all cursor-pointer group" onClick={() => onTabChange?.('prescriptions')}>
                    <div className="flex items-center justify-between mb-2">
                      <Text className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Recent Prescription</Text>
                      <MedicineBoxOutlined className="text-purple-300 text-[10px] group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                    {lastPrescription ? (
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div><span className="font-bold text-purple-900 text-base">{lastPrescription.medicine}</span><span className="text-purple-700 text-xs ml-3 font-medium">{lastPrescription.dosage} · {lastPrescription.frequency}</span></div>
                        <Text className="text-[10px] text-purple-400 font-bold uppercase bg-white px-2 py-0.5 rounded shadow-sm">{fromNow(lastVisit?.date)}</Text>
                      </div>
                    ) : <Text className="text-purple-400 italic text-sm font-medium">No prescriptions on file</Text>}
                  </div>
                </div>
              </ClinicalCard>
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-6">
              <ClinicalCard title="File Information" icon={<FileTextOutlined />}>
                <div className="flex flex-col gap-5 text-sm text-gray-800">
                  <ValueGroup horizontal label="File #" value={`#${patient.fileNumber}`} valueClassName="font-mono text-gray-700 font-bold" />
                  <ValueGroup horizontal label="Type" value={<StatusTag status={patient.fileType === "family" ? "processing" : "default"} text={patient.fileType === "family" ? "Family File" : "Individual"} />} />
                  {patient.fileType === "family" && <ValueGroup horizontal label="Family Name" value={patient.familyFileName} valueClassName="font-bold text-gray-900" />}
                  <ValueGroup horizontal label="Registered" value={formatDate(patient.createdAt)} />
                  {patient.updatedAt && <ValueGroup horizontal label="Last Update" value={formatDate(patient.updatedAt)} />}
                </div>
              </ClinicalCard>

              <ClinicalCard 
                title="Emergency Contacts" 
                icon={<TeamOutlined />}
                extra={isEditingInfo && <Button type="text" icon={<PlusOutlined />} size="small" className="text-blue-600 p-0 h-auto font-bold uppercase text-[10px]" onClick={addContact}>Add</Button>}
              >
                {!isEditingInfo ? (
                  (patient.emergencyContacts ?? []).length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No contacts" /> : (
                    <div className="flex flex-col divide-y divide-gray-100">
                      {(patient.emergencyContacts ?? []).map(c => (
                        <div key={c.id} className="py-4 first:pt-0 last:pb-0 text-sm">
                          <div className="font-bold text-gray-900">{c.name}</div>
                          <div className="flex items-center gap-3 mt-2"><Tag className="text-[9px] uppercase font-black m-0 leading-none py-1 px-2 rounded-sm border-gray-200 bg-gray-100 text-gray-500">{c.relationship}</Tag><Text className="text-blue-600 font-medium text-xs font-mono">{c.phone}</Text></div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="flex flex-col gap-4">
                    {contacts.map(contact => (
                      <div key={contact.id} className="relative bg-gray-50 p-3 rounded-lg border border-gray-100 shadow-inner">
                        <Button type="text" icon={<DeleteOutlined />} danger size="small" className="absolute top-1 right-1 h-6 w-6 p-0" onClick={() => removeContact(contact.id)} />
                        <div className="space-y-2">
                          <Input size="small" placeholder="Name" variant="filled" value={contact.name} onChange={e => updateContact(contact.id, "name", e.target.value)} />
                          <Input size="small" placeholder="Phone" variant="filled" value={contact.phone} onChange={e => updateContact(contact.id, "phone", e.target.value)} />
                          <Select size="small" className="w-full" variant="filled" placeholder="Relationship" value={contact.relationship || undefined} onChange={v => updateContact(contact.id, "relationship", v)}>{RELATIONSHIPS.map(r => <Select.Option key={r} value={r}>{r}</Select.Option>)}</Select>
                        </div>
                      </div>
                    ))}
                    {contacts.length === 0 && <Text type="secondary" className="text-center block text-xs italic">No contacts added</Text>}
                  </div>
                )}
              </ClinicalCard>
            </div>
          </div>
        </Form>
      </div>

      <Modal title={<Text className="font-black uppercase tracking-widest text-gray-500 text-xs">Quick Edit Medical Summary</Text>} open={medicalModalOpen} onCancel={() => setMedicalModalOpen(false)} onOk={() => medicalForm.submit()} confirmLoading={saving} destroyOnClose>
        <Form form={medicalForm} layout="vertical" onFinish={handleMedicalSave}>
          <Form.Item label="Blood Group" name="bloodGroup"><Select placeholder="Select blood group">{BLOOD_GROUPS.map(bg => <Select.Option key={bg} value={bg}>{bg}</Select.Option>)}</Select></Form.Item>
          <Form.Item label="Known Conditions" name="conditions"><Select mode="tags" placeholder="Add conditions..." className="w-full" tokenSeparators={[',']} open={false} suffixIcon={null} /></Form.Item>
          <Form.Item label="Allergies" name="allergies"><Select mode="tags" placeholder="Add allergies..." className="w-full" status="error" tokenSeparators={[',']} open={false} suffixIcon={null} /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
