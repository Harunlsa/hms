import { Result, Skeleton } from "antd";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { usePatientStore } from "../store/patient.store";
import { PatientHeader } from "../components/PatientHeader";
import { PatientTabs } from "../components/PatientTabs";

export default function PatientPage() {
  const { id } = useParams<{ id: string }>();
  const { selectedPatient, loading, fetchById, clearSelected } =
    usePatientStore();
  const [editingOverview, setEditingOverview] = useState(false);

  useEffect(() => {
    if (id) fetchById(id);
    return () => clearSelected();
  }, [id]);

  if (loading) {
    return <Skeleton active paragraph={{ rows: 8 }} />;
  }

  if (!selectedPatient) {
    return (
      <Result
        status="404"
        title="Patient Not Found"
        subTitle="The patient record you are looking for does not exist."
      />
    );
  }

  return (
    <div>
      <PatientHeader
        patient={selectedPatient}
        onEditClick={() => setEditingOverview(true)}
      />
      <PatientTabs
        patient={selectedPatient}
        editingOverview={editingOverview}
        onEditOpen={() => setEditingOverview(true)}
        onEditClose={() => setEditingOverview(false)}
      />
    </div>
  );
}
