export type AppStatus = "online" | "offline" | "syncing";

export interface TopbarUser {
  id: string;
  name: string;
  role: string;
}

export interface TopbarProps {
  title: string;
  titleBadge?: number;
  user: TopbarUser;
  status?: AppStatus;
  showSearch?: boolean;
  notificationCount?: number;

  onSearch?: (query: string) => void;
  onProfileClick?: () => void;
  onNotificationsClick?: () => void;
  onLogout?: () => void;
}
