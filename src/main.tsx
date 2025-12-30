import React from "react";
import ReactDOM from "react-dom/client";
import "antd/dist/reset.css";
import { ConfigProvider } from "antd";
import { getAntdTheme } from "@/styles/antd-theme";
import { RouterProvider } from "react-router";
import { router } from "./app/router";
// import { router } from "@/app/routes";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ConfigProvider theme={getAntdTheme()}>
      <RouterProvider router={router} />
    </ConfigProvider>
  </React.StrictMode>
);
