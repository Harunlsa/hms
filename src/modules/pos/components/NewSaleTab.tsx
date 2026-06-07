import { useState, useEffect, useMemo, useRef } from "react";
import { 
  Input, 
  Button, 
  Card, 
  Typography, 
  Tag, 
  InputNumber, 
  Select, 
  message,
  Empty,
  Badge,
  Segmented,
} from "antd";
import { 
  SearchOutlined, 
  PlusOutlined, 
  DeleteOutlined, 
  WalletOutlined, 
  CreditCardOutlined, 
  SwapOutlined,
  SaveOutlined,
  StopOutlined,
  CheckCircleOutlined,
  ShoppingCartOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { usePOSStore } from "../store/pos.store";
import { usePatientStore } from "../../patients/store/patient.store";
import { POSPaymentMethod } from "../types/pos.types";

const { Text, Title } = Typography;

export function NewSaleTab() {
  const { 
    items = [], 
    fetchItems,
    basket = [], 
    addToBasket, 
    removeFromBasket, 
    updateQuantity,
    selectedPatientId, 
    setPatient,
    payments = [], 
    addPayment, 
    removePayment,
    discount = 0,
    completeSale, 
    holdSale, 
    clearBasket
  } = usePOSStore();
  
  const { patients = [], fetchAll: fetchPatients } = usePatientStore();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<POSPaymentMethod>("cash");
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const basketContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchItems();
    fetchPatients();
  }, []);

  // Auto-scroll basket to bottom when items are added
  useEffect(() => {
    if (basketContainerRef.current) {
      basketContainerRef.current.scrollTo({
        top: basketContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [basket.length]);

  const filteredItems = useMemo(() => {
    let results = Array.isArray(items) ? items : [];
    if (activeCategory !== "All") {
      const typeMap: Record<string, string> = {
        "Medicine": "medication",
        "Service": "laboratory_service", // Fixed to match new types
        "Lab": "laboratory_service"
      };
      const targetType = typeMap[activeCategory] || activeCategory.toLowerCase();
      results = results.filter(i => i.type?.toLowerCase() === targetType);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(i => 
        i.name?.toLowerCase().includes(q) || 
        i.code?.toLowerCase().includes(q) // Updated to code
      );
    }
    return results;
  }, [items, searchQuery, activeCategory]);

  const totals = useMemo(() => {
    const subtotal = Array.isArray(basket) ? basket.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0) : 0;
    const itemDiscounts = Array.isArray(basket) ? basket.reduce((sum, i) => sum + i.discount, 0) : 0;
    const total = subtotal - itemDiscounts - discount;
    const paid = Array.isArray(payments) ? payments.reduce((sum, p) => sum + p.amount, 0) : 0;
    const balance = total - paid;
    return { subtotal, itemDiscounts, total, paid, balance };
  }, [basket, payments, discount]);

  // Sync payment amount with remaining balance when it changes
  useEffect(() => {
    if (totals.balance >= 0) {
      setPaymentAmount(totals.balance);
    } else {
      setPaymentAmount(0);
    }
  }, [totals.balance]);

  const handleAddPayment = () => {
    if (paymentAmount <= 0) return;
    addPayment(paymentMethod, paymentAmount);
  };

  const handleComplete = async () => {
    if (basket.length === 0) return messageApi.warning("Basket is empty");
    if (totals.balance > 0) return messageApi.warning("Remaining balance must be zero");
    
    try {
      await completeSale();
      messageApi.success("Sale completed successfully");
    } catch (e) {
      messageApi.error("Failed to complete sale");
    }
  };

  return (
    <div className="flex h-full overflow-hidden bg-gray-50/30">
      {contextHolder}
      
      {/* Left Panel - Item Catalog */}
      <div className="w-[58%] border-r-2 border-blue-100 flex flex-col bg-white">
        <div className="p-4 border-b border-gray-100 bg-white">
          <Input 
            prefix={<SearchOutlined className="text-blue-400" />} 
            placeholder="Search catalog by name or SKU..." 
            className="h-11 rounded-xl border-gray-200 focus:border-blue-400"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            allowClear
          />
          <div className="flex gap-2 mt-3">
             {["All", "Medicine", "Service", "Lab"].map(cat => (
               <Tag.CheckableTag 
                 key={cat}
                 checked={activeCategory === cat} 
                 className={`rounded-full px-5 py-1 border transition-all ${
                    activeCategory === cat 
                    ? 'bg-blue-600! text-white! border-blue-600 shadow-sm' 
                    : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300'
                  }`}
                 onChange={checked => checked && setActiveCategory(cat)}
               >
                 {cat === "Lab" ? "Labs" : cat === "Service" ? "Services" : cat}
               </Tag.CheckableTag>
             ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-50/20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map(item => (
              <Card 
                key={item.id} 
                size="small" 
                hoverable 
                className="rounded-2xl border-gray-100 hover:border-blue-500 hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden bg-white"
                onClick={() => addToBasket(item)}
              >
                <div className="flex flex-col h-full justify-between gap-2">
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <Tag className="!m-0 text-[9px] font-black uppercase border-0 rounded-full bg-blue-50 text-blue-600">
                        {item.type.replace("_", " ")}
                      </Tag>
                    </div>
                    <Text strong className="text-[14px] line-clamp-2 leading-tight h-10 group-hover:text-blue-700 transition-colors">
                      {item.name}
                    </Text>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                    <Text className="text-base font-black text-gray-900">₦{item.sellingPrice?.toLocaleString()}</Text>
                    <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                        <PlusOutlined className="text-[10px] text-blue-600 group-hover:text-white" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          {filteredItems.length === 0 && <Empty className="mt-20" description={<Text className="text-gray-400">No items found in this category</Text>} />}
        </div>
      </div>

      {/* Right Panel - Checkout Stack */}
      <div className="flex-1 flex flex-col bg-blue-50/20 overflow-y-auto custom-scrollbar">
        <div className="p-5 flex flex-col gap-6">
          
          {/* 1. Active Basket Section */}
          <div className="flex flex-col">
            <div className="flex justify-between items-end mb-3 px-1">
              <div className="flex items-center gap-2">
                <Title level={5} className="!m-0 !text-[12px] font-black uppercase tracking-widest text-blue-800">Basket Summary</Title>
                <Badge count={basket.length} style={{ backgroundColor: '#1d4ed8', fontSize: '10px' }} />
              </div>
              <Button type="text" danger size="small" className="text-[10px] font-black uppercase p-0 h-auto opacity-70 hover:opacity-100" onClick={clearBasket}>Clear All</Button>
            </div>

            <div ref={basketContainerRef} className="h-[340px] overflow-y-auto bg-white rounded-2xl border border-blue-100 shadow-sm custom-scrollbar">
              {basket.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-300 p-8 text-center bg-gray-50/20">
                  <ShoppingCartOutlined style={{ fontSize: '40px' }} className="opacity-20" />
                  <Text className="mt-4 text-xs font-medium text-gray-400 italic">Select products or services to begin</Text>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {basket.map(line => (
                    <div key={line.id} className="p-3 flex flex-col gap-2 hover:bg-blue-50/20 transition-colors border-l-4 border-transparent hover:border-blue-400">
                      <div className="flex justify-between items-start gap-2">
                        <Text strong className="text-[13px] text-gray-800 leading-tight flex-1">
                          {line.name}
                        </Text>
                        <Button 
                          type="text" 
                          danger 
                          icon={<DeleteOutlined className="text-[10px]" />} 
                          size="small" 
                          className="h-6 w-6 rounded-md hover:bg-red-50 shrink-0"
                          onClick={() => removeFromBasket(line.itemId)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between bg-gray-50/50 px-2 py-1.5 rounded-lg border border-gray-100/50">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <Text className="text-[8px] uppercase font-black text-gray-400">Rate</Text>
                            <Text className="text-[11px] font-mono font-bold text-gray-600">₦{line.unitPrice?.toLocaleString()}</Text>
                          </div>
                          <div className="h-5 w-[1px] bg-gray-200" />
                          <div className="flex flex-col">
                            <Text className="text-[8px] uppercase font-black text-gray-400">Qty</Text>
                            <InputNumber 
                              size="small" 
                              min={1} 
                              value={line.quantity} 
                              onChange={v => updateQuantity(line.itemId, v || 1)}
                              className="w-14 rounded-md text-[11px] font-bold"
                            />
                          </div>
                        </div>
                        <div className="text-right">
                          <Text className="text-[8px] uppercase font-black text-gray-400 block">Total</Text>
                          <Text strong className="text-sm text-blue-600 font-black">₦{line.total?.toLocaleString()}</Text>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 2. Target Patient Section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 px-1">
               <UserOutlined className="text-blue-500" />
               <Title level={5} className="!m-0 !text-[12px] font-black uppercase tracking-widest text-blue-800">Target Patient</Title>
            </div>
            <Select
              showSearch
              placeholder="Search existing patients or select walk-in..."
              className="w-full"
              variant="filled"
              allowClear
              value={selectedPatientId}
              onChange={(val, opt: any) => setPatient(val, opt?.label)}
              optionFilterProp="label"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={(Array.isArray(patients) ? patients : []).map(p => ({ value: p.id, label: p.name }))}
              style={{ height: '44px' }}
              className="rounded-xl overflow-hidden"
            />
          </div>

          {/* 3. Payment Workflow Section */}
          <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <Title level={5} className="!m-0 !text-[12px] font-black uppercase tracking-widest text-blue-800">Payment Breakdown</Title>
              <Segmented
                size="small"
                value={isSplitMode ? 'split' : 'single'}
                onChange={(val) => setIsSplitMode(val === 'split')}
                options={[
                    { label: 'Single', value: 'single' },
                    { label: 'Split', value: 'split' },
                ]}
                className="bg-gray-100 rounded-lg"
              />
            </div>
            
            {/* Added Payments List */}
            <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
               {(Array.isArray(payments) ? payments : []).map((p, idx) => (
                 <div key={idx} className="flex justify-between items-center bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
                    <div className="flex items-center gap-3">
                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          p.method === 'cash' ? 'bg-emerald-100 text-emerald-700' : 
                          p.method === 'card' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                       }`}>
                          {p.method === 'cash' && <WalletOutlined />}
                          {p.method === 'card' && <CreditCardOutlined />}
                          {p.method === 'transfer' && <SwapOutlined />}
                       </div>
                       <Text className="text-[12px] capitalize font-black text-gray-700">{p.method}</Text>
                    </div>
                    <div className="flex items-center gap-3">
                       <Text strong className="text-[13px] font-black text-blue-900">₦{p.amount?.toLocaleString()}</Text>
                       <Button type="text" danger icon={<DeleteOutlined className="text-[10px]" />} size="small" onClick={() => removePayment(idx)} className="h-6 w-6 rounded-md hover:bg-red-50" />
                    </div>
                 </div>
               ))}
            </div>

            {/* Payment Input Area */}
            <div className="flex flex-col gap-3 pt-3 border-t border-gray-100">
              <div className="flex flex-col gap-3">
                <Segmented
                  block
                  size="middle"
                  value={paymentMethod}
                  onChange={(v) => setPaymentMethod(v as POSPaymentMethod)}
                  options={[
                    { label: 'Cash', value: 'cash', icon: <WalletOutlined /> },
                    {label: 'Card', value: 'card', icon: <CreditCardOutlined /> },
                    { label: 'Transfer', value: 'transfer', icon: <SwapOutlined /> },
                  ]}
                  className="p-1 bg-gray-50 rounded-xl"
                />
                <InputNumber 
                  value={paymentAmount} 
                  onChange={v => setPaymentAmount(v || 0)}
                  className="w-full text-center text-xl font-black rounded-xl"
                  size="large"
                  variant="filled"
                  min={0}
                  formatter={value => `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/₦\s?|(,*)/g, '') as any}
                  style={{ width: '100%', height: '50px', lineHeight: '50px' }}
                />
              </div>
              <Button 
                type={isSplitMode ? "dashed" : "primary"} 
                block 
                size="large"
                icon={<PlusOutlined />} 
                className={`rounded-xl h-11 font-black text-[12px] uppercase tracking-wider ${!isSplitMode ? 'bg-blue-600 hover:bg-blue-700!' : ''}`}
                onClick={handleAddPayment}
              >
                {isSplitMode ? "Add Part Payment" : "Apply Full Payment"}
              </Button>
            </div>
          </div>

          {/* 4. Checkout Summary Box */}
          <div className="bg-blue-900 text-white rounded-2xl p-6 shadow-2xl shadow-blue-200 relative overflow-hidden border border-blue-800">
            <div className="absolute -top-10 -right-10 p-4 opacity-5 rotate-12">
               <CheckCircleOutlined style={{ fontSize: '180px' }} />
            </div>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center text-[13px] font-bold">
                <Text className="!text-white opacity-90">Subtotal</Text>
                <Text className="!text-white font-mono">₦{totals.subtotal?.toLocaleString()}</Text>
              </div>
              <div className="flex justify-between items-center text-[13px] font-bold border-b border-white/20 pb-4">
                <Text className="!text-orange-200">Total Discounts</Text>
                <Text className="!text-orange-200 font-mono">-₦{totals.itemDiscounts?.toLocaleString()}</Text>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <Title level={4} className="!m-0 !text-white !font-black !uppercase !text-[14px] !tracking-widest">Total Due</Title>
                <Title level={1} className="!m-0 !text-white !font-black !text-[36px] drop-shadow-xl">₦{totals.total?.toLocaleString()}</Title>
              </div>
            </div>
          </div>

        </div>

        {/* Action Buttons Panel */}
        <div className="mt-auto px-6 py-4 bg-white border-t-2 border-gray-100 flex flex-col gap-3 sticky bottom-0 z-30 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          <Button 
            type="primary" 
            block
            disabled={totals.balance > 0 || basket.length === 0}
            className={`rounded-xl h-12 font-black uppercase tracking-widest shadow-xl transition-all ${
               totals.balance <= 0 && basket.length > 0
               ? 'bg-emerald-600 hover:bg-emerald-700! shadow-emerald-100' 
               : 'bg-gray-100! text-gray-400! border-0'
            }`}
            onClick={handleComplete}
          >
            Complete Sale & Issue Receipt
          </Button>
          <div className="flex gap-3">
            <Button icon={<SaveOutlined />} className="flex-1 rounded-xl h-9 text-[11px] font-black uppercase border-gray-200 hover:text-blue-600 hover:border-blue-400 transition-colors" onClick={() => holdSale()}>Hold Order</Button>
            <Button icon={<StopOutlined />} className="flex-1 rounded-xl h-9 text-[11px] font-black uppercase border-gray-200 hover:text-red-600 hover:border-red-400 transition-colors" onClick={clearBasket}>Cancel</Button>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #dbeafe;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #bfdbfe;
        }
        .ant-card-small > .ant-card-body {
            padding: 12px;
        }
      `}</style>
    </div>
  );
}