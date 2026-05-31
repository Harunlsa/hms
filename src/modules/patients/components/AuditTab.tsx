import { Table, Tag, Typography } from "antd";
import type { TableProps } from "antd";
import { AuditEntry } from "../types/patient.types";

const { Text } = Typography;

const ACTION_COLOR = {
  created: "green",
  updated: "blue",
  status_changed: "orange",
} as const;

const ACTION_LABEL = {
  created: "Registered",
  updated: "Updated",
  status_changed: "Status Changed",
} as const;

interface Props {
  auditLog: AuditEntry[];
}

export function AuditTab({ auditLog }: Props) {
  const columns: TableProps<AuditEntry>["columns"] = [
    {
      title: "Date & Time",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 180,
      render: (iso: string) =>
        new Date(iso).toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      width: 140,
      render: (action: AuditEntry["action"]) => (
        <Tag color={ACTION_COLOR[action]}>{ACTION_LABEL[action]}</Tag>
      ),
    },
    {
      title: "Performed By",
      dataIndex: "userName",
      key: "userName",
      width: 180,
    },
    {
      title: "Changes",
      key: "changes",
      render: (_: unknown, record: AuditEntry) => {
        if (!record.changes || Object.keys(record.changes).length === 0)
          return <Text type="secondary">—</Text>;

        return (
          <ul className="m-0 pl-4 text-xs">
            {Object.entries(record.changes).map(([field, { from, to }]) => (
              <li key={field} style={{ fontSize: 12 }}>
                <Text strong>{field}</Text>:{" "}
                <Text type="secondary">{String(from) || "(empty)"}</Text>
                {" → "}
                <Text>{String(to)}</Text>
              </li>
            ))}
          </ul>
        );
      },
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <Table<AuditEntry>
        columns={columns}
        dataSource={[...auditLog].reverse()}
        rowKey="id"
        size="small"
        pagination={{ pageSize: 20, showSizeChanger: false }}
        locale={{ emptyText: "No audit entries found." }}
      />
    </div>
  );
}
