import { invoke } from "@tauri-apps/api/core";
import {
  POSItem,
  Sale,
  InventoryMovement,
  InventoryStats,
} from "../types/pos.types";
import {
  POSRepository,
  POSSearchParams,
  POSActor,
} from "../pos.repository";
import { posMockRepo } from "../pos.mock";

const isTauri = (): boolean =>
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export const posApi: POSRepository = {
  async getItems(params?: POSSearchParams): Promise<POSItem[]> {
    if (!isTauri()) return posMockRepo.getItems(params);
    return invoke<POSItem[]>("get_pos_items", { params });
  },

  async getItemById(id: string): Promise<POSItem | null> {
    if (!isTauri()) return posMockRepo.getItemById(id);
    return invoke<POSItem | null>("get_pos_item_by_id", { id });
  },

  async updateStock(
    itemId: string,
    adjustment: number,
    reason: string,
    actor: POSActor,
  ): Promise<void> {
    if (!isTauri()) return posMockRepo.updateStock(itemId, adjustment, reason, actor);
    return invoke<void>("update_pos_stock", {
      itemId,
      adjustment,
      reason,
      actor,
    });
  },

  async getInventoryMovements(itemId: string): Promise<InventoryMovement[]> {
    if (!isTauri()) return posMockRepo.getInventoryMovements(itemId);
    return invoke<InventoryMovement[]>("get_pos_inventory_movements", { itemId });
  },

  async getInventoryStats(): Promise<InventoryStats> {
    if (!isTauri()) return posMockRepo.getInventoryStats();
    return invoke<InventoryStats>("get_pos_inventory_stats");
  },

  async getAllInventoryMovements(): Promise<InventoryMovement[]> {
    if (!isTauri()) return posMockRepo.getAllInventoryMovements();
    return invoke<InventoryMovement[]>("get_all_pos_inventory_movements");
  },

  async createItem(item: Omit<POSItem, "id">): Promise<POSItem> {
    if (!isTauri()) return posMockRepo.createItem(item);
    return invoke<POSItem>("create_pos_item", { item });
  },

  async updateItem(id: string, item: Partial<POSItem>): Promise<POSItem> {
    if (!isTauri()) return posMockRepo.updateItem(id, item);
    return invoke<POSItem>("update_pos_item", { id, item });
  },

  async createSale(
    sale: Omit<Sale, "id" | "timestamp">,
    actor: POSActor,
  ): Promise<Sale> {
    if (!isTauri()) return posMockRepo.createSale(sale, actor);
    return invoke<Sale>("create_pos_sale", { sale, actor });
  },

  async holdSale(
    sale: Omit<Sale, "id" | "timestamp" | "status">,
    actor: POSActor,
  ): Promise<Sale> {
    if (!isTauri()) return posMockRepo.holdSale(sale, actor);
    return invoke<Sale>("hold_pos_sale", { sale, actor });
  },

  async getSaleById(id: string): Promise<Sale | null> {
    if (!isTauri()) return posMockRepo.getSaleById(id);
    return invoke<Sale | null>("get_pos_sale_by_id", { id });
  },

  async getSales(params?: {
    startDate?: string;
    endDate?: string;
    patientId?: string;
  }): Promise<Sale[]> {
    if (!isTauri()) return posMockRepo.getSales(params);
    return invoke<Sale[]>("get_pos_sales", { params });
  },

  async getHeldSales(): Promise<Sale[]> {
    if (!isTauri()) return posMockRepo.getHeldSales();
    return invoke<Sale[]>("get_pos_held_sales");
  },
};
