import { Layout } from "antd";
import { AppSidebar } from "./components/AppSidebar";
import { Outlet, useLocation, useMatches } from "react-router";
import { Topbar } from "@/shared/components/topbar";
import { RouteHandle } from "@/shared/router/route-handle";
import { useKeyboardShortcuts } from "@/shared/hooks/useKeyboardShortcuts";
import { usePatientStore } from "@/modules/patients/store/patient.store";
import { useEffect } from "react";

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

// Returns patient count badge on patients list page
function UsePatientBadge(): number | undefined {
  const location = useLocation();
  const patients = usePatientStore((s) => s.patients);
  const fetchAll = usePatientStore((s) => s.fetchAll);

  const isPatientList = location.pathname === "/patients";

  useEffect(() => {
    if (isPatientList) fetchAll();
  }, [isPatientList]);

  return isPatientList ? patients.length : undefined;
}

export function MainLayout() {
  const title = useRouteTitle();
  const titleBadge = UsePatientBadge();

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
        <Topbar
          title={title}
          titleBadge={titleBadge}
          user={user}
          showSearch={false}
        />
        <Content className="p-lg overflow-y-scroll">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
