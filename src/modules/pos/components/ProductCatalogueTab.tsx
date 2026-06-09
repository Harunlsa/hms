import { useState, useEffect, useMemo } from "react";
import { 
  Table, 
  Input, 
  Tag, 
  Space, 
  Button, 
  Typography, 
  Card,
  Badge,
  Select,
} from "antd";
import { 
  SearchOutlined, 
  PlusOutlined,
  MedicineBoxOutlined,
  ExperimentOutlined,
  UserOutlined,
  FileProtectOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { usePOSStore } from "../store/pos.store";
import { POSItem } from "../types/pos.types";
import { ItemFormDrawer } from "./ItemFormDrawer";

const { Text, Title } = Typography;

const TYPE_ICONS: Record<string, any> = {
  medication: <MedicineBoxOutlined />,
  laboratory_service: <ExperimentOutlined />,
  consultation: <UserOutlined />,
  administrative_fee: <FileProtectOutlined />,
  admission_fee: <HomeOutlined />,
};

const TYPE_COLORS: Record<string, string> = {
  medication: "blue",
  laboratory_service: "purple",
  consultation: "emerald",
  administrative_fee: "orange",
  admission_fee: "cyan",
};

export function ProductCatalogueTab() {
  const { items = [], fetchItems, loadingItems } = usePOSStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeType, setActiveType] = useState<string>("all");
  
  const [formVisible, setFormVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<POSItem | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const handleEdit = (item: POSItem) => {
    setSelectedItem(item);
    setFormVisible(true);
  };

  const handleAddNew = () => {
    setSelectedItem(null);
    setFormVisible(true);
  };

  const filteredItems = useMemo(() => {
    const list = Array.isArray(items) ? items : [];
    return list.filter(item => {
      const name = item.name || "";
      const code = item.code || "";
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = activeType === "all" || item.type === activeType;
      return matchesSearch && matchesType;
    });
  }, [items, searchQuery, activeType]);

  const columns = [
    {
      title: "Identification",
      key: "id",
      render: (_: any, record: POSItem) => (
        <Space direction="vertical" size={0}>
          <Text className="font-mono font-bold text-blue-600">{record.code || "N/A"}</Text>
          {record.upc && <Text type="secondary" className="text-[10px] font-mono">UPC: {record.upc}</Text>}
        </Space>
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: POSItem) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          <Text type="secondary" className="text-[10px] uppercase">{record.category}</Text>
        </Space>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => {
        const displayType = type ? type.split("_").join(" ") : "unknown";
        return (
          <Tag 
            icon={TYPE_ICONS[type] || null} 
            color={TYPE_COLORS[type] || "default"} 
            className="rounded-full px-3 uppercase text-[10px] font-black border-0"
          >
            {displayType}
          </Tag>
        );
      },
    },
    {
      title: "Selling Price",
      dataIndex: "sellingPrice",
      key: "sellingPrice",
      align: "right" as const,
      render: (price: number) => <Text strong className="text-gray-900">₦{(price || 0).toLocaleString()}</Text>,
    },
    {
      title: "Status",
      dataIndex: "active",
      key: "active",
      render: (active: boolean) => (
        <Badge status={active ? "success" : "error"} text={active ? "Active" : "Inactive"} className="text-xs font-medium" />
      ),
    },
    {
      title: "Action",
      key: "action",
      align: "right" as const,
      render: (_: any, record: POSItem) => (
        <Button size="small" type="link" onClick={() => handleEdit(record)}>Edit</Button>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50/50 p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={4} className="!m-0 font-black uppercase tracking-tight">Catalogue</Title>
          <Text type="secondary" className="text-xs">Manage all billable items and services</Text>
        </div>
        <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            className="bg-blue-600 rounded-xl h-10 font-bold"
            onClick={handleAddNew}
        >
          Add New Item
        </Button>
      </div>

      <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden mb-6" styles={{ body: { padding: '12px' } }}>
        <div className="flex gap-4">
          <Input 
            prefix={<SearchOutlined className="text-gray-400" />} 
            placeholder="Search items, medicines, or services..." 
            className="h-10 rounded-xl border-gray-100"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            allowClear
          />
          <Select 
            placeholder="All Types" 
            className="w-48 h-10 rounded-xl"
            value={activeType}
            onChange={setActiveType}
            options={[
              { value: "all", label: "All Types" },
              { value: "medication", label: "Medication" },
              { value: "laboratory_service", label: "Laboratory" },
              { value: "consultation", label: "Consultation" },
              { value: "administrative_fee", label: "Admin Fee" },
              { value: "admission_fee", label: "Admission" },
            ]}
          />
        </div>
      </Card>

      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <Table 
          columns={columns} 
          dataSource={filteredItems} 
          loading={loadingItems}
          rowKey="id"
          pagination={{ pageSize: 10, position: ["bottomCenter"] }}
          className="clinical-table"
        />
      </div>

      <ItemFormDrawer 
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        item={selectedItem}
      />

      <style>{`
        .clinical-table .ant-table-thead > tr > th {
          background: #f9fafb;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.05em;
          font-weight: 900;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}
