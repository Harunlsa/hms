import { Tabs } from "antd";
import { useState } from "react";
import { Patient } from "../types/patient.types";
import { OverviewTab } from "./OverviewTab";
import { VisitsTab } from "./VisitsTab";
import { AppointmentsTab } from "./AppointmentsTab";
import { PrescriptionsTab } from "./PrescriptionsTab";
import { BillingTab } from "./BillingTab";
import { AuditTab } from "./AuditTab";

interface Props {
  patient: Patient;
  editMode: "none" | "info" | "all";
  allEditSaveTrigger: number;
  onEditOpen: () => void;
  onEditClose: () => void;
}

export function PatientTabs({
  patient,
  editMode,
  allEditSaveTrigger,
  onEditOpen,
  onEditClose,
}: Props) {
  const [activeKey, setActiveKey] = useState("overview");
  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);

  const handleTabChange = (key: string) => {
    setActiveKey(key);
    if (key !== "visits") setVisitModalOpen(false);
    if (key !== "appointments") setAppointmentModalOpen(false);
  };

  const handleAddVisit = () => {
    setVisitModalOpen(true);
    setActiveKey("visits");
  };

  const handleScheduleAppointment = () => {
    setAppointmentModalOpen(true);
    setActiveKey("appointments");
  };

  const items = [
    {
      key: "overview",
      label: "Overview",
      children: (
        <OverviewTab
          patient={patient}
          editMode={editMode}
          allEditSaveTrigger={allEditSaveTrigger}
          onEditOpen={onEditOpen}
          onEditClose={onEditClose}
          onTabChange={handleTabChange}
          onAddVisit={handleAddVisit}
          onScheduleAppointment={handleScheduleAppointment}
        />
      ),
    },
    {
      key: "visits",
      label: "Visits",
      children: (
        <VisitsTab 
          patient={patient} 
          initialModalOpen={visitModalOpen} 
          onModalClose={() => setVisitModalOpen(false)} 
        />
      ),
    },
    {
      key: "appointments",
      label: "Appointments",
      children: (
        <AppointmentsTab 
          patient={patient} 
          initialModalOpen={appointmentModalOpen}
          onModalClose={() => setAppointmentModalOpen(false)}
        />
      ),
    },
    {
      key: "prescriptions",
      label: "Prescriptions",
      children: <PrescriptionsTab patient={patient} />,
    },
    {
      key: "billing",
      label: "Billing",
      children: <BillingTab patient={patient} />,
    },
    {
      key: "audit",
      label: "Audit Log",
      children: <AuditTab auditLog={patient.auditLog} />,
    },
  ];

  return (
    <Tabs 
      activeKey={activeKey} 
      onChange={handleTabChange} 
      items={items} 
      destroyOnHidden={false} 
    />
  );
}
