export type POSItemType = 
  | "medication" 
  | "laboratory_service" 
  | "consultation" 
  | "administrative_fee" 
  | "admission_fee";

export interface POSBatch {
  id: string;
  batchNumber: string;
  expiryDate: string;
  purchaseCost: number;
  quantity: number;
  initialQuantity: number;
  createdAt: string;
}

export interface POSItem {
  id: string;
  code: string; // SKU / Internal Code
  upc?: string; // Universal Product Code / Barcode
  name: string;
  category: string;
  sellingPrice: number;
  active: boolean;
  type: POSItemType;
  
  // Inventory fields (primarily for medications)
  manufacturer?: string;
  reorderLevel?: number;
  stockQuantity?: number; // Total across all batches
  batches?: POSBatch[];
}

export interface SaleLineItem {
  id: string;
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export type POSPaymentMethod = "cash" | "card" | "transfer";

export interface POSPayment {
  method: POSPaymentMethod;
  amount: number;
  reference?: string;
}

export type SaleStatus = "completed" | "held" | "cancelled";

export interface Sale {
  id: string;
  patientId?: string; // Optional for walk-in
  patientName?: string;
  items: SaleLineItem[];
  subtotal: number;
  totalDiscount: number;
  tax: number;
  total: number;
  payments: POSPayment[];
  status: SaleStatus;
  timestamp: string;
  processedBy: {
    id: string;
    name: string;
  };
}

export interface InventoryMovement {
  id: string;
  itemId: string;
  batchId?: string;
  type: "in" | "out" | "adjustment";
  quantity: number;
  reason: string; // e.g., "Sale SALE-1234", "Restock", "Expiry Adjustment"
  timestamp: string;
  userId: string;
}

export interface InventoryStats {
  totalProducts: number;
  lowStockItems: number;
  expiringSoon: number;
  outOfStock: number;
}
