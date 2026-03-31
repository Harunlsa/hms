import { Avatar, Button, Dropdown, Space, Tag, Typography } from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  MoreOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router";
import type { MenuProps } from "antd";
import { Patient, PatientStatus } from "../types/patient.types";
import { usePatientStore } from "../store/patient.store";

const { Title, Text } = Typography;

const STATUS_COLOR: Record<PatientStatus, string> = {
  active: "green",
  inactive: "orange",
  archived: "default",
};

function calcAge(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

function formatDob(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

interface Props {
  patient: Patient;
  onEditClick: () => void;
}

export function PatientHeader({ patient, onEditClick }: Props) {
  const navigate = useNavigate();
  const { setStatus, saving } = usePatientStore();

  const statusMenuItems: MenuProps["items"] = [
    {
      key: "active",
      label: "Set Active",
      disabled: patient.status === "active",
    },
    {
      key: "inactive",
      label: "Set Inactive",
      disabled: patient.status === "inactive",
    },
    {
      key: "archived",
      label: "Archive Patient",
      danger: true,
      disabled: patient.status === "archived",
    },
  ];

  const handleStatusChange: MenuProps["onClick"] = ({ key }) => {
    setStatus(patient.id, key as PatientStatus);
  };

  const avatarColor = patient.gender === "female" ? "#c084fc" : "#60a5fa";
  const initials = patient.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 8,
        padding: "20px 24px",
        marginBottom: 16,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      {/* Back link */}
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/patients")}
        style={{ padding: 0, marginBottom: 12, color: "#6b7280" }}
      >
        All Patients
      </Button>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* Avatar */}
        <Avatar
          size={64}
          style={{ backgroundColor: avatarColor, fontSize: 22, flexShrink: 0 }}
          icon={!initials ? <UserOutlined /> : undefined}
        >
          {initials}
        </Avatar>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Space align="center" size={8} wrap>
            <Title level={4} style={{ margin: 0 }}>
              {patient.name}
            </Title>
            <Tag color={STATUS_COLOR[patient.status]}>
              {patient.status[0].toUpperCase() + patient.status.slice(1)}
            </Tag>
          </Space>

          {/* <Space size={16} style={{ marginTop: 4, marginLeft: 16 }} wrap>
            <Text type="secondary">File #{patient.fileNumber}</Text>
            <Text type="secondary">
              {patient.gender[0].toUpperCase() + patient.gender.slice(1)}
            </Text>
            {patient.dateOfBirth && (
              <Text type="secondary">
                {formatDob(patient.dateOfBirth)} &middot;{" "}
                {calcAge(patient.dateOfBirth)} yrs
              </Text>
            )}
            {patient.phone && <Text type="secondary">{patient.phone}</Text>}
          </Space> */}
        </div>

        {/* Actions */}
        <Space>
          <Button icon={<EditOutlined />} onClick={onEditClick} />
          <Dropdown
            menu={{ items: statusMenuItems, onClick: handleStatusChange }}
            trigger={["click"]}
            disabled={saving}
          >
            <Button icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      </div>
    </div>
  );
}
