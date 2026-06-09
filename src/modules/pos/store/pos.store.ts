import { create } from "zustand";
import { 
  POSItem, 
  Sale, 
  SaleLineItem, 
  POSPayment, 
  POSPaymentMethod,
  InventoryStats,
  InventoryMovement
} from "../types/pos.types";
import { posMockRepo } from "../pos.mock";
import { POSSearchParams } from "../pos.repository";

const CURRENT_ACTOR = { id: "usr-001", name: "Dr Hugh Mann" };

interface POSState {
  // Catalog & Inventory
  items: POSItem[];
  loadingItems: boolean;
  inventoryStats: InventoryStats | null;
  loadingInventory: boolean;
  itemMovements: Record<string, InventoryMovement[]>;
  allMovements: InventoryMovement[];
  
  // Active Sale (Basket)
  basket: SaleLineItem[];
  selectedPatientId?: string;
  selectedPatientName?: string;
  payments: POSPayment[];
  discount: number;
  
  // Transactions
  sales: Sale[];
  heldSales: Sale[];
  loadingSales: boolean;
  
  // Actions - Catalog & Inventory
  fetchItems: (params?: POSSearchParams) => Promise<void>;
  fetchInventoryStats: () => Promise<void>;
  fetchItemMovements: (itemId: string) => Promise<void>;
  fetchAllMovements: () => Promise<void>;
  createItem: (item: Omit<POSItem, "id">) => Promise<POSItem>;
  updateItem: (id: string, item: Partial<POSItem>) => Promise<POSItem>;
  
  // Actions - Basket
  addToBasket: (item: POSItem) => void;
  removeFromBasket: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateDiscount: (itemId: string, discount: number) => void;
  setPatient: (id?: string, name?: string) => void;
  addPayment: (method: POSPaymentMethod, amount: number, reference?: string) => void;
  removePayment: (index: number) => void;
  setGlobalDiscount: (amount: number) => void;
  clearBasket: () => void;
  
  // Actions - Sales
  completeSale: () => Promise<Sale>;
  holdSale: () => Promise<Sale>;
  fetchSales: () => Promise<void>;
  fetchHeldSales: () => Promise<void>;
}

export const usePOSStore = create<POSState>((set, get) => ({
  items: [],
  loadingItems: false,
  inventoryStats: null,
  loadingInventory: false,
  itemMovements: {},
  allMovements: [],
  
  basket: [],
  payments: [],
  discount: 0,
  sales: [],
  heldSales: [],
  loadingSales: false,

  fetchItems: async (params) => {
    set({ loadingItems: true });
    try {
      const results = await posMockRepo.getItems(params);
      set({ items: results });
    } finally {
      set({ loadingItems: false });
    }
  },

  fetchInventoryStats: async () => {
    set({ loadingInventory: true });
    try {
      const stats = await posMockRepo.getInventoryStats();
      set({ inventoryStats: stats });
    } finally {
      set({ loadingInventory: false });
    }
  },

  fetchItemMovements: async (itemId) => {
    try {
      const movements = await posMockRepo.getInventoryMovements(itemId);
      set(state => ({
        itemMovements: { ...state.itemMovements, [itemId]: movements }
      }));
    } catch (e) {
      console.error(e);
    }
  },

  fetchAllMovements: async () => {
    try {
      const results = await posMockRepo.getAllInventoryMovements();
      set({ allMovements: results });
    } catch (e) {
      console.error(e);
    }
  },

  createItem: async (data) => {
    const newItem = await posMockRepo.createItem(data);
    await get().fetchItems();
    await get().fetchInventoryStats();
    return newItem;
  },

  updateItem: async (id, data) => {
    const updated = await posMockRepo.updateItem(id, data);
    await get().fetchItems();
    await get().fetchInventoryStats();
    return updated;
  },

  addToBasket: (item) => {
    const { basket } = get();
    const existing = basket.find(i => i.itemId === item.id);
    
    if (existing) {
      get().updateQuantity(item.id, existing.quantity + 1);
    } else {
      const newLine: SaleLineItem = {
        id: crypto.randomUUID(),
        itemId: item.id,
        name: item.name,
        quantity: 1,
        unitPrice: item.sellingPrice,
        discount: 0,
        total: item.sellingPrice,
      };
      set({ basket: [...basket, newLine] });
    }
  },

  removeFromBasket: (itemId) => {
    set({ basket: get().basket.filter(i => i.itemId !== itemId) });
  },

  updateQuantity: (itemId, quantity) => {
    set({
      basket: get().basket.map(i => {
        if (i.itemId === itemId) {
          const q = Math.max(1, quantity);
          return { ...i, quantity: q, total: (i.unitPrice * q) - i.discount };
        }
        return i;
      })
    });
  },

  updateDiscount: (itemId, discount) => {
    set({
      basket: get().basket.map(i => {
        if (i.itemId === itemId) {
          return { ...i, discount, total: (i.unitPrice * i.quantity) - discount };
        }
        return i;
      })
    });
  },

  setPatient: (id, name) => {
    set({ selectedPatientId: id, selectedPatientName: name });
  },

  addPayment: (method, amount, reference) => {
    set({ payments: [...get().payments, { method, amount, reference }] });
  },

  removePayment: (index) => {
    set({ payments: get().payments.filter((_, i) => i !== index) });
  },

  setGlobalDiscount: (amount) => set({ discount: amount }),

  clearBasket: () => {
    set({ basket: [], payments: [], discount: 0, selectedPatientId: undefined, selectedPatientName: undefined });
  },

  completeSale: async () => {
    const { basket, selectedPatientId, selectedPatientName, payments, discount } = get();
    const subtotal = basket.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);
    const itemDiscounts = basket.reduce((sum, i) => sum + i.discount, 0);
    const total = subtotal - itemDiscounts - discount;

    const sale = await posMockRepo.createSale({
      patientId: selectedPatientId,
      patientName: selectedPatientName,
      items: basket,
      subtotal,
      totalDiscount: itemDiscounts + discount,
      tax: 0,
      total,
      payments,
      status: "completed",
      processedBy: CURRENT_ACTOR,
    }, CURRENT_ACTOR);

    get().clearBasket();
    await get().fetchSales();
    await get().fetchInventoryStats();
    return sale;
  },

  holdSale: async () => {
    const { basket, selectedPatientId, selectedPatientName, payments, discount } = get();
    const subtotal = basket.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);
    const itemDiscounts = basket.reduce((sum, i) => sum + i.discount, 0);
    const total = subtotal - itemDiscounts - discount;

    const sale = await posMockRepo.holdSale({
      patientId: selectedPatientId,
      patientName: selectedPatientName,
      items: basket,
      subtotal,
      totalDiscount: itemDiscounts + discount,
      tax: 0,
      total,
      payments,
      processedBy: CURRENT_ACTOR,
    }, CURRENT_ACTOR);

    get().clearBasket();
    await get().fetchHeldSales();
    return sale;
  },

  fetchSales: async () => {
    set({ loadingSales: true });
    try {
      const results = await posMockRepo.getSales();
      set({ sales: results });
    } finally {
      set({ loadingSales: false });
    }
  },

  fetchHeldSales: async () => {
    set({ loadingSales: true });
    try {
      const results = await posMockRepo.getHeldSales();
      set({ heldSales: results });
    } finally {
      set({ loadingSales: false });
    }
  },
}));
