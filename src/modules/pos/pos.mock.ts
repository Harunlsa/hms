import { faker } from "@faker-js/faker";
import { POSItem, Sale, InventoryMovement } from "./types/pos.types";
import { POSRepository, POSSearchParams, POSActor } from "./pos.repository";

const INITIAL_ITEMS: POSItem[] = [
  { 
    id: "itm-001", 
    code: "CONS-GEN", 
    name: "General Consultation", 
    type: "consultation", 
    sellingPrice: 5000, 
    category: "Clinical",
    active: true 
  },
  { 
    id: "itm-002", 
    code: "CONS-SPEC", 
    name: "Specialist Consultation", 
    type: "consultation", 
    sellingPrice: 15000, 
    category: "Clinical",
    active: true 
  },
  { 
    id: "itm-003", 
    code: "ADM-FILE", 
    name: "New File Opening Fee", 
    type: "administrative_fee", 
    sellingPrice: 2500, 
    category: "Admin",
    active: true 
  },
  { 
    id: "itm-004", 
    code: "MED-PA-500", 
    upc: "6151100001234",
    name: "Paracetamol 500mg", 
    type: "medication", 
    sellingPrice: 50, 
    category: "Pharmacy", 
    active: true,
    manufacturer: "Emzor Pharmaceuticals",
    reorderLevel: 100,
    stockQuantity: 500,
    batches: [
        {
            id: "b-001",
            batchNumber: "BN12345",
            expiryDate: "2026-12-31",
            purchaseCost: 35,
            quantity: 300,
            initialQuantity: 500,
            createdAt: "2024-01-01"
        },
        {
            id: "b-002",
            batchNumber: "BN67890",
            expiryDate: "2025-06-30",
            purchaseCost: 38,
            quantity: 200,
            initialQuantity: 300,
            createdAt: "2024-03-01"
        }
    ]
  },
  { 
    id: "itm-005", 
    code: "MED-AM-250", 
    upc: "6151100005678",
    name: "Amoxicillin 250mg", 
    type: "medication", 
    sellingPrice: 200, 
    category: "Pharmacy", 
    active: true,
    manufacturer: "GlaxoSmithKline",
    reorderLevel: 50,
    stockQuantity: 120,
    batches: [
        {
            id: "b-003",
            batchNumber: "AMX9988",
            expiryDate: "2026-08-15",
            purchaseCost: 140,
            quantity: 120,
            initialQuantity: 200,
            createdAt: "2024-02-15"
        }
    ]
  },
  { 
    id: "itm-006", 
    code: "LAB-FBC", 
    name: "Full Blood Count", 
    type: "laboratory_service", 
    sellingPrice: 4500, 
    category: "Laboratory",
    active: true 
  },
  { 
    id: "itm-007", 
    code: "LAB-MP", 
    name: "Malaria Parasite Test", 
    type: "laboratory_service", 
    sellingPrice: 3000, 
    category: "Laboratory",
    active: true 
  },
  { 
    id: "itm-008", 
    code: "ADM-WARD-DEP", 
    name: "Private Ward Deposit", 
    type: "admission_fee", 
    sellingPrice: 50000, 
    category: "In-patient",
    active: true 
  },
];

const itemStore = new Map<string, POSItem>(INITIAL_ITEMS.map(i => [i.id, i]));
const INITIAL_SALES: Sale[] = [
  {
    id: "SALE-1001",
    patientId: "pat-001",
    patientName: "Hassan Bello",
    items: [
      { id: "li-001", itemId: "itm-004", name: "Paracetamol 500mg", quantity: 2, unitPrice: 50, discount: 0, total: 100 },
      { id: "li-002", itemId: "itm-001", name: "General Consultation", quantity: 1, unitPrice: 5000, discount: 0, total: 5000 }
    ],
    subtotal: 5100,
    totalDiscount: 100,
    tax: 0,
    total: 5000,
    payments: [{ method: "cash", amount: 5000 }],
    status: "completed",
    timestamp: "2026-07-27T10:15:30.000Z",
    processedBy: { id: "usr-001", name: "Dr Hugh Mann" }
  },
  {
    id: "SALE-1002",
    patientName: "Walk-in Patient",
    items: [
      { id: "li-003", itemId: "itm-005", name: "Amoxicillin 250mg", quantity: 1, unitPrice: 200, discount: 0, total: 200 },
      { id: "li-004", itemId: "itm-007", name: "Malaria Parasite Test", quantity: 1, unitPrice: 3000, discount: 0, total: 3000 }
    ],
    subtotal: 3200,
    totalDiscount: 0,
    tax: 0,
    total: 3200,
    payments: [{ method: "card", amount: 3200 }],
    status: "completed",
    timestamp: "2026-07-27T12:30:00.000Z",
    processedBy: { id: "usr-001", name: "Dr Hugh Mann" }
  },
  {
    id: "SALE-1003",
    patientId: "pat-002",
    patientName: "Fatima Yusuf",
    items: [
      { id: "li-005", itemId: "itm-002", name: "Specialist Consultation", quantity: 1, unitPrice: 15000, discount: 0, total: 15000 },
      { id: "li-006", itemId: "itm-006", name: "Full Blood Count", quantity: 1, unitPrice: 4500, discount: 0, total: 4500 }
    ],
    subtotal: 19500,
    totalDiscount: 500,
    tax: 0,
    total: 19000,
    payments: [{ method: "transfer", amount: 19000 }],
    status: "completed",
    timestamp: "2026-07-26T14:45:00.000Z",
    processedBy: { id: "usr-002", name: "Nurse Joy" }
  },
  {
    id: "SALE-1004",
    patientId: "pat-003",
    patientName: "Emeka Obi",
    items: [
      { id: "li-007", itemId: "itm-008", name: "Private Ward Deposit", quantity: 1, unitPrice: 50000, discount: 0, total: 50000 }
    ],
    subtotal: 50000,
    totalDiscount: 0,
    tax: 0,
    total: 50000,
    payments: [
      { method: "card", amount: 30000 },
      { method: "cash", amount: 20000 }
    ],
    status: "completed",
    timestamp: "2026-07-25T09:00:00.000Z",
    processedBy: { id: "usr-001", name: "Dr Hugh Mann" }
  }
];

const saleStore = new Map<string, Sale>(INITIAL_SALES.map(s => [s.id, s]));
const movements: InventoryMovement[] = [];

export const posMockRepo: POSRepository = {
  async getItems(params: POSSearchParams = {}) {
    let results = Array.from(itemStore.values());
    if (params.query) {
      const q = params.query.toLowerCase();
      results = results.filter(i => i.name.toLowerCase().includes(q) || i.code.toLowerCase().includes(q));
    }
    if (params.type && params.type !== 'all') {
      results = results.filter(i => i.type === params.type);
    }
    return results;
  },

  async getItemById(id: string) {
    return itemStore.get(id) ?? null;
  },

  async updateStock(itemId: string, adjustment: number, reason: string, actor: POSActor) {
    const item = itemStore.get(itemId);
    if (item && item.stockQuantity !== undefined) {
      item.stockQuantity += adjustment;
      movements.push({
        id: crypto.randomUUID(),
        itemId,
        type: adjustment > 0 ? "in" : "out",
        quantity: Math.abs(adjustment),
        reason,
        timestamp: new Date().toISOString(),
        userId: actor.id,
      });
    }
  },

  async getInventoryMovements(itemId: string) {
    return movements.filter(m => m.itemId === itemId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async getInventoryStats() {
    const items = Array.from(itemStore.values()).filter(i => i.stockQuantity !== undefined);
    const today = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(today.getMonth() + 3);

    return {
      totalProducts: items.length,
      lowStockItems: items.filter(i => i.stockQuantity !== undefined && i.reorderLevel !== undefined && i.stockQuantity <= i.reorderLevel && i.stockQuantity > 0).length,
      outOfStock: items.filter(i => i.stockQuantity === 0).length,
      expiringSoon: items.filter(i => 
        i.batches?.some(b => {
            const exp = new Date(b.expiryDate);
            return exp > today && exp <= threeMonthsFromNow;
        })
      ).length
    };
  },

  async getAllInventoryMovements() {
    return [...movements].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async createItem(data) {
    const id = `itm-${faker.number.int({ min: 1000, max: 9999 })}`;
    const newItem: POSItem = { ...data, id };
    itemStore.set(id, newItem);
    return newItem;
  },

  async updateItem(id, data) {
    const existing = itemStore.get(id);
    if (!existing) throw new Error("Item not found");
    const updated = { ...existing, ...data };
    itemStore.set(id, updated);
    return updated;
  },

  async createSale(data, actor) {
    const id = `SALE-${faker.number.int({ min: 1000, max: 9999 })}`;
    const sale: Sale = {
      ...data,
      id,
      timestamp: new Date().toISOString(),
      status: "completed",
    };

    // Deduct stock for medications
    for (const line of sale.items) {
      const item = itemStore.get(line.itemId);
      if (item && item.type === 'medication' && item.stockQuantity !== undefined) {
        await this.updateStock(line.itemId, -line.quantity, `Sale ${id}`, actor);
        
        // Simple FIFO for batches
        if (item.batches) {
            let remainingToDeduct = line.quantity;
            for (const batch of item.batches.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())) {
                if (remainingToDeduct <= 0) break;
                const deductFromBatch = Math.min(batch.quantity, remainingToDeduct);
                batch.quantity -= deductFromBatch;
                remainingToDeduct -= deductFromBatch;
            }
        }
      }
    }

    saleStore.set(id, sale);
    return sale;
  },

  async holdSale(data, _actor) {
    const id = `HELD-${faker.number.int({ min: 1000, max: 9999 })}`;
    const sale: Sale = {
      ...data,
      id,
      timestamp: new Date().toISOString(),
      status: "held",
    };
    saleStore.set(id, sale);
    return sale;
  },

  async getSaleById(id: string) {
    return saleStore.get(id) ?? null;
  },

  async getSales(_params = {}) {
    return Array.from(saleStore.values())
      .filter(s => s.status === 'completed')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async getHeldSales() {
    return Array.from(saleStore.values())
      .filter(s => s.status === 'held')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
};
