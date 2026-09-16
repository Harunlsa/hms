import { Drawer, Tabs, Descriptions, Table, Tag, Space, Typography, Badge, Row, Col, Statistic } from "antd";
import { 
  MedicineBoxOutlined, 
  HistoryOutlined, 
  DatabaseOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { POSItem, POSBatch, InventoryMovement } from "../types/pos.types";

const { Text } = Typography;

interface ProductDetailDrawerProps {
  item: POSItem | null;
  movements: InventoryMovement[];
  visible: boolean;
  onClose: () => void;
  loading?: boolean;
  initialTab?: string;
}

export function ProductDetailDrawer({ item, movements, visible, onClose, loading, initialTab = "general" }: ProductDetailDrawerProps) {
  if (!item) return null;

  const batchColumns = [
    {
      title: "Batch #",
      dataIndex: "batchNumber",
      key: "batchNumber",
      render: (text: string) => <Text className="font-mono font-bold">{text}</Text>
    },
    {
      title: "Expiry",
      dataIndex: "expiryDate",
      key: "expiryDate",
      render: (date: string) => {
        const isExpiring = new Date(date).getTime() - new Date().getTime() < 1000 * 60 * 60 * 24 * 90;
        return <Text className={isExpiring ? "text-red-500 font-bold" : ""}>{new Date(date).toLocaleDateString()}</Text>;
      }
    },
    {
      title: "Cost",
      dataIndex: "purchaseCost",
      key: "purchaseCost",
      render: (cost: number) => `₦${cost.toLocaleString()}`
    },
    {
      title: "Stock",
      key: "stock",
      render: (record: POSBatch) => (
        <Space>
           <Text strong>{record.quantity.toLocaleString()}</Text>
           <Text type="secondary" className="text-[10px]">/ {record.initialQuantity.toLocaleString()}</Text>
        </Space>
      )
    }
  ];

  const movementColumns = [
    {
      title: "Date",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (ts: string) => new Date(ts).toLocaleString()
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => (
        <Tag color={type === 'in' ? 'success' : type === 'out' ? 'processing' : 'warning'} className="uppercase text-[10px] font-bold border-0 rounded-full px-3">
          {type}
        </Tag>
      )
    },
    {
      title: "Qty",
      dataIndex: "quantity",
      key: "quantity",
      render: (q: number, record: any) => (
        <Text strong className={record.type === 'in' ? 'text-emerald-600' : 'text-red-500'}>
          {record.type === 'in' ? '+' : '-'}{q.toLocaleString()}
        </Text>
      )
    },
    {
      title: "Reason",
      dataIndex: "reason",
      key: "reason"
    }
  ];

  return (
    <Drawer
      title={
        <Space>
          <MedicineBoxOutlined className="text-blue-600" />
          <div className="flex flex-col">
            <Text strong className="text-base leading-tight">{item.name}</Text>
            <Text type="secondary" className="text-[10px] font-mono uppercase">{item.code}</Text>
          </div>
        </Space>
      }
      width={720}
      onClose={onClose}
      open={visible}
      className="clinical-drawer"
      destroyOnClose
    >
      <Tabs defaultActiveKey={initialTab} className="h-full">
        <Tabs.TabPane 
          tab={<span><InfoCircleOutlined /> General</span>} 
          key="general"
        >
          <div className="space-y-8 py-4">
            <Descriptions title="Product Information" bordered column={2} size="small">
              <Descriptions.Item label="Category">{item.category}</Descriptions.Item>
              <Descriptions.Item label="Manufacturer">{item.manufacturer || "N/A"}</Descriptions.Item>
              <Descriptions.Item label="Selling Price">₦{item.sellingPrice.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Reorder Level">{item.reorderLevel || 0} units</Descriptions.Item>
              <Descriptions.Item label="Type" span={2}>
                 <Tag color="blue" className="uppercase font-black text-[10px] rounded-full px-3 border-0">{item.type.replace("_", " ")}</Tag>
              </Descriptions.Item>
            </Descriptions>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
               <Row gutter={24}>
                  <Col span={12}>
                     <Statistic 
                        title="Current Stock" 
                        value={item.stockQuantity || 0} 
                        suffix="units"
                        valueStyle={{ fontWeight: 900, color: (item.stockQuantity || 0) <= (item.reorderLevel || 0) ? '#faad14' : '#059669' }} 
                     />
                  </Col>
                  <Col span={12}>
                     <Statistic 
                        title="Asset Value (Cost)" 
                        value={item.batches?.reduce((sum, b) => sum + (b.purchaseCost * b.quantity), 0) || 0} 
                        prefix="₦"
                        valueStyle={{ fontWeight: 900, color: '#1e293b' }} 
                     />
                  </Col>
               </Row>
            </div>
          </div>
        </Tabs.TabPane>

        <Tabs.TabPane 
          tab={<span><DatabaseOutlined /> Batches <Badge count={item.batches?.length} size="small" offset={[10, 0]} /></span>} 
          key="batches"
        >
          <Table 
            dataSource={item.batches} 
            columns={batchColumns} 
            pagination={false} 
            size="small" 
            rowKey="id"
            className="mt-4 border border-gray-100 rounded-xl overflow-hidden"
          />
        </Tabs.TabPane>

        <Tabs.TabPane 
          tab={<span><HistoryOutlined /> Movements</span>} 
          key="movements"
        >
          <Table 
            dataSource={movements} 
            columns={movementColumns} 
            size="small" 
            rowKey="id"
            loading={loading}
            className="mt-4 border border-gray-100 rounded-xl overflow-hidden"
          />
        </Tabs.TabPane>
      </Tabs>
    </Drawer>
  );
}
