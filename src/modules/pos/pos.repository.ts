import { POSItem, Sale, InventoryMovement, InventoryStats } from "./types/pos.types";

export interface POSSearchParams {
  query?: string;
  category?: string;
  type?: string;
}

export interface POSActor {
  id: string;
  name: string;
}

export interface POSRepository {
  // Items & Inventory
  getItems(params?: POSSearchParams): Promise<POSItem[]>;
  getItemById(id: string): Promise<POSItem | null>;
  updateStock(itemId: string, adjustment: number, reason: string, actor: POSActor): Promise<void>;
  getInventoryMovements(itemId: string): Promise<InventoryMovement[]>;
  getInventoryStats(): Promise<InventoryStats>;
  getAllInventoryMovements(): Promise<InventoryMovement[]>;
  
  // Catalogue Management
  createItem(item: Omit<POSItem, "id">): Promise<POSItem>;
  updateItem(id: string, item: Partial<POSItem>): Promise<POSItem>;
  
  // Sales
  createSale(sale: Omit<Sale, "id" | "timestamp">, actor: POSActor): Promise<Sale>;
  getSaleById(id: string): Promise<Sale | null>;
  getSales(params?: { startDate?: string; endDate?: string; patientId?: string }): Promise<Sale[]>;
  
  // Held Sales
  holdSale(sale: Omit<Sale, "id" | "timestamp" | "status">, actor: POSActor): Promise<Sale>;
  getHeldSales(): Promise<Sale[]>;
}
