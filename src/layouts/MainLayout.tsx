import { Layout } from "antd";
import { AppSidebar } from "./components/AppSidebar";
import { Outlet } from "react-router";

const { Content } = Layout;

export function MainLayout() {
  return (
    <Layout className="min-h-screen">
      <AppSidebar />
      <Layout>
        <Content className="p-lg">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
