// import PatientPage from "@/modules/patients/pages/PatientPage";
import { RouteObject } from "react-router";
import { MainLayout } from "@/layouts/MainLayout";

// export const routes = [
//   {
//     path: '/patients/:id',
//     element: <PatienbtPage />,
//     title: 'Patient Profile',
//     roles: ['doctor', 'nurse'],
//   },
// ];

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <div>Dashboard</div>,
      },
      {
        path: "patients",
        element: <div>Patients</div>,
      },
      // {path: 'patients', element: <PatientPage/>}
      // {path: 'staff', element: <StaffPage />}
      // {path: 'records/labs', element: <LabsPage />}
      // {path: 'records/radiology', element: <RadiologyPage />}
    ],
  },
];
