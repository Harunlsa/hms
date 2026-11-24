use crate::db::DbPool;
use crate::error::AppError;
use crate::models::{
    Actor, CreatePOSItemInput, CreateSaleInput, InventoryMovement, InventoryStats, POSItem,
    POSSearchParams, Sale, SaleFilterParams, UpdatePOSItemInput,
};
use crate::repositories::POSRepository;
use tauri::State;

#[tauri::command]
pub fn get_pos_items(
    pool: State<DbPool>,
    params: Option<POSSearchParams>,
) -> Result<Vec<POSItem>, AppError> {
    let conn = pool.get()?;
    POSRepository::get_items(&conn, params)
}

#[tauri::command]
pub fn get_pos_item_by_id(pool: State<DbPool>, id: String) -> Result<Option<POSItem>, AppError> {
    let conn = pool.get()?;
    POSRepository::get_item_by_id(&conn, &id)
}

#[tauri::command]
pub fn create_pos_item(
    pool: State<DbPool>,
    item: CreatePOSItemInput,
) -> Result<POSItem, AppError> {
    let mut conn = pool.get()?;
    POSRepository::create_item(&mut conn, item)
}

#[tauri::command]
pub fn update_pos_item(
    pool: State<DbPool>,
    id: String,
    item: UpdatePOSItemInput,
) -> Result<POSItem, AppError> {
    let mut conn = pool.get()?;
    POSRepository::update_item(&mut conn, &id, item)
}

#[tauri::command]
pub fn update_pos_stock(
    pool: State<DbPool>,
    item_id: String,
    adjustment: i64,
    reason: String,
    actor: Actor,
) -> Result<(), AppError> {
    let mut conn = pool.get()?;
    POSRepository::update_stock(&mut conn, &item_id, adjustment, &reason, actor)
}

#[tauri::command]
pub fn get_pos_inventory_movements(
    pool: State<DbPool>,
    item_id: String,
) -> Result<Vec<InventoryMovement>, AppError> {
    let conn = pool.get()?;
    POSRepository::get_inventory_movements(&conn, &item_id)
}

#[tauri::command]
pub fn get_all_pos_inventory_movements(
    pool: State<DbPool>,
) -> Result<Vec<InventoryMovement>, AppError> {
    let conn = pool.get()?;
    POSRepository::get_all_inventory_movements(&conn)
}

#[tauri::command]
pub fn get_pos_inventory_stats(pool: State<DbPool>) -> Result<InventoryStats, AppError> {
    let conn = pool.get()?;
    POSRepository::get_inventory_stats(&conn)
}

#[tauri::command]
pub fn create_pos_sale(
    pool: State<DbPool>,
    sale: CreateSaleInput,
    actor: Actor,
) -> Result<Sale, AppError> {
    let mut conn = pool.get()?;
    POSRepository::create_sale(&mut conn, sale, actor)
}

#[tauri::command]
pub fn hold_pos_sale(
    pool: State<DbPool>,
    sale: CreateSaleInput,
    actor: Actor,
) -> Result<Sale, AppError> {
    let mut conn = pool.get()?;
    POSRepository::hold_sale(&mut conn, sale, actor)
}

#[tauri::command]
pub fn get_pos_sale_by_id(pool: State<DbPool>, id: String) -> Result<Option<Sale>, AppError> {
    let conn = pool.get()?;
    POSRepository::get_sale_by_id(&conn, &id)
}

#[tauri::command]
pub fn get_pos_sales(
    pool: State<DbPool>,
    params: Option<SaleFilterParams>,
) -> Result<Vec<Sale>, AppError> {
    let conn = pool.get()?;
    POSRepository::get_sales(&conn, params)
}

#[tauri::command]
pub fn get_pos_held_sales(pool: State<DbPool>) -> Result<Vec<Sale>, AppError> {
    let conn = pool.get()?;
    POSRepository::get_held_sales(&conn)
}
