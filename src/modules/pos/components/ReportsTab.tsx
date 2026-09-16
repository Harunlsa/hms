import { useMemo, useState } from "react";
import {
  Card,
  Typography,
  Row,
  Col,
  Table,
  Tag,
  Tabs,
  Statistic,
  Progress,
  Badge,
  Alert,
} from "antd";
import {
  BarChartOutlined,
  LineChartOutlined,
  MedicineBoxOutlined,
  DollarOutlined,
  UserOutlined,
  WarningOutlined,
  InteractionOutlined,
  ArrowUpOutlined,
} from "@ant-design/icons";
import { usePOSStore } from "../store/pos.store";

const { Title, Text } = Typography;

export function ReportsTab() {
  const { sales = [], items = [] } = usePOSStore();
  const [activeReportSubTab, setActiveReportSubTab] = useState("revenue");

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // --- MOCK & CALCULATED DATA ---

  // 1. REVENUE CALCULATIONS
  const totalRevenueVal = useMemo(() => {
    return sales.reduce((sum, s) => sum + s.total, 0);
  }, [sales]);

  const dailyRevenueData = useMemo(() => {
    // Group sales by day
    const dailyMap: Record<string, { total: number; count: number }> = {};
    sales.forEach((s) => {
      const dateStr = new Date(s.timestamp).toLocaleDateString(undefined, {
        dateStyle: "medium",
      });
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = { total: 0, count: 0 };
      }
      dailyMap[dateStr].total += s.total;
      dailyMap[dateStr].count += 1;
    });

    return Object.entries(dailyMap).map(([date, stats], index) => ({
      key: index,
      date,
      salesCount: stats.count,
      revenue: stats.total,
      growth: index % 2 === 0 ? "8.4%" : "12.1%",
    }));
  }, [sales]);

  const monthlyRevenueData = [
    {
      key: 1,
      month: "July 2026",
      salesCount: sales.length,
      revenue: totalRevenueVal,
      growth: "+14.2%",
    },
    {
      key: 2,
      month: "June 2026",
      salesCount: 42,
      revenue: 320000,
      growth: "+8.9%",
    },
    {
      key: 3,
      month: "May 2026",
      salesCount: 38,
      revenue: 290000,
      growth: "+11.5%",
    },
  ];

  const revenueByServiceData = useMemo(() => {
    const serviceMap: Record<string, number> = {
      medication: 0,
      laboratory_service: 0,
      consultation: 0,
      administrative_fee: 0,
      admission_fee: 0,
    };

    sales.forEach((s) => {
      s.items.forEach((line) => {
        const itemObj = items.find((i) => i.id === line.itemId);
        const itemType = itemObj?.type || "medication";
        if (serviceMap[itemType] !== undefined) {
          serviceMap[itemType] += line.total;
        } else {
          serviceMap["medication"] += line.total;
        }
      });
    });

    const totalServiceRev =
      Object.values(serviceMap).reduce((a, b) => a + b, 0) || 1;

    return Object.entries(serviceMap).map(([service, amount], idx) => ({
      key: idx,
      service: service.replace("_", " ").toUpperCase(),
      amount,
      percentage: Math.round((amount / totalServiceRev) * 100),
    }));
  }, [sales, items]);

  // 2. PHARMACY CALCULATIONS
  const topSellingMedications = useMemo(() => {
    const medSales: Record<
      string,
      { name: string; qty: number; revenue: number }
    > = {};
    sales.forEach((s) => {
      s.items.forEach((line) => {
        const itemObj = items.find((i) => i.id === line.itemId);
        if (itemObj?.type === "medication") {
          if (!medSales[line.itemId]) {
            medSales[line.itemId] = { name: line.name, qty: 0, revenue: 0 };
          }
          medSales[line.itemId].qty += line.quantity;
          medSales[line.itemId].revenue += line.total;
        }
      });
    });

    return Object.entries(medSales)
      .map(([id, info]) => ({ id, ...info }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [sales, items]);

  const slowMovingStock = useMemo(() => {
    // Items with low sales quantities
    const allMeds = items.filter((i) => i.type === "medication");
    const medSalesQty: Record<string, number> = {};
    sales.forEach((s) => {
      s.items.forEach((line) => {
        medSalesQty[line.itemId] =
          (medSalesQty[line.itemId] || 0) + line.quantity;
      });
    });

    return allMeds
      .map((med) => ({
        code: med.code,
        name: med.name,
        stockQuantity: med.stockQuantity || 0,
        soldQuantity: medSalesQty[med.id] || 0,
        reorderLevel: med.reorderLevel || 0,
      }))
      .sort((a, b) => a.soldQuantity - b.soldQuantity);
  }, [items, sales]);

  const expiringStock = useMemo(() => {
    const list: any[] = [];
    items.forEach((item) => {
      if (item.batches) {
        item.batches.forEach((b) => {
          const daysLeft = Math.ceil(
            (new Date(b.expiryDate).getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24),
          );
          if (daysLeft < 180) {
            list.push({
              key: b.id,
              code: item.code,
              name: item.name,
              batchNumber: b.batchNumber,
              expiryDate: b.expiryDate,
              quantity: b.quantity,
              daysLeft,
            });
          }
        });
      }
    });
    return list.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [items]);

  // 3. CASHIER CALCULATIONS
  const salesPerCashier = useMemo(() => {
    const cashierMap: Record<string, { total: number; count: number }> = {};
    sales.forEach((s) => {
      const name = s.processedBy?.name || "Unknown Cashier";
      if (!cashierMap[name]) {
        cashierMap[name] = { total: 0, count: 0 };
      }
      cashierMap[name].total += s.total;
      cashierMap[name].count += 1;
    });

    return Object.entries(cashierMap).map(([name, stats], idx) => ({
      key: idx,
      name,
      salesCount: stats.count,
      totalRevenue: stats.total,
    }));
  }, [sales]);

  const refundActivity = [
    {
      key: 1,
      date: "2026-07-27",
      patient: "Walk-in Patient",
      receiptId: "SALE-1002",
      item: "Amoxicillin 250mg",
      amount: 200,
      cashier: "Dr Hugh Mann",
      status: "Approved",
    },
    {
      key: 2,
      date: "2026-07-24",
      patient: "Fatima Yusuf",
      receiptId: "SALE-1003",
      item: "Full Blood Count (Void)",
      amount: 4500,
      cashier: "Nurse Joy",
      status: "Approved",
    },
  ];

  const voidActivity = [
    {
      key: 1,
      timestamp: "2026-07-27 11:20",
      receiptId: "SALE-1002",
      reason: "Patient changed mind",
      item: "Paracetamol 500mg",
      value: 50,
      cashier: "Dr Hugh Mann",
    },
    {
      key: 2,
      timestamp: "2026-07-26 15:10",
      receiptId: "SALE-1003",
      reason: "Duplicate item entry",
      item: "Specialist Consultation",
      value: 15000,
      cashier: "Nurse Joy",
    },
  ];

  const subTabs = [
    {
      key: "revenue",
      label: (
        <span className="flex items-center gap-2">
          <LineChartOutlined />
          Revenue Reports
        </span>
      ),
      children: (
        <div className="space-y-6">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card
                title="Daily Revenue Breakdown"
                className="shadow-sm border-gray-100"
              >
                <Table
                  dataSource={dailyRevenueData}
                  pagination={{ pageSize: 5 }}
                  size="small"
                  columns={[
                    { title: "Date", dataIndex: "date", key: "date" },
                    {
                      title: "Sales",
                      dataIndex: "salesCount",
                      key: "salesCount",
                      align: "center",
                    },
                    {
                      title: "Daily Revenue",
                      dataIndex: "revenue",
                      key: "revenue",
                      align: "right",
                      render: (r) => (
                        <span className="font-bold text-blue-600">
                          {formatCurrency(r)}
                        </span>
                      ),
                    },
                    {
                      title: "Trend",
                      dataIndex: "growth",
                      key: "growth",
                      align: "center",
                      render: (g) => (
                        <Tag color="green">
                          <ArrowUpOutlined /> {g}
                        </Tag>
                      ),
                    },
                  ]}
                />
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card
                title="Monthly Revenue Summary"
                className="shadow-sm border-gray-100"
              >
                <Table
                  dataSource={monthlyRevenueData}
                  pagination={false}
                  size="small"
                  columns={[
                    { title: "Month", dataIndex: "month", key: "month" },
                    {
                      title: "Total Sales",
                      dataIndex: "salesCount",
                      key: "salesCount",
                      align: "center",
                    },
                    {
                      title: "Monthly Revenue",
                      dataIndex: "revenue",
                      key: "revenue",
                      align: "right",
                      render: (r) => (
                        <span className="font-bold text-emerald-600">
                          {formatCurrency(r)}
                        </span>
                      ),
                    },
                    {
                      title: "Growth Rate",
                      dataIndex: "growth",
                      key: "growth",
                      align: "center",
                      render: (g) => <Tag color="emerald">{g}</Tag>,
                    },
                  ]}
                />
              </Card>
            </Col>
          </Row>

          <Card
            title="Revenue Distribution by Service Category"
            className="shadow-sm border-gray-100"
          >
            <Row gutter={[32, 16]} align="middle">
              <Col xs={24} md={10}>
                <Table
                  dataSource={revenueByServiceData}
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: "Service Type",
                      dataIndex: "service",
                      key: "service",
                    },
                    {
                      title: "Amount Generated",
                      dataIndex: "amount",
                      key: "amount",
                      align: "right",
                      render: (a) => (
                        <span className="font-semibold">
                          {formatCurrency(a)}
                        </span>
                      ),
                    },
                    {
                      title: "Share",
                      dataIndex: "percentage",
                      key: "percentage",
                      align: "center",
                      render: (p) => (
                        <Badge
                          count={`${p}%`}
                          style={{ backgroundColor: "#3b82f6" }}
                        />
                      ),
                    },
                  ]}
                />
              </Col>
              <Col xs={24} md={14} className="space-y-4">
                <Text
                  strong
                  className="block mb-2 text-gray-500 uppercase text-[10px] tracking-wider"
                >
                  Visual Share Breakdown
                </Text>
                {revenueByServiceData.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <Text strong>{item.service}</Text>
                      <Text type="secondary">
                        {item.percentage}% ({formatCurrency(item.amount)})
                      </Text>
                    </div>
                    <Progress
                      percent={item.percentage}
                      strokeColor={
                        idx === 0
                          ? "#3b82f6"
                          : idx === 1
                            ? "#a855f7"
                            : idx === 2
                              ? "#10b981"
                              : idx === 3
                                ? "#f97316"
                                : "#06b6d4"
                      }
                      status="active"
                    />
                  </div>
                ))}
              </Col>
            </Row>
          </Card>
        </div>
      ),
    },
    {
      key: "pharmacy",
      label: (
        <span className="flex items-center gap-2">
          <MedicineBoxOutlined />
          Pharmacy Reports
        </span>
      ),
      children: (
        <div className="space-y-6">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card
                title="🔥 Top-Selling Medications"
                className="shadow-sm border-gray-100"
              >
                <Table
                  dataSource={topSellingMedications}
                  pagination={false}
                  size="small"
                  columns={[
                    { title: "Medication", dataIndex: "name", key: "name" },
                    {
                      title: "Units Sold",
                      dataIndex: "qty",
                      key: "qty",
                      align: "center",
                      render: (q) => (
                        <Text strong className="text-orange-500">
                          {q} units
                        </Text>
                      ),
                    },
                    {
                      title: "Revenue",
                      dataIndex: "revenue",
                      key: "revenue",
                      align: "right",
                      render: (r) => (
                        <span className="font-bold text-emerald-600">
                          {formatCurrency(r)}
                        </span>
                      ),
                    },
                  ]}
                />
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card
                title="🐢 Slow-Moving Stock"
                className="shadow-sm border-gray-100"
              >
                <Table
                  dataSource={slowMovingStock}
                  pagination={{ pageSize: 5 }}
                  size="small"
                  columns={[
                    { title: "Medication", dataIndex: "name", key: "name" },
                    {
                      title: "Units Sold",
                      dataIndex: "soldQuantity",
                      key: "soldQuantity",
                      align: "center",
                      render: (s) => <Tag color="warning">{s} sold</Tag>,
                    },
                    {
                      title: "In Stock",
                      dataIndex: "stockQuantity",
                      key: "stockQuantity",
                      align: "center",
                    },
                  ]}
                />
              </Card>
            </Col>
          </Row>

          <Card
            title="⚠️ Expiring Stock Alert"
            className="shadow-sm border-gray-100 border-l-4 border-red-500"
          >
            {expiringStock.length > 0 ? (
              <Table
                dataSource={expiringStock}
                pagination={{ pageSize: 5 }}
                size="small"
                columns={[
                  {
                    title: "SKU",
                    dataIndex: "code",
                    key: "code",
                    render: (c) => (
                      <span className="font-mono text-xs">{c}</span>
                    ),
                  },
                  { title: "Medication Name", dataIndex: "name", key: "name" },
                  {
                    title: "Batch ID",
                    dataIndex: "batchNumber",
                    key: "batchNumber",
                  },
                  {
                    title: "Expiry Date",
                    dataIndex: "expiryDate",
                    key: "expiryDate",
                    render: (d) => <span className="font-bold">{d}</span>,
                  },
                  {
                    title: "Current Stock",
                    dataIndex: "quantity",
                    key: "quantity",
                    align: "center",
                  },
                  {
                    title: "Days Left",
                    dataIndex: "daysLeft",
                    key: "daysLeft",
                    align: "center",
                    render: (days) => (
                      <Tag
                        color={
                          days <= 30 ? "red" : days <= 90 ? "orange" : "gold"
                        }
                        className="font-bold"
                      >
                        {days} Days Left
                      </Tag>
                    ),
                  },
                ]}
              />
            ) : (
              <Alert
                message="All physical inventory items are safe. No stock is expiring soon (within 6 months)."
                type="success"
                showIcon
              />
            )}
          </Card>
        </div>
      ),
    },
    {
      key: "cashier",
      label: (
        <span className="flex items-center gap-2">
          <UserOutlined />
          Cashier Reports
        </span>
      ),
      children: (
        <div className="space-y-6">
          <Card title="Sales Per Cashier" className="shadow-sm border-gray-100">
            <Table
              dataSource={salesPerCashier}
              pagination={false}
              size="small"
              columns={[
                {
                  title: "Cashier Name",
                  dataIndex: "name",
                  key: "name",
                  render: (n) => (
                    <span className="font-bold text-gray-700">{n}</span>
                  ),
                },
                {
                  title: "Transactions Count",
                  dataIndex: "salesCount",
                  key: "salesCount",
                  align: "center",
                },
                {
                  title: "Total Volume",
                  dataIndex: "totalRevenue",
                  key: "totalRevenue",
                  align: "right",
                  render: (r) => (
                    <span className="font-bold text-emerald-600">
                      {formatCurrency(r)}
                    </span>
                  ),
                },
              ]}
            />
          </Card>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card
                title="↩️ Refund Activity Log"
                className="shadow-sm border-gray-100"
              >
                <Table
                  dataSource={refundActivity}
                  pagination={{ pageSize: 5 }}
                  size="small"
                  columns={[
                    { title: "Date", dataIndex: "date", key: "date" },
                    {
                      title: "Receipt",
                      dataIndex: "receiptId",
                      key: "receiptId",
                      render: (id) => (
                        <span className="font-mono text-xs">{id}</span>
                      ),
                    },
                    { title: "Item", dataIndex: "item", key: "item" },
                    {
                      title: "Refunded",
                      dataIndex: "amount",
                      key: "amount",
                      align: "right",
                      render: (a) => (
                        <span className="text-red-500 font-semibold">
                          -{formatCurrency(a)}
                        </span>
                      ),
                    },
                    { title: "Cashier", dataIndex: "cashier", key: "cashier" },
                  ]}
                />
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card
                title="🚫 Void Activity Log"
                className="shadow-sm border-gray-100"
              >
                <Table
                  dataSource={voidActivity}
                  pagination={{ pageSize: 5 }}
                  size="small"
                  columns={[
                    {
                      title: "Timestamp",
                      dataIndex: "timestamp",
                      key: "timestamp",
                    },
                    {
                      title: "Receipt",
                      dataIndex: "receiptId",
                      key: "receiptId",
                      render: (id) => (
                        <span className="font-mono text-xs">{id}</span>
                      ),
                    },
                    { title: "Item", dataIndex: "item", key: "item" },
                    { title: "Reason", dataIndex: "reason", key: "reason" },
                    {
                      title: "Value",
                      dataIndex: "value",
                      key: "value",
                      align: "right",
                      render: (v) => (
                        <span className="text-orange-500 font-semibold">
                          {formatCurrency(v)}
                        </span>
                      ),
                    },
                  ]}
                />
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 h-full flex flex-col gap-6 overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200">
        <div>
          <Title
            level={4}
            style={{ margin: 0 }}
            className="flex items-center gap-2"
          >
            <BarChartOutlined className="text-blue-500" />
            Clinical & Sales Reports Dashboard
          </Title>
          <Text type="secondary">
            Real-time analytical insights on clinic revenue, pharmacy stock
            turnover, and cashier activities.
          </Text>
        </div>
      </div>

      {/* Overview stats */}
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card size="small" className="shadow-sm border-gray-200">
            <Statistic
              title={
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                  Total Sales Revenue
                </span>
              }
              value={formatCurrency(totalRevenueVal)}
              prefix={<DollarOutlined className="text-blue-500" />}
              valueStyle={{ fontSize: "18px", fontWeight: 900 }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small" className="shadow-sm border-gray-200">
            <Statistic
              title={
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                  Total Sales Volume
                </span>
              }
              value={sales.length}
              suffix="completed sales"
              prefix={<InteractionOutlined className="text-emerald-500" />}
              valueStyle={{ fontSize: "18px", fontWeight: 900 }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small" className="shadow-sm border-gray-200">
            <Statistic
              title={
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                  Expiring Batches (6mo)
                </span>
              }
              value={expiringStock.length}
              prefix={<WarningOutlined className="text-red-500" />}
              valueStyle={{
                fontSize: "18px",
                fontWeight: 900,
                color: expiringStock.length > 0 ? "#ef4444" : "#10b981",
              }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small" className="shadow-sm border-gray-200">
            <Statistic
              title={
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                  Active Registered Cashiers
                </span>
              }
              value={salesPerCashier.length}
              prefix={<UserOutlined className="text-purple-500" />}
              valueStyle={{ fontSize: "18px", fontWeight: 900 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Tabbed Reports Section */}
      <Tabs
        activeKey={activeReportSubTab}
        onChange={setActiveReportSubTab}
        items={subTabs}
        className="reports-tabs"
      />
    </div>
  );
}
