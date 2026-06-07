import {
  SettingOutlined,
  FileTextOutlined,
  TeamOutlined,
  UserOutlined,
  HomeOutlined,
  ShoppingCartOutlined,
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
    key: "dashboard",
    label: "Dashboard",
    icon: HomeOutlined,
    path: "/",
  },
  {
    key: "patients",
    label: "Patients",
    icon: UserOutlined,
    path: "/patients",
  },
  {
    key: "pos",
    label: "Point of Sale",
    icon: ShoppingCartOutlined,
    path: "/pos",
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
