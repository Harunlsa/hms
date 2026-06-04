import { Button, Result } from "antd";
import { useNavigate, useRouteError, isRouteErrorResponse } from "react-router";
import { HomeOutlined, ReloadOutlined } from "@ant-design/icons";

export function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  let title = "Unexpected Error";
  let subTitle = "Something went wrong. Please try again later.";
  let status: "404" | "500" | "403" = "500";

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      status = "404";
      title = "404 - Page Not Found";
      subTitle = "The page you are looking for does not exist.";
    } else if (error.status === 403) {
      status = "403";
      title = "403 - Access Denied";
      subTitle = "You do not have permission to access this page.";
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <Result
        status={status}
        title={title}
        subTitle={subTitle}
        extra={[
          <Button 
            key="back" 
            type="primary" 
            icon={<HomeOutlined />} 
            onClick={() => navigate("/")}
            className="bg-blue-600"
          >
            Back to Dashboard
          </Button>,
          <Button 
            key="reload" 
            icon={<ReloadOutlined />} 
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>,
        ]}
      />
    </div>
  );
}
