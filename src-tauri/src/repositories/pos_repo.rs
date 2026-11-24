use crate::error::{AppError, AppResult};
use crate::models::{
    Actor, CreatePOSItemInput, CreateSaleInput, InventoryMovement, InventoryStats, POSBatch,
    POSItem, POSPayment, POSSearchParams, ProcessedBy, Sale, SaleFilterParams, SaleLineItem,
    UpdatePOSItemInput,
};
use chrono::Utc;
use rusqlite::{params, Connection, OptionalExtension};
use uuid::Uuid;

pub struct POSRepository;

impl POSRepository {
    pub fn get_items(conn: &Connection, params: Option<POSSearchParams>) -> AppResult<Vec<POSItem>> {
        let mut query = String::from(
            "SELECT id, code, upc, name, category, selling_price, active, type, manufacturer, reorder_level, stock_quantity
             FROM pos_items
             WHERE 1=1",
        );

        let mut query_params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        if let Some(p) = params {
            if let Some(q) = p.query {
                if !q.trim().is_empty() {
                    query.push_str(" AND (LOWER(name) LIKE ? OR LOWER(code) LIKE ?)");
                    let pattern = format!("%{}%", q.to_lowercase());
                    query_params.push(Box::new(pattern.clone()));
                    query_params.push(Box::new(pattern));
                }
            }
            if let Some(cat) = p.category {
                if !cat.trim().is_empty() && cat != "All" {
                    query.push_str(" AND category = ?");
                    query_params.push(Box::new(cat));
                }
            }
            if let Some(t) = p.r#type {
                if !t.trim().is_empty() && t != "all" {
                    query.push_str(" AND type = ?");
                    query_params.push(Box::new(t));
                }
            }
        }

        query.push_str(" ORDER BY name ASC");

        let mut stmt = conn.prepare(&query)?;
        let param_refs: Vec<&dyn rusqlite::ToSql> = query_params.iter().map(|p| p.as_ref()).collect();

        let rows = stmt.query_map(param_refs.as_slice(), |row| {
            let active_int: i64 = row.get(6)?;
            Ok(POSItem {
                id: row.get(0)?,
                code: row.get(1)?,
                upc: row.get(2)?,
                name: row.get(3)?,
                category: row.get(4)?,
                selling_price: row.get(5)?,
                active: active_int == 1,
                r#type: row.get(7)?,
                manufacturer: row.get(8)?,
                reorder_level: row.get(9)?,
                stock_quantity: row.get(10)?,
                batches: None,
            })
        })?;

        let mut items = Vec::new();
        for r in rows {
            let mut item = r?;
            item.batches = Some(Self::load_batches_for_item(conn, &item.id)?);
            items.push(item);
        }

        Ok(items)
    }

    pub fn get_item_by_id(conn: &Connection, id: &str) -> AppResult<Option<POSItem>> {
        let mut stmt = conn.prepare(
            "SELECT id, code, upc, name, category, selling_price, active, type, manufacturer, reorder_level, stock_quantity
             FROM pos_items WHERE id = ?",
        )?;

        let item_opt = stmt
            .query_row(params![id], |row| {
                let active_int: i64 = row.get(6)?;
                Ok(POSItem {
                    id: row.get(0)?,
                    code: row.get(1)?,
                    upc: row.get(2)?,
                    name: row.get(3)?,
                    category: row.get(4)?,
                    selling_price: row.get(5)?,
                    active: active_int == 1,
                    r#type: row.get(7)?,
                    manufacturer: row.get(8)?,
                    reorder_level: row.get(9)?,
                    stock_quantity: row.get(10)?,
                    batches: None,
                })
            })
            .optional()?;

        let mut item = match item_opt {
            Some(i) => i,
            None => return Ok(None),
        };

        item.batches = Some(Self::load_batches_for_item(conn, id)?);
        Ok(Some(item))
    }

    pub fn create_item(conn: &mut Connection, item: CreatePOSItemInput) -> AppResult<POSItem> {
        let id = format!("itm-{}", Uuid::new_v4().simple());
        let active_int = if item.active.unwrap_or(true) { 1 } else { 0 };

        let tx = conn.transaction()?;

        tx.execute(
            "INSERT INTO pos_items (
                id, code, upc, name, category, selling_price, active, type, manufacturer, reorder_level, stock_quantity
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            params![
                id,
                item.code,
                item.upc,
                item.name,
                item.category,
                item.selling_price,
                active_int,
                item.r#type,
                item.manufacturer,
                item.reorder_level,
                item.stock_quantity
            ],
        )?;

        if let Some(batches) = item.batches {
            for b in batches {
                let b_id = if b.id.is_empty() {
                    format!("b-{}", Uuid::new_v4().simple())
                } else {
                    b.id
                };
                let created_at = if b.created_at.is_empty() {
                    Utc::now().to_rfc3339()
                } else {
                    b.created_at
                };

                tx.execute(
                    "INSERT INTO pos_batches (
                        id, item_id, batch_number, expiry_date, purchase_cost, quantity, initial_quantity, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    params![
                        b_id,
                        id,
                        b.batch_number,
                        b.expiry_date,
                        b.purchase_cost,
                        b.quantity,
                        b.initial_quantity,
                        created_at
                    ],
                )?;
            }
        }

        tx.commit()?;

        match Self::get_item_by_id(conn, &id)? {
            Some(i) => Ok(i),
            None => Err(AppError::NotFound("Created item could not be retrieved".into())),
        }
    }

    pub fn update_item(
        conn: &mut Connection,
        id: &str,
        item: UpdatePOSItemInput,
    ) -> AppResult<POSItem> {
        let mut updates = Vec::new();
        let mut query_params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        if let Some(code) = item.code {
            updates.push("code = ?");
            query_params.push(Box::new(code));
        }
        if let Some(upc) = item.upc {
            updates.push("upc = ?");
            query_params.push(Box::new(upc));
        }
        if let Some(name) = item.name {
            updates.push("name = ?");
            query_params.push(Box::new(name));
        }
        if let Some(category) = item.category {
            updates.push("category = ?");
            query_params.push(Box::new(category));
        }
        if let Some(selling_price) = item.selling_price {
            updates.push("selling_price = ?");
            query_params.push(Box::new(selling_price));
        }
        if let Some(active) = item.active {
            updates.push("active = ?");
            query_params.push(Box::new(if active { 1 } else { 0 }));
        }
        if let Some(t) = item.r#type {
            updates.push("type = ?");
            query_params.push(Box::new(t));
        }
        if let Some(manufacturer) = item.manufacturer {
            updates.push("manufacturer = ?");
            query_params.push(Box::new(manufacturer));
        }
        if let Some(reorder_level) = item.reorder_level {
            updates.push("reorder_level = ?");
            query_params.push(Box::new(reorder_level));
        }
        if let Some(stock_quantity) = item.stock_quantity {
            updates.push("stock_quantity = ?");
            query_params.push(Box::new(stock_quantity));
        }

        if !updates.is_empty() {
            query_params.push(Box::new(id.to_string()));
            let sql = format!("UPDATE pos_items SET {} WHERE id = ?", updates.join(", "));
            let param_refs: Vec<&dyn rusqlite::ToSql> = query_params.iter().map(|p| p.as_ref()).collect();
            conn.execute(&sql, param_refs.as_slice())?;
        }

        match Self::get_item_by_id(conn, id)? {
            Some(i) => Ok(i),
            None => Err(AppError::NotFound("Item not found".into())),
        }
    }

    pub fn update_stock(
        conn: &mut Connection,
        item_id: &str,
        adjustment: i64,
        reason: &str,
        actor: Actor,
    ) -> AppResult<()> {
        let now = Utc::now().to_rfc3339();
        let movement_id = format!("mov-{}", Uuid::new_v4().simple());
        let movement_type = if adjustment > 0 { "in" } else { "out" };

        let tx = conn.transaction()?;

        tx.execute(
            "UPDATE pos_items SET stock_quantity = COALESCE(stock_quantity, 0) + ? WHERE id = ?",
            params![adjustment, item_id],
        )?;

        tx.execute(
            "INSERT INTO inventory_movements (id, item_id, batch_id, type, quantity, reason, timestamp, user_id)
             VALUES (?, ?, NULL, ?, ?, ?, ?, ?)",
            params![
                movement_id,
                item_id,
                movement_type,
                adjustment.abs(),
                reason,
                now,
                actor.id
            ],
        )?;

        tx.commit()?;
        Ok(())
    }

    pub fn get_inventory_movements(
        conn: &Connection,
        item_id: &str,
    ) -> AppResult<Vec<InventoryMovement>> {
        let mut stmt = conn.prepare(
            "SELECT id, item_id, batch_id, type, quantity, reason, timestamp, user_id
             FROM inventory_movements WHERE item_id = ? ORDER BY timestamp DESC",
        )?;

        let rows = stmt.query_map(params![item_id], |row| {
            Ok(InventoryMovement {
                id: row.get(0)?,
                item_id: row.get(1)?,
                batch_id: row.get(2)?,
                r#type: row.get(3)?,
                quantity: row.get(4)?,
                reason: row.get(5)?,
                timestamp: row.get(6)?,
                user_id: row.get(7)?,
            })
        })?;

        let mut results = Vec::new();
        for r in rows {
            results.push(r?);
        }
        Ok(results)
    }

    pub fn get_all_inventory_movements(conn: &Connection) -> AppResult<Vec<InventoryMovement>> {
        let mut stmt = conn.prepare(
            "SELECT id, item_id, batch_id, type, quantity, reason, timestamp, user_id
             FROM inventory_movements ORDER BY timestamp DESC",
        )?;

        let rows = stmt.query_map([], |row| {
            Ok(InventoryMovement {
                id: row.get(0)?,
                item_id: row.get(1)?,
                batch_id: row.get(2)?,
                r#type: row.get(3)?,
                quantity: row.get(4)?,
                reason: row.get(5)?,
                timestamp: row.get(6)?,
                user_id: row.get(7)?,
            })
        })?;

        let mut results = Vec::new();
        for r in rows {
            results.push(r?);
        }
        Ok(results)
    }

    pub fn get_inventory_stats(conn: &Connection) -> AppResult<InventoryStats> {
        let total_products: i64 = conn.query_row(
            "SELECT COUNT(*) FROM pos_items WHERE stock_quantity IS NOT NULL",
            [],
            |r| r.get(0),
        )?;

        let low_stock_items: i64 = conn.query_row(
            "SELECT COUNT(*) FROM pos_items
             WHERE stock_quantity IS NOT NULL AND reorder_level IS NOT NULL
             AND stock_quantity <= reorder_level AND stock_quantity > 0",
            [],
            |r| r.get(0),
        )?;

        let out_of_stock: i64 = conn.query_row(
            "SELECT COUNT(*) FROM pos_items WHERE stock_quantity IS NOT NULL AND stock_quantity = 0",
            [],
            |r| r.get(0),
        )?;

        let expiring_soon: i64 = conn.query_row(
            "SELECT COUNT(DISTINCT item_id) FROM pos_batches
             WHERE date(expiry_date) <= date('now', '+90 days')
             AND date(expiry_date) >= date('now')",
            [],
            |r| r.get(0),
        )?;

        Ok(InventoryStats {
            total_products,
            low_stock_items,
            expiring_soon,
            out_of_stock,
        })
    }

    pub fn create_sale(
        conn: &mut Connection,
        sale_data: CreateSaleInput,
        actor: Actor,
    ) -> AppResult<Sale> {
        let sale_id = format!("SALE-{}", Uuid::new_v4().simple().to_string()[..8].to_uppercase());
        let now = Utc::now().to_rfc3339();

        let tx = conn.transaction()?;

        tx.execute(
            "INSERT INTO sales (
                id, patient_id, patient_name, subtotal, total_discount, tax, total,
                status, timestamp, processed_by_id, processed_by_name
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?)",
            params![
                sale_id,
                sale_data.patient_id,
                sale_data.patient_name,
                sale_data.subtotal,
                sale_data.total_discount,
                sale_data.tax,
                sale_data.total,
                now,
                actor.id,
                actor.name
            ],
        )?;

        for item in &sale_data.items {
            let line_id = format!("li-{}", Uuid::new_v4().simple());
            tx.execute(
                "INSERT INTO sale_line_items (id, sale_id, item_id, name, quantity, unit_price, discount, total)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                params![
                    line_id,
                    sale_id,
                    item.item_id,
                    item.name,
                    item.quantity,
                    item.unit_price,
                    item.discount,
                    item.total
                ],
            )?;

            // Check if item is a medication with stock to deduct
            let item_type_opt: Option<(String, Option<i64>)> = tx
                .query_row(
                    "SELECT type, stock_quantity FROM pos_items WHERE id = ?",
                    params![item.item_id],
                    |r| Ok((r.get(0)?, r.get(1)?)),
                )
                .optional()?;

            if let Some((item_type, stock_qty)) = item_type_opt {
                if item_type == "medication" && stock_qty.is_some() {
                    // Update overall stock
                    tx.execute(
                        "UPDATE pos_items SET stock_quantity = stock_quantity - ? WHERE id = ?",
                        params![item.quantity, item.item_id],
                    )?;

                    // Log movement
                    let mov_id = format!("mov-{}", Uuid::new_v4().simple());
                    tx.execute(
                        "INSERT INTO inventory_movements (id, item_id, batch_id, type, quantity, reason, timestamp, user_id)
                         VALUES (?, ?, NULL, 'out', ?, ?, ?, ?)",
                        params![
                            mov_id,
                            item.item_id,
                            item.quantity,
                            format!("Sale {}", sale_id),
                            now,
                            actor.id
                        ],
                    )?;

                    // FIFO batch deduction
                    let mut remaining = item.quantity;
                    let mut batch_stmt = tx.prepare(
                        "SELECT id, quantity FROM pos_batches WHERE item_id = ? AND quantity > 0 ORDER BY expiry_date ASC",
                    )?;
                    let batches: Vec<(String, i64)> = batch_stmt
                        .query_map(params![item.item_id], |r| Ok((r.get(0)?, r.get(1)?)))?
                        .filter_map(|r| r.ok())
                        .collect();

                    for (batch_id, batch_qty) in batches {
                        if remaining <= 0 {
                            break;
                        }
                        let deduct = remaining.min(batch_qty);
                        tx.execute(
                            "UPDATE pos_batches SET quantity = quantity - ? WHERE id = ?",
                            params![deduct, batch_id],
                        )?;
                        remaining -= deduct;
                    }
                }
            }
        }

        for payment in &sale_data.payments {
            let pay_id = format!("sp-{}", Uuid::new_v4().simple());
            tx.execute(
                "INSERT INTO sale_payments (id, sale_id, method, amount, reference)
                 VALUES (?, ?, ?, ?, ?)",
                params![pay_id, sale_id, payment.method, payment.amount, payment.reference],
            )?;
        }

        tx.commit()?;

        match Self::get_sale_by_id(conn, &sale_id)? {
            Some(s) => Ok(s),
            None => Err(AppError::NotFound("Created sale could not be found".into())),
        }
    }

    pub fn hold_sale(
        conn: &mut Connection,
        sale_data: CreateSaleInput,
        actor: Actor,
    ) -> AppResult<Sale> {
        let sale_id = format!("HELD-{}", Uuid::new_v4().simple().to_string()[..8].to_uppercase());
        let now = Utc::now().to_rfc3339();

        let tx = conn.transaction()?;

        tx.execute(
            "INSERT INTO sales (
                id, patient_id, patient_name, subtotal, total_discount, tax, total,
                status, timestamp, processed_by_id, processed_by_name
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'held', ?, ?, ?)",
            params![
                sale_id,
                sale_data.patient_id,
                sale_data.patient_name,
                sale_data.subtotal,
                sale_data.total_discount,
                sale_data.tax,
                sale_data.total,
                now,
                actor.id,
                actor.name
            ],
        )?;

        for item in &sale_data.items {
            let line_id = format!("li-{}", Uuid::new_v4().simple());
            tx.execute(
                "INSERT INTO sale_line_items (id, sale_id, item_id, name, quantity, unit_price, discount, total)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                params![
                    line_id,
                    sale_id,
                    item.item_id,
                    item.name,
                    item.quantity,
                    item.unit_price,
                    item.discount,
                    item.total
                ],
            )?;
        }

        for payment in &sale_data.payments {
            let pay_id = format!("sp-{}", Uuid::new_v4().simple());
            tx.execute(
                "INSERT INTO sale_payments (id, sale_id, method, amount, reference)
                 VALUES (?, ?, ?, ?, ?)",
                params![pay_id, sale_id, payment.method, payment.amount, payment.reference],
            )?;
        }

        tx.commit()?;

        match Self::get_sale_by_id(conn, &sale_id)? {
            Some(s) => Ok(s),
            None => Err(AppError::NotFound("Held sale could not be found".into())),
        }
    }

    pub fn get_sale_by_id(conn: &Connection, id: &str) -> AppResult<Option<Sale>> {
        let mut stmt = conn.prepare(
            "SELECT id, patient_id, patient_name, subtotal, total_discount, tax, total,
                    status, timestamp, processed_by_id, processed_by_name
             FROM sales WHERE id = ?",
        )?;

        let sale_opt = stmt
            .query_row(params![id], |row| {
                Ok(Sale {
                    id: row.get(0)?,
                    patient_id: row.get(1)?,
                    patient_name: row.get(2)?,
                    items: Vec::new(),
                    subtotal: row.get(3)?,
                    total_discount: row.get(4)?,
                    tax: row.get(5)?,
                    total: row.get(6)?,
                    payments: Vec::new(),
                    status: row.get(7)?,
                    timestamp: row.get(8)?,
                    processed_by: ProcessedBy {
                        id: row.get(9)?,
                        name: row.get(10)?,
                    },
                })
            })
            .optional()?;

        let mut sale = match sale_opt {
            Some(s) => s,
            None => return Ok(None),
        };

        // Load items
        let mut item_stmt = conn.prepare(
            "SELECT id, item_id, name, quantity, unit_price, discount, total
             FROM sale_line_items WHERE sale_id = ?",
        )?;
        let items = item_stmt.query_map(params![id], |r| {
            Ok(SaleLineItem {
                id: r.get(0)?,
                item_id: r.get(1)?,
                name: r.get(2)?,
                quantity: r.get(3)?,
                unit_price: r.get(4)?,
                discount: r.get(5)?,
                total: r.get(6)?,
            })
        })?;
        for i in items {
            sale.items.push(i?);
        }

        // Load payments
        let mut pay_stmt = conn.prepare(
            "SELECT method, amount, reference FROM sale_payments WHERE sale_id = ?",
        )?;
        let payments = pay_stmt.query_map(params![id], |r| {
            Ok(POSPayment {
                method: r.get(0)?,
                amount: r.get(1)?,
                reference: r.get(2)?,
            })
        })?;
        for p in payments {
            sale.payments.push(p?);
        }

        Ok(Some(sale))
    }

    pub fn get_sales(conn: &Connection, params: Option<SaleFilterParams>) -> AppResult<Vec<Sale>> {
        let mut query = String::from(
            "SELECT id, patient_id, patient_name, subtotal, total_discount, tax, total,
                    status, timestamp, processed_by_id, processed_by_name
             FROM sales
             WHERE status = 'completed'",
        );

        let mut query_params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        if let Some(p) = params {
            if let Some(patient_id) = p.patient_id {
                query.push_str(" AND patient_id = ?");
                query_params.push(Box::new(patient_id));
            }
            if let Some(start) = p.start_date {
                query.push_str(" AND timestamp >= ?");
                query_params.push(Box::new(start));
            }
            if let Some(end) = p.end_date {
                query.push_str(" AND timestamp <= ?");
                query_params.push(Box::new(end));
            }
        }

        query.push_str(" ORDER BY timestamp DESC");

        let mut stmt = conn.prepare(&query)?;
        let param_refs: Vec<&dyn rusqlite::ToSql> = query_params.iter().map(|p| p.as_ref()).collect();

        let sales_rows = stmt.query_map(param_refs.as_slice(), |row| {
            Ok(Sale {
                id: row.get(0)?,
                patient_id: row.get(1)?,
                patient_name: row.get(2)?,
                items: Vec::new(),
                subtotal: row.get(3)?,
                total_discount: row.get(4)?,
                tax: row.get(5)?,
                total: row.get(6)?,
                payments: Vec::new(),
                status: row.get(7)?,
                timestamp: row.get(8)?,
                processed_by: ProcessedBy {
                    id: row.get(9)?,
                    name: row.get(10)?,
                },
            })
        })?;

        let mut sales = Vec::new();
        for r in sales_rows {
            let mut sale = r?;
            // Populate items
            let mut item_stmt = conn.prepare(
                "SELECT id, item_id, name, quantity, unit_price, discount, total
                 FROM sale_line_items WHERE sale_id = ?",
            )?;
            let item_rows = item_stmt.query_map(params![sale.id], |ir| {
                Ok(SaleLineItem {
                    id: ir.get(0)?,
                    item_id: ir.get(1)?,
                    name: ir.get(2)?,
                    quantity: ir.get(3)?,
                    unit_price: ir.get(4)?,
                    discount: ir.get(5)?,
                    total: ir.get(6)?,
                })
            })?;
            for item in item_rows {
                sale.items.push(item?);
            }

            // Populate payments
            let mut pay_stmt = conn.prepare(
                "SELECT method, amount, reference FROM sale_payments WHERE sale_id = ?",
            )?;
            let pay_rows = pay_stmt.query_map(params![sale.id], |pr| {
                Ok(POSPayment {
                    method: pr.get(0)?,
                    amount: pr.get(1)?,
                    reference: pr.get(2)?,
                })
            })?;
            for pay in pay_rows {
                sale.payments.push(pay?);
            }

            sales.push(sale);
        }

        Ok(sales)
    }

    pub fn get_held_sales(conn: &Connection) -> AppResult<Vec<Sale>> {
        let mut stmt = conn.prepare(
            "SELECT id, patient_id, patient_name, subtotal, total_discount, tax, total,
                    status, timestamp, processed_by_id, processed_by_name
             FROM sales WHERE status = 'held' ORDER BY timestamp DESC",
        )?;

        let sales_rows = stmt.query_map([], |row| {
            Ok(Sale {
                id: row.get(0)?,
                patient_id: row.get(1)?,
                patient_name: row.get(2)?,
                items: Vec::new(),
                subtotal: row.get(3)?,
                total_discount: row.get(4)?,
                tax: row.get(5)?,
                total: row.get(6)?,
                payments: Vec::new(),
                status: row.get(7)?,
                timestamp: row.get(8)?,
                processed_by: ProcessedBy {
                    id: row.get(9)?,
                    name: row.get(10)?,
                },
            })
        })?;

        let mut sales = Vec::new();
        for r in sales_rows {
            let mut sale = r?;
            let mut item_stmt = conn.prepare(
                "SELECT id, item_id, name, quantity, unit_price, discount, total
                 FROM sale_line_items WHERE sale_id = ?",
            )?;
            let item_rows = item_stmt.query_map(params![sale.id], |ir| {
                Ok(SaleLineItem {
                    id: ir.get(0)?,
                    item_id: ir.get(1)?,
                    name: ir.get(2)?,
                    quantity: ir.get(3)?,
                    unit_price: ir.get(4)?,
                    discount: ir.get(5)?,
                    total: ir.get(6)?,
                })
            })?;
            for item in item_rows {
                sale.items.push(item?);
            }

            let mut pay_stmt = conn.prepare(
                "SELECT method, amount, reference FROM sale_payments WHERE sale_id = ?",
            )?;
            let pay_rows = pay_stmt.query_map(params![sale.id], |pr| {
                Ok(POSPayment {
                    method: pr.get(0)?,
                    amount: pr.get(1)?,
                    reference: pr.get(2)?,
                })
            })?;
            for pay in pay_rows {
                sale.payments.push(pay?);
            }

            sales.push(sale);
        }

        Ok(sales)
    }

    fn load_batches_for_item(conn: &Connection, item_id: &str) -> AppResult<Vec<POSBatch>> {
        let mut stmt = conn.prepare(
            "SELECT id, batch_number, expiry_date, purchase_cost, quantity, initial_quantity, created_at
             FROM pos_batches WHERE item_id = ? ORDER BY expiry_date ASC",
        )?;

        let rows = stmt.query_map(params![item_id], |row| {
            Ok(POSBatch {
                id: row.get(0)?,
                batch_number: row.get(1)?,
                expiry_date: row.get(2)?,
                purchase_cost: row.get(3)?,
                quantity: row.get(4)?,
                initial_quantity: row.get(5)?,
                created_at: row.get(6)?,
            })
        })?;

        let mut batches = Vec::new();
        for r in rows {
            batches.push(r?);
        }
        Ok(batches)
    }
}
