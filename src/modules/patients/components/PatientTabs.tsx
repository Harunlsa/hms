import { Empty, Tabs, Typography } from "antd";
import { Patient } from "../types/patient.types";
import { OverviewTab } from "./OverviewTab";
import { VisitsTab } from "./VisitsTab";
import { AuditTab } from "./AuditTab";

interface Props {
  patient: Patient;
  editingOverview: boolean;
  onEditOpen: () => void;
  onEditClose: () => void;
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
      <Empty
        description={
          <Typography.Text type="secondary">
            {label} — coming soon
          </Typography.Text>
        }
      />
    </div>
  );
}

export function PatientTabs({
  patient,
  editingOverview,
  onEditOpen,
  onEditClose,
}: Props) {
  const items = [
    {
      key: "overview",
      label: "Overview",
      children: (
        <OverviewTab
          patient={patient}
          editing={editingOverview}
          onEditOpen={onEditOpen}
          onEditClose={onEditClose}
        />
      ),
    },
    {
      key: "visits",
      label: "Visits",
      children: <VisitsTab patient={patient} />,
    },
    {
      key: "appointments",
      label: "Appointments",
      children: <ComingSoon label="Appointments" />,
    },
    {
      key: "prescriptions",
      label: "Prescriptions",
      children: <ComingSoon label="Prescriptions" />,
    },
    {
      key: "billing",
      label: "Billing",
      children: <ComingSoon label="Billing" />,
    },
    {
      key: "audit",
      label: "Audit Log",
      children: <AuditTab auditLog={patient.auditLog} />,
    },
  ];

  return <Tabs items={items} destroyOnHidden={false} />;
}
