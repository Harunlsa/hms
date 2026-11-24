use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct POSBatch {
    pub id: String,
    pub batch_number: String,
    pub expiry_date: String,
    pub purchase_cost: f64,
    pub quantity: i64,
    pub initial_quantity: i64,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct POSItem {
    pub id: String,
    pub code: String,
    pub upc: Option<String>,
    pub name: String,
    pub category: String,
    pub selling_price: f64,
    pub active: bool,
    pub r#type: String, // "medication", "laboratory_service", "consultation", etc.
    pub manufacturer: Option<String>,
    pub reorder_level: Option<i64>,
    pub stock_quantity: Option<i64>,
    pub batches: Option<Vec<POSBatch>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaleLineItem {
    pub id: String,
    pub item_id: String,
    pub name: String,
    pub quantity: i64,
    pub unit_price: f64,
    pub discount: f64,
    pub total: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct POSPayment {
    pub method: String, // "cash" | "card" | "transfer"
    pub amount: f64,
    pub reference: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessedBy {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Sale {
    pub id: String,
    pub patient_id: Option<String>,
    pub patient_name: Option<String>,
    pub items: Vec<SaleLineItem>,
    pub subtotal: f64,
    pub total_discount: f64,
    pub tax: f64,
    pub total: f64,
    pub payments: Vec<POSPayment>,
    pub status: String, // "completed" | "held" | "cancelled"
    pub timestamp: String,
    pub processed_by: ProcessedBy,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InventoryMovement {
    pub id: String,
    pub item_id: String,
    pub batch_id: Option<String>,
    pub r#type: String, // "in" | "out" | "adjustment"
    pub quantity: i64,
    pub reason: String,
    pub timestamp: String,
    pub user_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InventoryStats {
    pub total_products: i64,
    pub low_stock_items: i64,
    pub expiring_soon: i64,
    pub out_of_stock: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct POSSearchParams {
    pub query: Option<String>,
    pub category: Option<String>,
    pub r#type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePOSItemInput {
    pub code: String,
    pub upc: Option<String>,
    pub name: String,
    pub category: String,
    pub selling_price: f64,
    pub active: Option<bool>,
    pub r#type: String,
    pub manufacturer: Option<String>,
    pub reorder_level: Option<i64>,
    pub stock_quantity: Option<i64>,
    pub batches: Option<Vec<POSBatch>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePOSItemInput {
    pub code: Option<String>,
    pub upc: Option<String>,
    pub name: Option<String>,
    pub category: Option<String>,
    pub selling_price: Option<f64>,
    pub active: Option<bool>,
    pub r#type: Option<String>,
    pub manufacturer: Option<String>,
    pub reorder_level: Option<i64>,
    pub stock_quantity: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSaleLineItemInput {
    pub item_id: String,
    pub name: String,
    pub quantity: i64,
    pub unit_price: f64,
    pub discount: f64,
    pub total: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSaleInput {
    pub patient_id: Option<String>,
    pub patient_name: Option<String>,
    pub items: Vec<CreateSaleLineItemInput>,
    pub subtotal: f64,
    pub total_discount: f64,
    pub tax: f64,
    pub total: f64,
    pub payments: Vec<POSPayment>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SaleFilterParams {
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub patient_id: Option<String>,
}
