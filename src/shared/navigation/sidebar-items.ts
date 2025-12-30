import {
  SettingOutlined,
  FileTextOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { ComponentType } from "react";
// import type { MenuProps } from "antd";

export interface SidebarItem {
  key: string;
  label: string;
  icon?: ComponentType;
  path?: string;
  children?: SidebarItem[];
}

export const sidebarItems: SidebarItem[] = [
  {
    key: "patients",
    label: "Patients",
    icon: UserOutlined,
    path: "/patients",
  },
  {
    key: "staff",
    label: "Staff",
    icon: TeamOutlined,
    path: "/staff",
  },
  {
    key: "records",
    label: "Records",
    icon: FileTextOutlined,
    // path: "/records",
    children: [
      {
        key: "lab",
        label: "Lab Results",
        path: "/records/labs",
      },
      {
        key: "radiology",
        label: "Radiology",
        path: "/records/radiology",
      },
    ],
  },
  {
    key: "settings",
    label: "Settings",
    icon: SettingOutlined,
    path: "/settings",
  },
];
