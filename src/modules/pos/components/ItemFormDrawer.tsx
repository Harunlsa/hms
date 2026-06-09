import { Drawer, Form, Input, InputNumber, Select, Switch, Button, Space, message, Typography } from "antd";
import { POSItem, POSItemType } from "../types/pos.types";
import { useEffect } from "react";
import { usePOSStore } from "../store/pos.store";

const { Text } = Typography;

interface ItemFormDrawerProps {
  visible: boolean;
  onClose: () => void;
  item: POSItem | null;
}

const CATEGORIES = [
    { value: 'Pharmacy', label: 'Pharmacy' },
    { value: 'Clinical', label: 'Clinical' },
    { value: 'Laboratory', label: 'Laboratory' },
    { value: 'Admin', label: 'Admin' },
    { value: 'In-patient', label: 'In-patient' },
    { value: 'General', label: 'General' },
];

export function ItemFormDrawer({ visible, onClose, item }: ItemFormDrawerProps) {
  const [form] = Form.useForm();
  const { createItem, updateItem, items } = usePOSStore();
  const isEdit = !!item;

  useEffect(() => {
    if (visible) {
      if (item) {
        form.setFieldsValue(item);
      } else {
        form.resetFields();
        form.setFieldsValue({ 
            active: true, 
            type: 'medication',
            category: 'General',
            code: generateUniqueCode()
        });
      }
    }
  }, [visible, item, form]);

  const generateUniqueCode = () => {
    const prefix = "ITEM";
    const random = Math.floor(1000 + Math.random() * 9000);
    let code = `${prefix}-${random}`;
    
    // Ensure uniqueness within current items
    while (items.some(i => i.code === code)) {
        const newRandom = Math.floor(1000 + Math.random() * 9000);
        code = `${prefix}-${newRandom}`;
    }
    return code;
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (isEdit && item) {
        await updateItem(item.id, values);
        message.success("Item updated successfully");
      } else {
        await createItem(values);
        message.success("Item created successfully");
      }
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Drawer
      title={isEdit ? "Edit Billable Item" : "Register New Billable Item"}
      width={480}
      onClose={onClose}
      open={visible}
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={handleSubmit} className="bg-blue-600">
            {isEdit ? "Save Changes" : "Register Item"}
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ active: true }}
      >
        <Form.Item
          name="name"
          label="Item Name"
          rules={[{ required: true, message: 'Please enter item name' }]}
        >
          <Input placeholder="e.g. Paracetamol 500mg, Consultation" />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
            <Form.Item
                name="code"
                label="Item Code / SKU"
                rules={[{ required: true, message: 'Please enter item code' }]}
            >
                <Input placeholder="e.g. MED-001" style={{ textTransform: 'uppercase' }} />
            </Form.Item>

            <Form.Item
                name="upc"
                label="UPC / Barcode"
            >
                <Input placeholder="Scan or enter barcode" />
            </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <Form.Item
                name="type"
                label="Item Type"
                rules={[{ required: true }]}
            >
                <Select options={[
                    { value: 'medication', label: 'Medication' },
                    { value: 'laboratory_service', label: 'Laboratory Service' },
                    { value: 'consultation', label: 'Consultation' },
                    { value: 'administrative_fee', label: 'Administrative Fee' },
                    { value: 'admission_fee', label: 'Admission Fee' },
                ]} />
            </Form.Item>

            <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true }]}
            >
                <Select options={CATEGORIES} />
            </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <Form.Item
                name="sellingPrice"
                label="Selling Price"
                rules={[{ required: true }]}
            >
                <InputNumber 
                    className="w-full" 
                    formatter={value => `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value!.replace(/₦\s?|(,*)/g, '') as any}
                />
            </Form.Item>

            <Form.Item
                name="active"
                label="Status"
                valuePropName="checked"
            >
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
            </Form.Item>
        </div>

        <Form.Item
            noStyle
            shouldUpdate={(prev, curr) => prev.type !== curr.type}
        >
            {({ getFieldValue }) => {
                const type = getFieldValue('type');
                if (type === 'medication') {
                    return (
                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mt-4 space-y-4">
                            <Text strong className="text-blue-800 text-xs uppercase tracking-widest">Inventory Settings</Text>
                            <Form.Item name="manufacturer" label="Manufacturer" className="mb-0">
                                <Input placeholder="e.g. Emzor" />
                            </Form.Item>
                            <Form.Item name="reorderLevel" label="Reorder Level" className="mb-0">
                                <InputNumber className="w-full" placeholder="e.g. 100" />
                            </Form.Item>
                            <Form.Item name="stockQuantity" label="Initial Stock" className="mb-0" initialValue={0}>
                                <InputNumber className="w-full" />
                            </Form.Item>
                        </div>
                    );
                }
                return null;
            }}
        </Form.Item>
      </Form>
    </Drawer>
  );
}
