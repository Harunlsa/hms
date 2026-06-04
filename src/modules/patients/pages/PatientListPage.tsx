import { Button, Input, Table, Tag, Typography, message } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import type { TableProps } from "antd";
import { Patient } from "../types/patient.types";
import { usePatientStore } from "../store/patient.store";
import { RegisterPatientModal } from "../components/RegisterPatientModal";

const { Column } = Table;

function formatDob(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function PatientListPage() {
  const navigate = useNavigate();
  const { patients, loading, searchQuery, fetchAll, setSearchQuery } =
    usePatientStore();

  const [registerOpen, setRegisterOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  // Initial load
  useEffect(() => {
    fetchAll();
  }, []);

  // Re-fetch whenever search changes
  useEffect(() => {
    fetchAll();
  }, [searchQuery]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const rowProps = (record: Patient) => ({
    onClick: () => navigate(`/patients/${record.id}`),
    style: { cursor: "pointer" },
  });

  const tableProps: TableProps<Patient> = {
    dataSource: patients,
    rowKey: "id",
    loading,
    bordered: false,
    onRow: rowProps,
    pagination: {
      pageSize: 20,
      showSizeChanger: false,
      showTotal: (total) => `${total} patients`,
    },
    locale: {
      emptyText: searchQuery
        ? `No patients found for "${searchQuery}"`
        : "No patients registered yet",
    },
  };

  return (
    <>
      {contextHolder}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div></div>
      </div>

      {/* ── Filters ── */}
      <div className="flex gap-3 mb-4">
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search by name, file number, or phone…"
          allowClear
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full max-w-3xl shadow-sm h-10"
        />
        <div className="ml-auto">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            className="h-10 px-6 font-medium shadow-sm bg-blue-600"
            onClick={() => setRegisterOpen(true)}
          >
            Register Patient
          </Button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <Table<Patient> {...tableProps}>
          <Column
            title="File No."
            dataIndex="fileNumber"
            key="fileNumber"
            width={120}
            render={(fn: string, r: Patient) => (
              <div>
                <span className="font-mono text-sm font-semibold text-gray-700">
                  {fn}
                </span>
                {r.fileType === "family" && (
                  <Tag
                    color="purple"
                    className="ml-2 text-[10px] uppercase font-bold border-none px-2 rounded-full"
                  >
                    Family
                  </Tag>
                )}
              </div>
            )}
          />
          <Column
            title="Name"
            dataIndex="name"
            key="name"
            render={(name: string) => (
              <Typography.Text className="font-semibold text-gray-800">
                {name}
              </Typography.Text>
            )}
          />
          <Column
            title="Gender"
            dataIndex="gender"
            key="gender"
            width={100}
            render={(g: string) => (
              <span className="capitalize text-gray-500">{g}</span>
            )}
          />
          <Column
            title="Date of Birth"
            dataIndex="dateOfBirth"
            key="dateOfBirth"
            width={150}
            render={(dob: string) => (
              <span className="text-gray-600">{formatDob(dob)}</span>
            )}
          />
          <Column
            title="Phone"
            dataIndex="phone"
            key="phone"
            width={160}
            className="font-mono text-gray-500"
          />
          <Column
            title="Registered"
            dataIndex="createdAt"
            key="createdAt"
            width={140}
            render={(iso: string) => (
              <span className="text-gray-400 text-xs">
                {new Date(iso).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}
          />
        </Table>
      </div>

      <RegisterPatientModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSuccess={(patient) => {
          messageApi.success(
            `"${patient.name}" registered — File Number: ${patient.fileNumber}`,
          );
          navigate(`/patients/${patient.id}`);
        }}
      />
    </>
  );
}
