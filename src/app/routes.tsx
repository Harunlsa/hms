// import PatientPage from "@/modules/patients/pages/PatientPage";
import { RouteObject } from "react-router";
import { MainLayout } from "@/layouts/MainLayout";
import { ErrorPage } from "@/shared/components/ErrorPage";
import PatientListPage from "@/modules/patients/pages/PatientListPage";
import PatientPage from "@/modules/patients/pages/PatientPage";
import POSPage from "@/modules/pos/pages/POSPage";

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <div>Dashboard</div>,
        handle: { title: "Dashboard" },
      },
      {
        path: "/patients",
        element: <PatientListPage />,
        handle: { title: "Patients" },
      },
      {
        path: "/patients/:id",
        element: <PatientPage />,
        handle: { title: "Patient Profile" },
      },
      {
        path: "/pos",
        element: <POSPage />,
        handle: { title: "Point of Sale" },
      },
      // {path: 'patients', element: <PatientPage/>}
      // {path: 'staff', element: <StaffPage />}
      // {path: 'records/labs', element: <LabsPage />}
      // {path: 'records/radiology', element: <RadiologyPage />}
    ],
  },
];
