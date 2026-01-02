import { Layout, Input, Badge, Dropdown, Avatar, MenuProps } from "antd";
import { BellOutlined, UserOutlined } from "@ant-design/icons";

import type { TopbarProps } from "./Topbar.types";

const { Header } = Layout;

export function Topbar({
  title,
  user,
  status = "online",
  showSearch = false,
  notificationCount = 0,
  onSearch,
  onNotificationsClick,
  onProfileClick,
  onLogout,
}: TopbarProps) {
  const userMenu: MenuProps = {
    items: [
      {
        key: "profile",
        label: "Profile",
        onClick: onProfileClick,
      },
      {
        type: "divider",
      },
      {
        key: "logout",
        label: "Logout",
        onClick: onLogout,
      },
    ],
  };

  return (
    <Header className="flex items-center justify-between bg-white px-6 shadow-sm">
      {/* Left */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold mb-0!">{title}</h1>
      </div>

      {/* Centre */}
      {showSearch && (
        <div className="min-w-2xs max-w-96  flex-1 px-6">
          <Input.Search
            placeholder="Search patients..."
            allowClear
            onSearch={onSearch}
          />
        </div>
      )}

      {/* Right */}
      <div className="flex items-center gap-4">
        {/* Status indicator */}
        <span
          className={`h-2 w-2 rounded-full ${
            status === "online"
              ? "bg-green-500"
              : status === "syncing"
              ? "bg-yellow-500"
              : "bg-red-500"
          }`}
          title={status}
        />

        {/* Notifications */}
        <Badge count={notificationCount} size="small">
          <BellOutlined
            className="text-lg cursor-pointer"
            onClick={onNotificationsClick}
          />
        </Badge>

        {/* User menu */}
        <Dropdown menu={userMenu} trigger={["click"]}>
          <div className="flex items-center gap-2 cursor-pointer">
            <Avatar icon={<UserOutlined />} size="small" />
            <span className="text-sm font-medium">{user.name}</span>
          </div>
        </Dropdown>
      </div>
    </Header>
  );
}
