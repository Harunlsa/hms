import { Result, Skeleton } from "antd";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { usePatientStore } from "../store/patient.store";
import { PatientHeader } from "../components/PatientHeader";
import { PatientTabs } from "../components/PatientTabs";

export default function PatientPage() {
  const { id } = useParams<{ id: string }>();
  const { selectedPatient, loading, fetchById, clearSelected, saving } =
    usePatientStore();
  const [editMode, setEditMode] = useState<"none" | "info" | "all">("none");
  const [allEditSaveTrigger, setAllEditSaveTrigger] = useState(0);

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
        editMode={editMode}
        onEditClick={() => setEditMode("all")}
        onCancelClick={() => setEditMode("none")}
        onSaveClick={() => setAllEditSaveTrigger((prev) => prev + 1)}
        saving={saving}
      />
      <PatientTabs
        patient={selectedPatient}
        editMode={editMode}
        allEditSaveTrigger={allEditSaveTrigger}
        onEditOpen={() => setEditMode("info")}
        onEditClose={() => setEditMode("none")}
      />
    </div>
  );
}
