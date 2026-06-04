import { useState, useMemo } from "react";
import { Table, Typography, DatePicker, Select, Space, Card, Badge, Tooltip } from "antd";
import type { TableProps } from "antd";
import { AuditEntry } from "../types/patient.types";
import { 
  UserOutlined, 
  DesktopOutlined, 
  AppstoreOutlined, 
  CloudDownloadOutlined,
  HistoryOutlined,
  CalendarOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { StatusTag } from "@/shared/components/StatusTag";

const { Text } = Typography;
const { RangePicker } = DatePicker;

const ACTION_LABEL = {
  created: "Patient Registered",
  updated: "Record Updated",
  status_changed: "Status Modified",
} as const;

const SOURCE_ICON = {
  UI: <DesktopOutlined className="text-blue-500" />,
  system: <AppstoreOutlined className="text-gray-400" />,
  import: <CloudDownloadOutlined className="text-purple-500" />,
} as const;

interface Props {
  auditLog: AuditEntry[];
}

export function AuditTab({ auditLog }: Props) {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [userFilter, setUserFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const users = useMemo(() => {
    const uniqueUsers = new Set(auditLog.map(log => log.userName));
    return Array.from(uniqueUsers);
  }, [auditLog]);

  const filteredLogs = useMemo(() => {
    return auditLog.filter(log => {
      // Date filter
      if (dateRange && dateRange[0] && dateRange[1]) {
        const logDate = dayjs(log.timestamp);
        if (logDate.isBefore(dateRange[0], 'day') || logDate.isAfter(dateRange[1], 'day')) return false;
      }
      // User filter
      if (userFilter !== "all" && log.userName !== userFilter) return false;
      // Action filter
      if (actionFilter !== "all" && log.action !== actionFilter) return false;
      
      return true;
    }).sort((a, b) => dayjs(b.timestamp).valueOf() - dayjs(a.timestamp).valueOf());
  }, [auditLog, dateRange, userFilter, actionFilter]);

  const columns: TableProps<AuditEntry>["columns"] = [
    {
      title: "Timestamp",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 180,
      render: (iso: string) => (
        <div className="flex flex-col">
          <Text className="text-xs font-bold text-gray-700">{dayjs(iso).format('DD MMM YYYY')}</Text>
          <Text className="text-[10px] text-gray-400 font-mono uppercase tracking-tight">{dayjs(iso).format('hh:mm:ss A')}</Text>
        </div>
      ),
    },
    {
      title: "Action Event",
      dataIndex: "action",
      key: "action",
      width: 160,
      render: (action: AuditEntry["action"]) => (
        <div className="flex items-center gap-2">
          <StatusTag status={action === 'created' ? 'success' : action === 'updated' ? 'processing' : 'warning'} text={ACTION_LABEL[action]} />
        </div>
      ),
    },
    {
      title: "Personnel",
      dataIndex: "userName",
      key: "userName",
      width: 180,
      render: (name: string) => (
        <Space size={6}>
          <UserOutlined className="text-gray-300 text-xs" />
          <Text className="text-xs font-semibold text-gray-600">{name}</Text>
        </Space>
      ),
    },
    {
      title: "Source",
      dataIndex: "source",
      key: "source",
      width: 120,
      render: (source: AuditEntry["source"]) => (
        <Tooltip title={`Event captured via ${source || 'System Integration'}`}>
          <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-gray-50 border border-gray-100 w-fit cursor-help">
            {SOURCE_ICON[source || 'system']}
            <Text className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">{source || 'system'}</Text>
          </div>
        </Tooltip>
      ),
    },
    {
      title: "Entry ID",
      dataIndex: "id",
      key: "id",
      render: (id: string) => <Text className="font-mono text-[9px] text-gray-300 uppercase tracking-tighter">#{id.slice(0, 8)}</Text>,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Precision Filters */}
      <div className="bg-white border border-gray-100 p-4 rounded-xl flex flex-wrap items-end gap-6 shadow-sm">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 pl-1">
             <CalendarOutlined className="text-blue-500 text-[10px]" />
             <Text className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">Date Range</Text>
          </div>
          <RangePicker 
            size="small" 
            className="w-60 h-9 rounded-lg" 
            onChange={(dates) => setDateRange(dates as any)}
          />
        </div>
        
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 pl-1">
             <UserOutlined className="text-blue-500 text-[10px]" />
             <Text className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">Staff Filter</Text>
          </div>
          <Select 
            size="small" 
            className="w-44 h-9 rounded-lg" 
            value={userFilter} 
            onChange={setUserFilter}
          >
            <Select.Option value="all">All Personnel</Select.Option>
            {users.map(u => <Select.Option key={u} value={u}>{u}</Select.Option>)}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 pl-1">
             <HistoryOutlined className="text-blue-500 text-[10px]" />
             <Text className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">Operation</Text>
          </div>
          <Select 
            size="small" 
            className="w-40 h-9 rounded-lg" 
            value={actionFilter} 
            onChange={setActionFilter}
          >
            <Select.Option value="all">All Operations</Select.Option>
            <Select.Option value="created">Registration</Select.Option>
            <Select.Option value="updated">Modification</Select.Option>
            <Select.Option value="status_changed">Status Change</Select.Option>
          </Select>
        </div>

        <div className="ml-auto pb-2">
          <Badge status="processing" text={<Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Administrative View</Text>} />
        </div>
      </div>

      {/* Audit Data Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <Table<AuditEntry>
          columns={columns}
          dataSource={filteredLogs}
          rowKey="id"
          size="small"
          pagination={{ 
            pageSize: 15, 
            showTotal: (t) => <Text className="text-[10px] uppercase font-black text-gray-400 pl-4">System Log Persistence: {t} Events</Text> 
          }}
          expandable={{
            expandedRowRender: (record) => (
              <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 ml-12 mb-4 mr-4 shadow-inner">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100 shadow-sm">
                    <HistoryOutlined className="text-blue-600" />
                  </div>
                  <div>
                    <Text className="text-xs font-black uppercase tracking-widest block leading-none mb-1">Structural Delta Details</Text>
                    <Text className="text-[10px] text-gray-400 font-medium">Historical snapshot of data transition</Text>
                  </div>
                </div>
                
                {!record.changes || Object.keys(record.changes).length === 0 ? (
                  <div className="bg-white p-4 rounded-xl border border-gray-100 border-dashed text-center">
                    <Text type="secondary" italic className="text-xs">No attribute-level variance recorded for this registration event.</Text>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(record.changes).map(([field, { from, to }]) => (
                      <Card key={field} size="small" className="rounded-xl border-gray-200 shadow-none bg-white">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-50">
                           <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                           <Text className="text-[10px] font-black uppercase text-gray-800 tracking-wider">{field}</Text>
                        </div>
                        <div className="flex flex-col gap-3">
                          <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100 border-l-4 border-l-gray-300">
                            <Text className="text-[9px] uppercase font-bold text-gray-400 block mb-1">State Previous</Text>
                            <Text className="text-xs break-all font-mono">{from !== null && from !== undefined && String(from) !== "" ? String(from) : <Text italic className="text-gray-300 text-[10px]">NULL_VAL</Text>}</Text>
                          </div>
                          <div className="flex justify-center -my-1 text-gray-300">
                             <ArrowRightOutlined className="rotate-90 transform" />
                          </div>
                          <div className="p-2.5 bg-blue-50/30 rounded-lg border border-blue-100 border-l-4 border-l-blue-400">
                            <Text className="text-[9px] uppercase font-bold text-blue-400 block mb-1">State Current</Text>
                            <Text className="text-xs break-all font-mono font-bold text-blue-900">{String(to) !== "" ? String(to) : <Text italic className="text-blue-300 text-[10px]">EMPTY_VAL</Text>}</Text>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ),
            rowExpandable: (record) => !!record.changes && Object.keys(record.changes).length > 0
          }}
        />
      </div>
    </div>
  );
}
