import { Layout } from "antd";
import { AppSidebar } from "./components/AppSidebar";
import { Outlet, useMatches } from "react-router";
import { Topbar } from "@/shared/components/topbar";
import { RouteHandle } from "@/shared/router/route-handle";
import { useKeyboardShortcuts } from "@/shared/hooks/useKeyboardShortcuts";

const { Content } = Layout;

function useRouteTitle() {
  const matches = useMatches();

  const lastMatch = matches
    .slice()
    .reverse()
    .find(
      (m): m is typeof m & { handle: RouteHandle } =>
        typeof m.handle === "object" &&
        m.handle !== null &&
        "title" in m.handle,
    );

  return lastMatch?.handle.title ?? "HMS";
}

export function MainLayout() {
  const title = useRouteTitle();
  useKeyboardShortcuts({
    onSearch: () => {
      console.log("Focus global search");
    },
  });

  // delete later
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
        <Topbar title={title} user={user} showSearch />
        <Content className="p-lg overflow-y-scroll">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
