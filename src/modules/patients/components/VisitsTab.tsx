import { Button, Empty, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { Patient } from "../types/patient.types";

interface Props {
  patient: Patient;
}

export function VisitsTab({ patient: _patient }: Props) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 8,
        padding: 48,
        textAlign: "center",
      }}
    >
      <Empty
        description={
          <Typography.Text type="secondary">
            No visits recorded for this patient yet.
          </Typography.Text>
        }
      >
        <Button type="primary" icon={<PlusOutlined />} disabled>
          Record Visit
        </Button>
      </Empty>
    </div>
  );
}
