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
  Row,
  Col,
  Statistic,
  Drawer,
} from "antd";
import { 
  SearchOutlined, 
  AlertOutlined,
  ClockCircleOutlined,
  StopOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  DatabaseOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { usePOSStore } from "../store/pos.store";
import { POSItem } from "../types/pos.types";
import { ProductDetailDrawer } from "./ProductDetailDrawer";
import { ItemFormDrawer } from "./ItemFormDrawer";

const { Text, Title } = Typography;

export function InventoryTab() {
  const { 
    items = [], 
    fetchItems, 
    loadingItems,
    inventoryStats, 
    fetchInventoryStats, 
    loadingInventory,
    itemMovements = {}, 
    fetchItemMovements,
    allMovements,
    fetchAllMovements,
  } = usePOSStore();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<POSItem | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerTab, setDrawerTab] = useState("general");
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  const [globalMovementsVisible, setGlobalMovementsVisible] = useState(false);
  const [itemFormVisible, setItemFormVisible] = useState(false);
  const [formSelectedItem, setFormSelectedItem] = useState<POSItem | null>(null);

  useEffect(() => {
    fetchItems();
    fetchInventoryStats();
  }, []);

  const handleShowDetail = async (item: POSItem, tab: string = "general") => {
    setSelectedItem(item);
    setDrawerTab(tab);
    setDrawerVisible(true);
    setLoadingDetail(true);
    await fetchItemMovements(item.id);
    setLoadingDetail(false);
  };

  const handleShowGlobalMovements = async () => {
    setGlobalMovementsVisible(true);
    await fetchAllMovements();
  };

  const stockableItems = useMemo(() => {
    const list = Array.isArray(items) ? items : [];
    return list.filter(item => 
        item.stockQuantity !== undefined && 
        ((item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
         (item.code || "").toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [items, searchQuery]);

  const columns = [
    {
      title: "Product / Item",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: POSItem) => (
        <Space direction="vertical" size={0}>
          <Text strong className="text-blue-700">{name}</Text>
          <div className="flex gap-2 items-center">
             <Text type="secondary" className="text-[10px] font-mono">{record.code}</Text>
             <Tag className="!m-0 text-[8px] font-black uppercase border-0 rounded-full bg-gray-100 text-gray-500">
                {record.type.replace("_", " ")}
             </Tag>
          </div>
        </Space>
      ),
    },
    {
      title: "Manufacturer",
      dataIndex: "manufacturer",
      key: "manufacturer",
      render: (m?: string) => <Text className="text-xs">{m || "-"}</Text>,
    },
    {
      title: "Current Stock",
      dataIndex: "stockQuantity",
      key: "stockQuantity",
      render: (qty: number, record: POSItem) => {
          const isLow = record.reorderLevel !== undefined && qty <= record.reorderLevel;
          return (
            <Space direction="vertical" size={0}>
              <Text strong className={qty === 0 ? "text-red-500" : isLow ? "text-orange-500" : "text-emerald-600"}>
                {(qty || 0).toLocaleString()} units
              </Text>
              {isLow && qty > 0 && <Tag color="warning" className="text-[8px] font-black uppercase border-0 m-0">Low Stock</Tag>}
              {qty === 0 && <Tag color="error" className="text-[8px] font-black uppercase border-0 m-0">Out of Stock</Tag>}
            </Space>
          );
      }
    },
    {
      title: "Batches",
      dataIndex: "batches",
      key: "batches",
      render: (batches: any[]) => <Badge count={batches?.length || 0} color="#1677ff" />,
    },
    {
      title: "Next Expiry",
      key: "expiry",
      render: (record: POSItem) => {
          if (!record.batches || record.batches.length === 0) return "-";
          const soonest = [...record.batches].sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())[0];
          const isExpiring = new Date(soonest.expiryDate).getTime() - new Date().getTime() < 1000 * 60 * 60 * 24 * 90;
          return (
            <Text className={isExpiring ? "text-red-500 font-bold" : ""}>
               {new Date(soonest.expiryDate).toLocaleDateString()}
            </Text>
          );
      }
    },
    {
      title: "Actions",
      key: "action",
      align: "right" as const,
      render: (_: any, record: POSItem) => (
        <Space>
           <Button 
             size="small" 
             icon={<HistoryOutlined />} 
             title="Stock Movements" 
             onClick={() => handleShowDetail(record, "movements")} 
           />
           <Button 
             size="small" 
             type="primary" 
             ghost 
             icon={<InfoCircleOutlined />} 
             onClick={() => handleShowDetail(record, "general")}
           >
             Detail
           </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50/50 p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={4} className="!m-0 font-black uppercase tracking-tight">Inventory Dashboard</Title>
          <Text type="secondary" className="text-xs">Real-time stock tracking across all physical products</Text>
        </div>
        <Space>
          <Button 
            icon={<HistoryOutlined />} 
            className="rounded-xl font-bold border-blue-200 text-blue-600 hover:bg-blue-50"
            onClick={handleShowGlobalMovements}
          >
            Global Movements
          </Button>
          <Button 
            type="primary"
            icon={<PlusOutlined />}
            className="rounded-xl font-bold bg-blue-600"
            onClick={() => {
              setFormSelectedItem(null);
              setItemFormVisible(true);
            }}
          >
            Add New Item
          </Button>
        </Space>
      </div>

      {/* Stats Dashboard */}
      <Row gutter={16} className="mb-8">
        <Col span={6}>
          <Card className="rounded-2xl border-0 shadow-sm bg-blue-600 text-white overflow-hidden relative" styles={{ body: { padding: '20px' } }}>
            <DatabaseOutlined className="absolute -bottom-2 -right-2 text-6xl opacity-10" />
            <Statistic 
              title={<Text className="text-white opacity-80 font-bold uppercase text-[10px] tracking-wider">Total Products</Text>}
              value={inventoryStats?.totalProducts || 0}
              valueStyle={{ color: '#ffffff', fontWeight: 900 }}
              loading={loadingInventory}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="rounded-2xl border-0 shadow-sm bg-white overflow-hidden relative" styles={{ body: { padding: '20px' } }}>
            <AlertOutlined className="absolute -bottom-2 -right-2 text-6xl text-orange-500 opacity-10" />
            <Statistic 
              title={<Text className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Low Stock Items</Text>}
              value={inventoryStats?.lowStockItems || 0}
              valueStyle={{ color: '#faad14', fontWeight: 900 }}
              loading={loadingInventory}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="rounded-2xl border-0 shadow-sm bg-white overflow-hidden relative" styles={{ body: { padding: '20px' } }}>
            <ClockCircleOutlined className="absolute -bottom-2 -right-2 text-6xl text-red-500 opacity-10" />
            <Statistic 
              title={<Text className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Expiring Soon</Text>}
              value={inventoryStats?.expiringSoon || 0}
              valueStyle={{ color: '#ff4d4f', fontWeight: 900 }}
              loading={loadingInventory}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="rounded-2xl border-0 shadow-sm bg-white overflow-hidden relative border-l-4 border-red-500" styles={{ body: { padding: '20px' } }}>
            <StopOutlined className="absolute -bottom-2 -right-2 text-6xl text-red-900 opacity-10" />
            <Statistic 
              title={<Text className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Out of Stock</Text>}
              value={inventoryStats?.outOfStock || 0}
              valueStyle={{ color: '#7f1d1d', fontWeight: 900 }}
              loading={loadingInventory}
            />
          </Card>
        </Col>
      </Row>

      {/* Product List */}
      <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden mb-4" styles={{ body: { padding: '12px' } }}>
        <div className="flex gap-4">
          <Input 
            prefix={<SearchOutlined className="text-gray-400" />} 
            placeholder="Search inventory items..." 
            className="h-10 rounded-xl border-gray-200"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            allowClear
          />
        </div>
      </Card>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <Table 
          columns={columns} 
          dataSource={stockableItems} 
          loading={loadingItems}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          className="clinical-table"
        />
      </div>

      <ProductDetailDrawer 
        item={selectedItem}
        movements={selectedItem ? (itemMovements[selectedItem.id] || []) : []}
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        loading={loadingDetail}
        initialTab={drawerTab}
      />
      
      <ItemFormDrawer 
        visible={itemFormVisible}
        onClose={() => setItemFormVisible(false)}
        item={formSelectedItem}
      />

      <Drawer
        title="Global Stock Movements"
        placement="right"
        width={600}
        onClose={() => setGlobalMovementsVisible(false)}
        open={globalMovementsVisible}
      >
        <Table 
           dataSource={allMovements}
           rowKey="id"
           size="small"
           columns={[
              { title: 'Date', dataIndex: 'timestamp', render: (ts) => new Date(ts).toLocaleString() },
              { title: 'Type', dataIndex: 'type', render: (t) => <Tag color={t === 'in' ? 'success' : 'processing'}>{t.toUpperCase()}</Tag> },
              { title: 'Qty', dataIndex: 'quantity', render: (q, r) => <Text strong>{r.type === 'in' ? '+' : '-'}{q}</Text> },
              { title: 'Reason', dataIndex: 'reason' }
           ]}
        />
      </Drawer>

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
