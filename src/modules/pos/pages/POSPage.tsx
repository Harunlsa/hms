import { useState } from "react";
import { Tabs, Typography } from "antd";
import {
  ShoppingCartOutlined,
  HistoryOutlined,
  AppstoreOutlined,
  SettingOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import { NewSaleTab } from "../components/NewSaleTab";
import { ProductCatalogueTab } from "../components/ProductCatalogueTab";
import { InventoryTab } from "../components/InventoryTab";

const { Title } = Typography;

export default function POSPage() {
  const [activeTab, setActiveTab] = useState("new-sale");

  const items = [
    {
      key: "new-sale",
      label: (
        <span className="flex items-center gap-2">
          <ShoppingCartOutlined />
          New Sale
        </span>
      ),
      children: <NewSaleTab />,
    },
    {
      key: "transactions",
      label: (
        <span className="flex items-center gap-2">
          <HistoryOutlined />
          Transactions
        </span>
      ),
      children: <div className="p-8">Transactions Content (Coming Soon)</div>,
    },
    {
      key: "inventory",
      label: (
        <span className="flex items-center gap-2">
          <AppstoreOutlined />
          Inventory
        </span>
      ),
      children: <InventoryTab />,
    },
    {
      key: "products",
      label: (
        <span className="flex items-center gap-2">
          <SettingOutlined />
          Catalogue
        </span>
      ),
      children: <ProductCatalogueTab />,
    },
    {
      key: "reports",
      label: (
        <span className="flex items-center gap-2">
          <BarChartOutlined />
          Reports
        </span>
      ),
      children: <div className="p-8">Reports Content (Coming Soon)</div>,
    },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50/50">
      <div className="flex-1 overflow-auto">
        <div className="min-h-full bg-white overflow-hidden">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={items}
            className="h-full clinical-tabs pos-tabs"
            destroyInactiveTabPane
          />
        </div>
      </div>

      <style>{`
        .pos-tabs .ant-tabs-nav {
          margin-bottom: 0 !important;
          padding: 0 24px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          z-index: 10;
        }
        .pos-tabs .ant-tabs-content-holder {
          height: 100%;
        }
        .pos-tabs .ant-tabs-tabpane {
          height: 100%;
        }
      `}</style>
    </div>
  );
}
