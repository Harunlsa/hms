import { useState, useEffect, useMemo } from "react";
import {
  Table,
  Input,
  DatePicker,
  Select,
  Button,
  Card,
  Typography,
  Space,
  Row,
  Col,
  Tag,
  Empty,
  Divider,
} from "antd";
import {
  SearchOutlined,
  HistoryOutlined,
  UserOutlined,
  PrinterOutlined,
  DollarOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import { usePOSStore } from "../store/pos.store";
import { Sale } from "../types/pos.types";

const { Text, Title } = Typography;

export function TransactionsTab() {
  const { sales = [], fetchSales, loadingSales } = usePOSStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedCashier, setSelectedCashier] = useState<string>("all");
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

  useEffect(() => {
    fetchSales();
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Get unique cashiers for filter dropdown
  const cashiers = useMemo(() => {
    const names = new Set<string>();
    sales.forEach((s) => {
      if (s.processedBy?.name) {
        names.add(s.processedBy.name);
      }
    });
    return Array.from(names);
  }, [sales]);

  // Filter sales based on search criteria
  const filteredSales = useMemo(() => {
    let results = [...sales];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (s) =>
          s.id.toLowerCase().includes(q) ||
          (s.patientName && s.patientName.toLowerCase().includes(q)),
      );
    }

    if (selectedDate) {
      results = results.filter((s) => {
        const saleDate = new Date(s.timestamp).toDateString();
        const filterDate = new Date(selectedDate).toDateString();
        return saleDate === filterDate;
      });
    }

    if (selectedCashier && selectedCashier !== "all") {
      results = results.filter((s) => s.processedBy?.name === selectedCashier);
    }

    return results;
  }, [sales, searchQuery, selectedDate, selectedCashier]);

  // Find currently selected sale detail
  const selectedSale = useMemo(() => {
    return sales.find((s) => s.id === selectedSaleId) || null;
  }, [sales, selectedSaleId]);

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedDate(null);
    setSelectedCashier("all");
  };

  // Print receipt function
  const handlePrint = (sale: Sale) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const receiptHtml = `
      <html>
        <head>
          <title>Receipt ${sale.id}</title>
          <style>
            body {
              font-family: 'Courier New', Courier, monospace;
              padding: 20px;
              max-width: 300px;
              margin: 0 auto;
              font-size: 12px;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 4px 0; }
            .header { margin-bottom: 20px; }
            .footer { margin-top: 20px; font-size: 10px; }
          </style>
        </head>
        <body onload="window.print();window.close();">
          <div class="text-center header">
            <h2 style="margin: 0 0 5px 0;">HMS MEDICAL CLINIC</h2>
            <div>123 Healthcare Boulevard, Lagos</div>
            <div>Tel: +234 800 000 0000</div>
          </div>
          
          <div class="divider"></div>
          
          <div><strong>Receipt #:</strong> ${sale.id}</div>
          <div><strong>Date:</strong> ${new Date(sale.timestamp).toLocaleString()}</div>
          <div><strong>Cashier:</strong> ${sale.processedBy.name}</div>
          <div><strong>Patient:</strong> ${sale.patientName || "Walk-in"}</div>
          
          <div class="divider"></div>
          
          <table>
            <thead>
              <tr>
                <th align="left">Item</th>
                <th align="center">Qty</th>
                <th align="right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${sale.items
                .map(
                  (item) => `
                <tr>
                  <td>${item.name}</td>
                  <td align="center">${item.quantity}</td>
                  <td align="right">${item.total.toLocaleString("en-NG", { minimumFractionDigits: 0 })}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
          
          <div class="divider"></div>
          
          <table>
            <tr>
              <td>Subtotal:</td>
              <td align="right">${sale.subtotal.toLocaleString("en-NG", { minimumFractionDigits: 0 })}</td>
            </tr>
            ${
              sale.totalDiscount > 0
                ? `
              <tr>
                <td>Discount:</td>
                <td align="right">-${sale.totalDiscount.toLocaleString("en-NG", { minimumFractionDigits: 0 })}</td>
              </tr>
            `
                : ""
            }
            <tr class="bold">
              <td>Total:</td>
              <td align="right">${sale.total.toLocaleString("en-NG", { minimumFractionDigits: 0 })}</td>
            </tr>
          </table>
          
          <div class="divider"></div>
          
          <div class="bold">Payment Method(s):</div>
          ${sale.payments
            .map(
              (p) => `
            <div style="display: flex; justify-content: space-between;">
              <span style="text-transform: capitalize;">- ${p.method}:</span>
              <span>${p.amount.toLocaleString("en-NG", { minimumFractionDigits: 0 })}</span>
            </div>
          `,
            )
            .join("")}
          
          <div class="divider"></div>
          
          <div class="text-center footer">
            <div>Thank you for your visit!</div>
            <div>Get well soon.</div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  const columns = [
    {
      title: "Receipt ID",
      dataIndex: "id",
      key: "id",
      render: (id: string) => (
        <span className="font-mono font-bold text-blue-700">{id}</span>
      ),
    },
    {
      title: "Patient",
      dataIndex: "patientName",
      key: "patientName",
      render: (name?: string) => (
        <span className="font-medium">
          {name || <Text type="secondary">Walk-in Patient</Text>}
        </span>
      ),
    },
    {
      title: "Date & Time",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (ts: string) => (
        <span className="text-xs text-gray-500">
          {new Date(ts).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </span>
      ),
    },
    {
      title: "Cashier",
      dataIndex: ["processedBy", "name"],
      key: "cashier",
      render: (name: string) => (
        <Space size={4}>
          <UserOutlined className="text-gray-400 text-xs" />
          <span className="text-xs">{name}</span>
        </Space>
      ),
    },
    {
      title: "Total Amount",
      dataIndex: "total",
      key: "total",
      align: "right" as const,
      render: (total: number) => (
        <span className="font-bold text-emerald-600">
          {formatCurrency(total)}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6 h-full flex flex-col gap-6">
      {/* Header Info */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200">
        <div>
          <Title
            level={4}
            style={{ margin: 0 }}
            className="flex items-center gap-2"
          >
            <HistoryOutlined className="text-blue-500" />
            Transactions History
          </Title>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <Card size="small" className="shadow-sm border-gray-200">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Input
              placeholder="Search by receipt # or patient name..."
              prefix={<SearchOutlined className="text-gray-400" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={12} md={5}>
            <DatePicker
              placeholder="Filter by Date"
              style={{ width: "100%" }}
              onChange={(_date, dateStr) =>
                setSelectedDate(Array.isArray(dateStr) ? dateStr[0] : dateStr)
              }
              value={selectedDate ? null : undefined} // Workaround to clear or set date locally
            />
          </Col>
          <Col xs={12} md={5}>
            <Select
              style={{ width: "100%" }}
              placeholder="Filter by Cashier"
              value={selectedCashier}
              onChange={setSelectedCashier}
            >
              <Select.Option value="all">All Cashiers</Select.Option>
              {cashiers.map((c) => (
                <Select.Option key={c} value={c}>
                  {c}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} md={6} className="flex gap-2 justify-end">
            {(searchQuery || selectedDate || selectedCashier !== "all") && (
              <Button icon={<ClearOutlined />} onClick={handleResetFilters}>
                Clear
              </Button>
            )}
            {/*             <Button
              type="primary"
              onClick={() => fetchSales()}
              loading={loadingSales}
            >
              Refresh List
            </Button>
  */}{" "}
          </Col>
        </Row>
      </Card>

      {/* Main Split Layout */}
      <div className="flex-1 flex gap-6 overflow-hidden min-h-[400px] w-full">
        {/* Left Side: Sales Table */}
        <div className="w-[60%] bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden shrink-0">
          <Table
            dataSource={filteredSales}
            columns={columns}
            rowKey="id"
            loading={loadingSales}
            pagination={{ pageSize: 10 }}
            className="clinical-table border-0 flex-1 overflow-auto"
            rowClassName={(record) =>
              `cursor-pointer transition-colors hover:bg-blue-50/30 ${
                selectedSaleId === record.id
                  ? "bg-blue-50/50 hover:bg-blue-50"
                  : ""
              }`
            }
            onRow={(record) => ({
              onClick: () => setSelectedSaleId(record.id),
            })}
          />
        </div>

        {/* Right Side: Detailed Receipt View */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden min-w-[350px]">
          {selectedSale ? (
            <div className="h-full flex flex-col">
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <Text strong className="text-gray-700">
                  Transaction Details
                </Text>
                <Button
                  type="primary"
                  icon={<PrinterOutlined />}
                  onClick={() => handlePrint(selectedSale)}
                >
                  Print Receipt
                </Button>
              </div>

              <div className="w-full flex-1 overflow-y-auto p-6 font-sans bg-amber-50/10 flex justify-center items-start">
                {/* Simulated Receipt Styling */}
                <div className="w-[380px] shrink-0 bg-white p-6 border border-dashed border-gray-300 rounded shadow-md text-sm text-gray-800">
                  <div className="text-center mb-4">
                    <Title
                      level={5}
                      style={{ margin: 0, fontFamily: "inherit" }}
                      className="uppercase"
                    >
                      AMEER CLINICS & MATERNITY{" "}
                    </Title>
                    <Text className="text-[10px] text-gray-500">
                      Tudun Maliki Qtrs.
                    </Text>
                  </div>

                  <Divider className="border-dashed border-gray-300 my-2" />

                  <Row gutter={[0, 4]} className="mb-4">
                    <Col span={12}>
                      <Text type="secondary">Receipt #:</Text>
                    </Col>
                    <Col span={12} className="text-right">
                      <Text strong>{selectedSale.id}</Text>
                    </Col>

                    <Col span={12}>
                      <Text type="secondary">Patient:</Text>
                    </Col>
                    <Col span={12} className="text-right">
                      <Text>
                        {selectedSale.patientName || "Walk-in Patient"}
                      </Text>
                    </Col>

                    <Col span={12}>
                      <Text type="secondary">Cashier:</Text>
                    </Col>
                    <Col span={12} className="text-right">
                      <Text>{selectedSale.processedBy.name}</Text>
                    </Col>

                    <Col span={12}>
                      <Text type="secondary">Timestamp:</Text>
                    </Col>
                    <Col span={12} className="text-right">
                      <Text className="text-[10px]">
                        {new Date(selectedSale.timestamp).toLocaleString()}
                      </Text>
                    </Col>
                  </Row>

                  <Divider className="border-dashed border-gray-300 my-2" />

                  {/* Items List */}
                  <div className="mb-4">
                    <div className="flex justify-between font-bold mb-2">
                      <span>Item Name</span>
                      <span>Total</span>
                    </div>
                    {selectedSale.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between py-1 border-b border-gray-100 last:border-0"
                      >
                        <div className="flex flex-col">
                          <span>{item.name}</span>
                          <span className="text-[10px] text-gray-500">
                            {item.quantity} x {formatCurrency(item.unitPrice)}
                          </span>
                        </div>
                        <span className="font-medium align-self-center">
                          {formatCurrency(item.total)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Divider className="border-dashed border-gray-300 my-2" />

                  {/* Summary */}
                  <Row gutter={[0, 4]} className="mb-4">
                    <Col span={16}>
                      <Text>Subtotal:</Text>
                    </Col>
                    <Col span={8} className="text-right">
                      <Text>{formatCurrency(selectedSale.subtotal)}</Text>
                    </Col>

                    {selectedSale.totalDiscount > 0 && (
                      <>
                        <Col span={16}>
                          <Text className="text-red-500">Discount:</Text>
                        </Col>
                        <Col span={8} className="text-right text-red-500">
                          <Text className="text-red-500">
                            -{formatCurrency(selectedSale.totalDiscount)}
                          </Text>
                        </Col>
                      </>
                    )}

                    <Col span={16}>
                      <Text strong className="text-sm">
                        Total Paid:
                      </Text>
                    </Col>
                    <Col span={8} className="text-right">
                      <Text strong className="text-sm text-emerald-600">
                        {formatCurrency(selectedSale.total)}
                      </Text>
                    </Col>
                  </Row>

                  <Divider className="border-dashed border-gray-300 my-2" />

                  {/* Payment Breakdown */}
                  <div>
                    <Text
                      strong
                      className="block mb-2 text-gray-600 flex items-center gap-1"
                    >
                      <DollarOutlined /> Payment Method(s)
                    </Text>
                    {selectedSale.payments.map((p, idx) => (
                      <div key={idx} className="flex justify-between py-0.5">
                        <Tag
                          className="capitalize font-sans m-0"
                          color={
                            p.method === "cash"
                              ? "green"
                              : p.method === "card"
                                ? "blue"
                                : "purple"
                          }
                        >
                          {p.method}
                        </Tag>
                        <span>{formatCurrency(p.amount)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="text-center mt-6 text-[10px] text-gray-400">
                    <div>*** Thank you for your visit ***</div>
                    <div>Get well soon!</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col justify-center items-center p-8 bg-gray-50/50">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Space direction="vertical" size={4} className="text-center">
                    <Text strong className="text-gray-600">
                      No Transaction Selected
                    </Text>
                    <Text type="secondary" className="text-xs">
                      Click any transaction on the left to view details & print
                      receipt
                    </Text>
                  </Space>
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
