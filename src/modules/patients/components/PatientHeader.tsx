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
  return Math.floor(
    (Date.now() - new Date(iso).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
  );
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

  const avatarColor = patient.gender === "female" ? "#c084fc" : "#60a5fa";
  const initials = patient.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="bg-white rounded-lg px-6 py-5 mb-4 shadow-sm">
      <button
        type="button"
        onClick={() => navigate("/patients")}
        className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm mb-3 transition-colors"
      >
        <ArrowLeftOutlined />
        <span>All Patients</span>
      </button>

      <div className="flex items-center gap-4">
        <Avatar
          size={64}
          style={{ backgroundColor: avatarColor, fontSize: 22, flexShrink: 0 }}
          icon={!initials ? <UserOutlined /> : undefined}
        >
          {initials}
        </Avatar>

        <div className="flex-1 min-w-0">
          <Space align="center" size={8} wrap>
            <Title level={4} className="mb-0!">
              {patient.name}
            </Title>
            <Tag color={STATUS_COLOR[patient.status]}>
              {patient.status[0].toUpperCase() + patient.status.slice(1)}
            </Tag>
            {patient.fileType === "family" && (
              <Tag color="purple">Family File</Tag>
            )}
          </Space>

          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
            <Text type="secondary" className="text-sm">
              File #{patient.fileNumber}
            </Text>
            <Text type="secondary" className="text-sm">
              {patient.gender[0].toUpperCase() + patient.gender.slice(1)}
            </Text>
            {patient.dateOfBirth && (
              <Text type="secondary" className="text-sm">
                {formatDob(patient.dateOfBirth)} ·{" "}
                {calcAge(patient.dateOfBirth)} yrs
              </Text>
            )}
            {patient.phone && (
              <Text type="secondary" className="text-sm">
                {patient.phone}
              </Text>
            )}
          </div>
        </div>

        {/* Actions */}
        <Space>
          <Button icon={<EditOutlined />} onClick={onEditClick}>
            Edit
          </Button>
          <Dropdown
            menu={{
              items: statusMenuItems,
              onClick: ({ key }) => setStatus(patient.id, key as PatientStatus),
            }}
            trigger={["click"]}
            disabled={saving}
          >
            <Button icon={<MoreOutlined />} title="More actions" />
          </Dropdown>
        </Space>
      </div>
    </div>
  );
}
