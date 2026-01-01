import { SidebarItem, sidebarItems } from "@/shared/navigation/sidebar-items";
import { useUIStore } from "@/store/ui.store";
import { Layout, Menu } from "antd";
import type { MenuProps } from "antd";
import { useLocation, useNavigate } from "react-router";

const { Sider } = Layout;

export function AppSidebar() {
  const collapsed = useUIStore((state) => state.sidebarCollapsed);
  const toggle = useUIStore((state) => state.toggleSidebar);
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={toggle}
      width={240}
      className="bg-gray-900! text-white"
    >
      <div className="h-14 flex items-center justify-center text-white font-semibold">
        ACM HMS
      </div>

      <Menu
        mode="inline"
        items={mapItems(sidebarItems)}
        selectedKeys={[location.pathname]}
        onClick={({ key }) => navigate(key)}
      />
    </Sider>
  );
}

function mapItems(items: SidebarItem[]): MenuProps["items"] {
  return items.map((item) => ({
    key: item.path ?? item.key,
    icon: item.icon ? <item.icon /> : undefined,
    label: item.label,
    children: item.children ? mapItems(item.children) : undefined,
  }));
}
