import { Layout } from "antd";
import { AppSidebar } from "./components/AppSidebar";
import { Outlet } from "react-router";
import { Topbar } from "@/shared/components/topbar";

const { Content } = Layout;

export function MainLayout() {
  // TEMP — later comes from auth store
  const user = {
    id: "1",
    name: "Dr Hugh Mann",
    role: "doctor",
  };
  return (
    <Layout className="h-screen">
      <AppSidebar />
      <Layout>
        <Topbar title="Dashboard" user={user} showSearch />
        <Content className="p-lg">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
