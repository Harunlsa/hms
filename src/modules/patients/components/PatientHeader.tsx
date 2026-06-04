import { Avatar, Button, Space, Typography } from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  UserOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router";
import { Patient } from "../types/patient.types";

const { Title, Text } = Typography;

interface Props {
  patient: Patient;
  editMode: "none" | "info" | "all";
  onEditClick: () => void;
  onCancelClick: () => void;
  onSaveClick: () => void;
  saving?: boolean;
}

export function PatientHeader({
  patient,
  editMode,
  onEditClick,
  onCancelClick,
  onSaveClick,
  saving,
}: Props) {
  const navigate = useNavigate();

  const avatarColor = patient.gender === "female" ? "#c084fc" : "#60a5fa";
  const initials = patient.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const isFamily = patient.fileType === "family";
  const isEditingAll = editMode === "all";

  return (
    <div className="bg-white rounded-xl px-6 py-4 mb-4 shadow-sm border border-gray-100">
      <button
        type="button"
        onClick={() => navigate("/patients")}
        className="flex items-center gap-1 text-gray-400 hover:text-blue-500 text-xs mb-4 transition-colors group"
      >
        <ArrowLeftOutlined className="group-hover:-translate-x-0.5 transition-transform" />
        <span className="font-medium tracking-wide uppercase">
          All Patients
        </span>
      </button>

      <div className="flex items-center gap-5">
        <Avatar
          size={56}
          className="shadow-inner border-2 border-white"
          style={{ backgroundColor: avatarColor, fontSize: 20, flexShrink: 0 }}
          icon={!initials ? <UserOutlined /> : undefined}
        >
          {initials}
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <Title
              level={3}
              className="mb-0! !text-gray-900 !font-bold tracking-tight"
            >
              {patient.name}
            </Title>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-xs font-bold uppercase tracking-wider ${
                isFamily
                  ? "bg-purple-50 border-purple-100 text-purple-600"
                  : "bg-blue-50 border-blue-100 text-blue-600"
              }`}
            >
              {isFamily ? (
                <TeamOutlined className="text-sm" />
              ) : (
                <UserOutlined className="text-sm" />
              )}
              <span className="font-mono pt-0.5">{patient.fileNumber}</span>
            </div>
            <div className="h-4 w-1px bg-gray-200 mx-1" />
            <Text
              type="secondary"
              className="text-xs font-medium uppercase tracking-wide"
            >
              {isFamily ? "Family File" : "Individual File"}
            </Text>
          </div>
        </div>

        {/* Actions */}
        <Space size={12}>
          {!isEditingAll ? (
            <Button
              className="flex items-center justify-center border-gray-200 hover:border-blue-400 hover:text-blue-500 px-6 h-9 font-medium shadow-sm"
              icon={<EditOutlined />}
              onClick={onEditClick}
            >
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                onClick={onCancelClick}
                className="h-9 px-4 border-gray-200"
              >
                Cancel
              </Button>
              <Button
                type="primary"
                className="bg-blue-600 h-9 px-6 font-bold shadow-sm"
                loading={saving}
                onClick={onSaveClick}
              >
                Save Changes
              </Button>
            </div>
          )}
        </Space>
      </div>
    </div>
  );
}
