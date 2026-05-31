import {
  Button,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import type { TableProps } from "antd";
import { Patient, PatientStatus } from "../types/patient.types";
import { usePatientStore } from "../store/patient.store";
// import { RegisterPatientDrawer } from "../components/RegisterPatientDrawer";
import { RegisterPatientModal } from "../components/RegisterPatientModal";

const { Column } = Table;

const STATUS_COLOR: Record<PatientStatus, string> = {
  active: "green",
  inactive: "orange",
  archived: "default",
};

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
  const {
    patients,
    loading,
    searchQuery,
    statusFilter,
    fetchAll,
    setSearchQuery,
    setStatusFilter,
  } = usePatientStore();

  const [registerOpen, setRegisterOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  // Initial load
  useEffect(() => {
    fetchAll();
  }, []);

  // Re-fetch whenever search/filter changes
  useEffect(() => {
    fetchAll();
  }, [searchQuery, statusFilter]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const handleStatusFilter = (value: PatientStatus | "all") => {
    setStatusFilter(value);
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

      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        {/* <Typography.Title level={4} style={{ margin: 0 }}>
          Patients
          <Badge
            count={patients.length}
            showZero
            color="blue"
            style={{ marginLeft: 8 }}
          />
        </Typography.Title> */}
        <div></div>

        {/* <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setRegisterOpen(true)}
        >
          Register Patient
        </Button> */}
      </div>

      {/* ── Filters ── */}
      <div className="flex gap-3 mb-4">
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search by name, file number, or phone…"
          allowClear
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ maxWidth: 360 }}
        />
        <Select
          value={statusFilter}
          onChange={handleStatusFilter}
          style={{ width: 140 }}
          options={[
            { value: "all", label: "All" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
            { value: "archived", label: "Archived" },
          ]}
        />
        <div className="ml-auto">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setRegisterOpen(true)}
          >
            Register Patient
          </Button>
        </div>
      </div>

      {/* ── Table ── */}
      <Table<Patient> {...tableProps}>
        <Column
          title="File No."
          dataIndex="fileNumber"
          key="fileNumber"
          width={100}
          render={(fn: string, r: Patient) => (
            <div>
              <span className="font-mono text-sm">{fn}</span>
              {r.fileType === "family" && (
                <Tag color="purple" className="ml-1 text-xs">
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
            <Typography.Text strong>{name}</Typography.Text>
          )}
        />
        <Column
          title="Gender"
          dataIndex="gender"
          key="gender"
          width={90}
          render={(g: string) => g[0].toUpperCase() + g.slice(1)}
        />
        <Column
          title="Date of Birth"
          dataIndex="dateOfBirth"
          key="dateOfBirth"
          width={130}
          render={(dob: string) => (
            <Space size={4}>
              {formatDob(dob)}
              {/* {calcAge(dob) !== null && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  ({calcAge(dob)} yrs)
                </Typography.Text>
              )} */}
            </Space>
          )}
        />
        <Column title="Phone" dataIndex="phone" key="phone" width={150} />
        <Column
          title="Status"
          dataIndex="status"
          key="status"
          width={100}
          render={(status: PatientStatus) => (
            <Tag color={STATUS_COLOR[status]}>
              {status[0].toUpperCase() + status.slice(1)}
            </Tag>
          )}
        />
        <Column
          title="Registered"
          dataIndex="createdAt"
          key="createdAt"
          width={120}
          render={(iso: string) =>
            new Date(iso).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          }
        />
      </Table>

      {/* ── Register Drawer ── */}
      {/* <RegisterPatientDrawer
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSuccess={(patient) => {
          messageApi.success(
            `Patient "${patient.name}" registered successfully (File #${patient.fileNumber})`,
          );
          navigate(`/patients/${patient.id}`);
        }}
      /> */}

      <RegisterPatientModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSuccess={(patient) => {
          messageApi.success(
            `"${patient.name}" registered — File #${patient.fileNumber}`,
          );
          navigate(`/patients/${patient.id}`);
        }}
      />
    </>
  );
}
