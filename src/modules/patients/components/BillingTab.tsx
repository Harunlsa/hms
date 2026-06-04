import { useState, useMemo } from "react";
import {
  Button,
  Card,
  Typography,
  Space,
  Empty,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Collapse,
  Divider,
} from "antd";
import {
  FileTextOutlined,
  DollarOutlined,
  HistoryOutlined,
  PlusOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { Patient } from "../types/patient.types";
import { PaymentMethod, Invoice } from "../types/billing.types";
import { usePatientStore } from "../store/patient.store";
import { StatusTag } from "@/shared/components/StatusTag";

const { Text, Title } = Typography;

interface Props {
  patient: Patient;
}

const PAYMENT_METHOD_ICON: Record<PaymentMethod, React.ReactNode> = {
  cash: <DollarOutlined />,
  transfer: <HistoryOutlined />,
  card: <InfoCircleOutlined />,
};

export function BillingTab({ patient }: Props) {
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | undefined>();

  const [invoiceForm] = Form.useForm();
  const [paymentForm] = Form.useForm();
  const { addInvoice, addPayment, saving } = usePatientStore();
  const [messageApi, contextHolder] = message.useMessage();

  const summary = useMemo(() => {
    const invoices = patient.invoices || [];
    const payments = patient.payments || [];
    const totalBilled = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const totalPaid = payments.reduce((sum, pay) => sum + (pay.amount || 0), 0);
    return {
      totalBilled,
      totalPaid,
      outstandingBalance: totalBilled - totalPaid,
    };
  }, [patient.invoices, patient.payments]);

  const selectedInvoiceRemaining = useMemo(() => {
    if (!selectedInvoiceId) return 0;
    const inv = (patient.invoices || []).find(i => i.id === selectedInvoiceId);
    if (!inv) return 0;
    return (inv.amount || 0) - (inv.paidAmount || 0);
  }, [selectedInvoiceId, patient.invoices]);

  const handleCreateInvoice = async (values: any) => {
    try {
      const items = (values.items || []).map((item: any) => ({
        id: crypto.randomUUID(),
        description: item.description,
        amount: item.amount || 0,
      }));
      const totalAmount = items.reduce((sum: number, item: any) => sum + item.amount, 0);

      await addInvoice(patient.id, {
        date: new Date().toISOString(),
        items,
        amount: totalAmount,
        paidAmount: 0,
        status: "pending",
      });
      messageApi.success("Invoice created successfully");
      setIsInvoiceModalOpen(false);
      invoiceForm.resetFields();
    } catch (e) {
      messageApi.error("Failed to create invoice");
    }
  };

  const handleRecordPayment = async (values: any) => {
    try {
      const remaining = selectedInvoiceRemaining;
      if (values.amount > remaining) {
        messageApi.error(`Payment exceeds balance of ₦${remaining.toLocaleString()}`);
        return;
      }

      await addPayment(patient.id, {
        invoiceId: values.invoiceId,
        date: new Date().toISOString(),
        amount: values.amount,
        method: values.method,
        reference: values.reference,
      });
      messageApi.success("Payment recorded successfully");
      setIsPaymentModalOpen(false);
      paymentForm.resetFields();
      setSelectedInvoiceId(undefined);
    } catch (e) {
      messageApi.error("Failed to record payment");
    }
  };

  const InvoiceEntry = ({ inv }: { inv: Invoice }) => (
    <Card 
      size="small" 
      className={`mb-4 border-l-4 hover:shadow-md transition-all ${
        inv.status === 'paid' ? 'border-l-emerald-400 bg-emerald-50/5' : 
        inv.status === 'overdue' ? 'border-l-red-400 bg-red-50/5' : 'border-l-blue-400'
      }`}
      title={
        <div className="flex justify-between items-center w-full py-1">
          <Space>
            <Text className="font-mono text-[11px] font-bold text-gray-400">{inv.id}</Text>
            <Text strong className="text-gray-800">{dayjs(inv.date).format('DD MMM, YYYY')}</Text>
            <StatusTag status={inv.status} />
          </Space>
          <Text className="text-sm font-black text-gray-900">₦{(inv.amount || 0).toLocaleString()}</Text>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex justify-between items-end px-1">
          <div className="flex-1">
            <Text type="secondary" className="text-[10px] uppercase font-bold block mb-1">Primary Description</Text>
            <Text className="text-sm font-medium text-gray-700">{inv.items?.[0]?.description || 'No items listed'}</Text>
          </div>
          {(inv.paidAmount || 0) > 0 && (inv.paidAmount || 0) < (inv.amount || 0) && (
            <div className="text-right">
              <Text className="text-[10px] uppercase font-bold text-emerald-600 block">Current Balance</Text>
              <Text className="text-sm font-bold text-orange-600">₦{((inv.amount || 0) - (inv.paidAmount || 0)).toLocaleString()}</Text>
            </div>
          )}
        </div>

        {inv.items && inv.items.length > 0 && (
          <Collapse 
            ghost 
            size="small" 
            className="bg-gray-50/50 rounded-lg border border-gray-100/50"
            items={[{
              key: 'items',
              label: <Text className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Breakdown ({inv.items.length} items)</Text>,
              children: (
                <div className="space-y-2 pt-1 pb-2">
                  {inv.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-xs">
                      <Text className="text-gray-600">{item.description}</Text>
                      <Text className="font-bold text-gray-800">₦{(item.amount || 0).toLocaleString()}</Text>
                    </div>
                  ))}
                  <Divider className="my-2 border-gray-100" />
                  <div className="flex justify-between items-center pt-1">
                    <Text strong className="text-[10px] uppercase text-gray-400">Grand Total</Text>
                    <Text strong className="text-gray-900">₦{(inv.amount || 0).toLocaleString()}</Text>
                  </div>
                </div>
              )
            }]}
          />
        )}
      </div>
    </Card>
  );

  return (
    <div className="">
      {contextHolder}

      {/* Actions */}
      <div className="flex justify-end gap-3 mb-6">
        <Button 
          icon={<FileTextOutlined />} 
          onClick={() => setIsInvoiceModalOpen(true)}
          className="h-9 px-4 rounded-lg"
        >
          Create Invoice
        </Button>
        <Button 
          type="primary" 
          icon={<DollarOutlined />} 
          className="bg-blue-600 font-bold h-9 px-6 rounded-lg shadow-blue-100"
          onClick={() => setIsPaymentModalOpen(true)}
        >
          Record Payment
        </Button>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-sm">
        <Card size="small" className="border-l-4 border-l-blue-500 shadow-sm bg-blue-50/5">
          <Text type="secondary" className="text-[10px] font-black uppercase tracking-[0.1em] block mb-1.5 text-gray-400">Total Billed</Text>
          <Title level={3} className="!m-0 !font-black text-gray-800 leading-none">
            ₦{summary.totalBilled.toLocaleString()}
          </Title>
        </Card>
        <Card size="small" className="border-l-4 border-l-emerald-500 shadow-sm bg-emerald-50/5">
          <Text type="secondary" className="text-[10px] font-black uppercase tracking-[0.1em] block mb-1.5 text-gray-400">Total Paid</Text>
          <Title level={3} className="!m-0 !font-black text-emerald-600 leading-none">
            ₦{summary.totalPaid.toLocaleString()}
          </Title>
        </Card>
        <Card size="small" className={`border-l-4 shadow-sm ${summary.outstandingBalance > 0 ? 'border-l-orange-500 bg-orange-50/10' : 'border-l-gray-200'}`}>
          <Text type="secondary" className="text-[10px] font-black uppercase tracking-[0.1em] block mb-1.5 text-gray-400">Outstanding Balance</Text>
          <Title level={3} className={`!m-0 !font-black leading-none ${summary.outstandingBalance > 0 ? 'text-orange-600' : 'text-gray-300'}`}>
            ₦{summary.outstandingBalance.toLocaleString()}
          </Title>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Invoices List */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-50 text-sm">
            <FileTextOutlined className="text-blue-500" />
            <Text className="font-black uppercase text-[10px] tracking-widest text-gray-500">Invoice History</Text>
          </div>
          
          {(patient.invoices || []).length === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-16 text-center border-2 border-dashed border-gray-200">
              <Empty description={<Text type="secondary" className="text-xs font-medium">No billing records found</Text>} />
            </div>
          ) : (
            <div className="space-y-4">
              {(patient.invoices || []).map(inv => <InvoiceEntry key={inv.id} inv={inv} />)}
            </div>
          )}
        </div>

        {/* Payments History */}
        <div>
          <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-50 text-sm">
            <HistoryOutlined className="text-gray-400" />
            <Text className="font-black uppercase text-[10px] tracking-widest text-gray-500">Recent Payments</Text>
          </div>
          
          <div className="space-y-4">
            {(patient.payments || []).length === 0 ? (
              <div className="bg-gray-50 rounded-2xl p-12 text-center border border-dashed border-gray-200">
                <Text type="secondary" className="text-xs italic font-medium">No transaction history</Text>
              </div>
            ) : (
              (patient.payments || []).map(pay => (
                <div key={pay.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex justify-between items-center group hover:border-blue-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-base shadow-inner">
                      {PAYMENT_METHOD_ICON[pay.method] || <DollarOutlined />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <Text className="text-sm font-black text-gray-900">₦{(pay.amount || 0).toLocaleString()}</Text>
                        <StatusTag status="paid" className="text-[8px] h-fit px-1.5" />
                      </div>
                      <Text type="secondary" className="text-[10px] uppercase font-black tracking-tighter text-gray-400">
                        {pay.method} · {dayjs(pay.date).format('DD MMM YY')}
                      </Text>
                    </div>
                  </div>
                  <div className="text-[9px] font-mono text-gray-300 group-hover:text-gray-400 transition-colors uppercase tracking-tighter">
                    #{pay.invoiceId ? pay.invoiceId.slice(-4) : 'MISC'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Invoice Modal */}
      <Modal
        title={<Text className="font-black uppercase tracking-widest text-gray-500 text-xs px-1">Generate Clinical Invoice</Text>}
        open={isInvoiceModalOpen}
        onCancel={() => setIsInvoiceModalOpen(false)}
        onOk={() => invoiceForm.submit()}
        confirmLoading={saving}
        width={550}
        destroyOnClose
        className="rounded-2xl"
      >
        <Form form={invoiceForm} layout="vertical" onFinish={handleCreateInvoice} initialValues={{ items: [{ description: '', amount: 0 }] }} className="pt-2">
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <div className="space-y-2 mt-4 max-h-[400px] overflow-y-auto px-1">
                {fields.map(({ key, name, ...restField }) => (
                  <div key={key} className="flex gap-4 items-end mb-2 bg-gray-50/50 p-4 rounded-xl border border-gray-100 relative group">
                    <Form.Item
                      {...restField}
                      name={[name, 'description']}
                      label={name === 0 ? <Text className="text-[10px] uppercase font-black text-gray-400">Service Description</Text> : ""}
                      rules={[{ required: true, message: 'Required' }]}
                      className="mb-0 flex-1"
                    >
                      <Input placeholder="e.g. Specialist Consultation" variant="filled" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'amount']}
                      label={name === 0 ? <Text className="text-[10px] uppercase font-black text-gray-400">Fee (₦)</Text> : ""}
                      rules={[{ required: true, message: 'Required' }]}
                      className="mb-0 w-32"
                    >
                      <InputNumber className="w-full" min={0} step={500} variant="filled" />
                    </Form.Item>
                    {fields.length > 1 && (
                      <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />} 
                        onClick={() => remove(name)} 
                        className="mb-0.5 opacity-0 group-hover:opacity-100 transition-opacity" 
                      />
                    )}
                  </div>
                ))}
                <Form.Item className="mt-4">
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} className="h-10 rounded-xl border-gray-200 text-gray-500 font-bold">
                    Add Billing Item
                  </Button>
                </Form.Item>
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        title={<Text className="font-black uppercase tracking-widest text-gray-500 text-xs px-1">Record Transaction</Text>}
        open={isPaymentModalOpen}
        onCancel={() => {
          setIsPaymentModalOpen(false);
          setSelectedInvoiceId(undefined);
          paymentForm.resetFields();
        }}
        onOk={() => paymentForm.submit()}
        confirmLoading={saving}
        width={500}
        destroyOnClose
      >
        <Form form={paymentForm} layout="vertical" onFinish={handleRecordPayment} className="mt-6">
          <Form.Item label={<Text className="text-[10px] uppercase font-black text-gray-400">Apply to Pending Invoice</Text>} name="invoiceId" rules={[{ required: true, message: 'Select an invoice' }]}>
            <Select 
              placeholder="Choose invoice to clear..." 
              variant="filled"
              onChange={setSelectedInvoiceId}
              className="h-10"
            >
              {(patient.invoices || [])
                .filter(inv => inv.status !== 'paid')
                .map(inv => (
                  <Select.Option key={inv.id} value={inv.id}>
                    {inv.id} — {inv.items?.[0]?.description || 'Invoice'} (Balance: ₦{((inv.amount || 0) - (inv.paidAmount || 0)).toLocaleString()})
                  </Select.Option>
                ))
              }
            </Select>
          </Form.Item>
          
          <div className="grid grid-cols-2 gap-4">
            <Form.Item 
              label={<Text className="text-[10px] uppercase font-black text-gray-400">Amount Received (₦)</Text>} 
              name="amount" 
              rules={[
                { required: true, message: 'Enter amount' },
                { type: 'number', max: selectedInvoiceRemaining, message: `Cannot exceed balance of ₦${selectedInvoiceRemaining.toLocaleString()}` }
              ]}
            >
              <InputNumber className="w-full h-10 flex items-center" min={1} step={500} max={selectedInvoiceRemaining} variant="filled" />
            </Form.Item>

            <Form.Item label={<Text className="text-[10px] uppercase font-black text-gray-400">Method</Text>} name="method" rules={[{ required: true }]} initialValue="cash">
              <Select variant="filled" className="h-10">
                <Select.Option value="cash">Cash</Select.Option>
                <Select.Option value="transfer">Bank Transfer</Select.Option>
                <Select.Option value="card">Debit Card</Select.Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item label={<Text className="text-[10px] uppercase font-black text-gray-400">Transaction Reference</Text>} name="reference">
            <Input placeholder="Optional receipt or bank ref" variant="filled" className="h-10" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
