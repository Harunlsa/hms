pub mod commands;
pub mod db;
pub mod error;
pub mod models;
pub mod repositories;

use commands::*;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let app_data_dir = app
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| std::path::PathBuf::from("./data"));
            let db_path = app_data_dir.join("hms.db");

            log::info!("Initializing SQLite database at: {:?}", db_path);
            let pool = db::init_db(db_path).expect("Failed to initialize SQLite database");
            app.manage(pool);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_patients,
            get_patient_by_id,
            create_patient,
            update_patient,
            set_patient_status,
            add_patient_visit,
            add_patient_prescription,
            cancel_patient_prescription,
            add_patient_appointment,
            update_patient_appointment,
            cancel_patient_appointment,
            add_patient_invoice,
            add_patient_payment,
            check_duplicate_patient,
            get_next_file_number,
            is_file_number_taken,
            get_family_files,
            search_family_files,
            get_pos_items,
            get_pos_item_by_id,
            create_pos_item,
            update_pos_item,
            update_pos_stock,
            get_pos_inventory_movements,
            get_all_pos_inventory_movements,
            get_pos_inventory_stats,
            create_pos_sale,
            hold_pos_sale,
            get_pos_sale_by_id,
            get_pos_sales,
            get_pos_held_sales,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
