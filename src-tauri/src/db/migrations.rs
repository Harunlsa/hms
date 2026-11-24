use rusqlite::{Connection, Result};

pub fn run_migrations(conn: &mut Connection) -> Result<()> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS family_files (
            id TEXT PRIMARY KEY,
            file_number TEXT UNIQUE NOT NULL,
            head_name TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS patients (
            id TEXT PRIMARY KEY,
            file_number TEXT UNIQUE NOT NULL,
            file_type TEXT NOT NULL,
            family_file_id TEXT,
            name TEXT NOT NULL,
            date_of_birth TEXT NOT NULL,
            gender TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            address TEXT,
            conditions_json TEXT NOT NULL DEFAULT '[]',
            allergies_json TEXT NOT NULL DEFAULT '[]',
            blood_group TEXT,
            upcoming_appointment TEXT,
            status TEXT NOT NULL DEFAULT 'active',
            created_at TEXT NOT NULL,
            updated_at TEXT,
            FOREIGN KEY (family_file_id) REFERENCES family_files (id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS emergency_contacts (
            id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            relationship TEXT NOT NULL,
            FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS patient_audit_logs (
            id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            user_id TEXT NOT NULL,
            user_name TEXT NOT NULL,
            action TEXT NOT NULL,
            changes_json TEXT,
            source TEXT NOT NULL DEFAULT 'UI',
            FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS visits (
            id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL,
            date TEXT NOT NULL,
            doctor_name TEXT NOT NULL,
            doctor_id TEXT NOT NULL,
            reason TEXT NOT NULL,
            summary TEXT NOT NULL,
            status TEXT NOT NULL,
            type TEXT NOT NULL,
            notes TEXT NOT NULL,
            diagnosis TEXT NOT NULL,
            observations TEXT NOT NULL,
            FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS prescriptions (
            id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL,
            visit_id TEXT,
            medicine TEXT NOT NULL,
            dosage TEXT NOT NULL,
            frequency TEXT NOT NULL,
            duration TEXT NOT NULL,
            notes TEXT,
            status TEXT NOT NULL,
            issued_date TEXT NOT NULL,
            prescribing_doctor TEXT NOT NULL,
            FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE,
            FOREIGN KEY (visit_id) REFERENCES visits (id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS appointments (
            id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL,
            date TEXT NOT NULL,
            doctor_id TEXT NOT NULL,
            doctor_name TEXT NOT NULL,
            reason TEXT NOT NULL,
            status TEXT NOT NULL,
            location TEXT,
            notes TEXT,
            FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS invoices (
            id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL,
            visit_id TEXT,
            date TEXT NOT NULL,
            amount REAL NOT NULL,
            paid_amount REAL NOT NULL,
            status TEXT NOT NULL,
            FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS invoice_items (
            id TEXT PRIMARY KEY,
            invoice_id TEXT NOT NULL,
            description TEXT NOT NULL,
            amount REAL NOT NULL,
            FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS payments (
            id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL,
            invoice_id TEXT,
            date TEXT NOT NULL,
            amount REAL NOT NULL,
            method TEXT NOT NULL,
            reference TEXT,
            FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE,
            FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE SET NULL
        );

        -- POS & Inventory Tables
        CREATE TABLE IF NOT EXISTS pos_items (
            id TEXT PRIMARY KEY,
            code TEXT UNIQUE NOT NULL,
            upc TEXT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            selling_price REAL NOT NULL,
            active INTEGER NOT NULL DEFAULT 1,
            type TEXT NOT NULL,
            manufacturer TEXT,
            reorder_level INTEGER,
            stock_quantity INTEGER
        );

        CREATE TABLE IF NOT EXISTS pos_batches (
            id TEXT PRIMARY KEY,
            item_id TEXT NOT NULL,
            batch_number TEXT NOT NULL,
            expiry_date TEXT NOT NULL,
            purchase_cost REAL NOT NULL,
            quantity INTEGER NOT NULL,
            initial_quantity INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (item_id) REFERENCES pos_items (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS inventory_movements (
            id TEXT PRIMARY KEY,
            item_id TEXT NOT NULL,
            batch_id TEXT,
            type TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            reason TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            user_id TEXT NOT NULL,
            FOREIGN KEY (item_id) REFERENCES pos_items (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS sales (
            id TEXT PRIMARY KEY,
            patient_id TEXT,
            patient_name TEXT,
            subtotal REAL NOT NULL,
            total_discount REAL NOT NULL,
            tax REAL NOT NULL,
            total REAL NOT NULL,
            status TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            processed_by_id TEXT NOT NULL,
            processed_by_name TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sale_line_items (
            id TEXT PRIMARY KEY,
            sale_id TEXT NOT NULL,
            item_id TEXT NOT NULL,
            name TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price REAL NOT NULL,
            discount REAL NOT NULL,
            total REAL NOT NULL,
            FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS sale_payments (
            id TEXT PRIMARY KEY,
            sale_id TEXT NOT NULL,
            method TEXT NOT NULL,
            amount REAL NOT NULL,
            reference TEXT,
            FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE
        );

        -- Indexes for performance
        CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);
        CREATE INDEX IF NOT EXISTS idx_patients_file_number ON patients(file_number);
        CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
        CREATE INDEX IF NOT EXISTS idx_pos_items_code ON pos_items(code);
        CREATE INDEX IF NOT EXISTS idx_sales_timestamp ON sales(timestamp);
        "
    )?;

    seed_initial_data(conn)?;

    Ok(())
}

fn seed_initial_data(conn: &mut Connection) -> Result<()> {
    // Check if patients table is empty
    let count: i64 = conn.query_row("SELECT COUNT(*) FROM patients", [], |r| r.get(0))?;
    if count == 0 {
        // Seed Family Files
        conn.execute(
            "INSERT INTO family_files (id, file_number, head_name, created_at) VALUES 
             ('fam-001', 'FAM-100001', 'Abdullahi Family', '2026-01-15T08:00:00Z'),
             ('fam-002', 'FAM-100002', 'Ibrahim Family', '2026-02-10T09:30:00Z'),
             ('fam-003', 'FAM-100003', 'Musa Family', '2026-03-01T11:00:00Z')",
            [],
        )?;

        // Seed Initial Patients
        conn.execute(
            "INSERT INTO patients (
                id, file_number, file_type, family_file_id, name, date_of_birth, gender,
                phone, email, address, conditions_json, allergies_json, blood_group,
                status, created_at
            ) VALUES 
            (
                'pat-001', 'HMS-2026-0001', 'individual', NULL, 'Hassan Bello', '1988-04-12', 'male',
                '+234 803 123 4567', 'hassan.bello@example.com', '12 Hospital Road, Kaduna',
                '[\"Hypertension\"]', '[\"Penicillin\"]', 'O+',
                'active', '2026-01-10T10:00:00Z'
            ),
            (
                'pat-002', 'HMS-2026-0002', 'family', 'fam-001', 'Fatima Yusuf', '1995-08-23', 'female',
                '+234 802 987 6543', 'fatima.yusuf@example.com', '44 Victoria Island, Lagos',
                '[\"Asthma\"]', '[\"Sulfa Drugs\"]', 'A+',
                'active', '2026-01-18T14:30:00Z'
            ),
            (
                'pat-003', 'HMS-2026-0003', 'individual', NULL, 'Emeka Obi', '1976-11-05', 'male',
                '+234 818 555 0192', 'emeka.obi@example.com', '7 Independence Layout, Enugu',
                '[\"Type 2 Diabetes\"]', '[]', 'B+',
                'active', '2026-02-05T09:15:00Z'
            )",
            [],
        )?;

        // Seed Emergency Contacts
        conn.execute(
            "INSERT INTO emergency_contacts (id, patient_id, name, phone, relationship) VALUES
             ('ec-001', 'pat-001', 'Amina Bello', '+234 803 999 8888', 'Spouse'),
             ('ec-002', 'pat-002', 'Usman Yusuf', '+234 802 111 2222', 'Brother')",
            [],
        )?;

        // Seed Sample Visits
        conn.execute(
            "INSERT INTO visits (
                id, patient_id, date, doctor_name, doctor_id, reason, summary, status,
                type, notes, diagnosis, observations
            ) VALUES (
                'vis-001', 'pat-001', '2026-07-20T10:30:00Z', 'Dr. Hugh Mann', 'usr-001',
                'Routine Hypertension Checkup', 'BP well controlled on current regimen', 'completed',
                'consultation', 'Continue current medications and follow low-salt diet',
                'Essential Hypertension (Controlled)', 'BP: 125/82 mmHg, Pulse: 72 bpm'
            )",
            [],
        )?;
    }

    // Check if pos_items table is empty
    let item_count: i64 = conn.query_row("SELECT COUNT(*) FROM pos_items", [], |r| r.get(0))?;
    if item_count == 0 {
        conn.execute(
            "INSERT INTO pos_items (
                id, code, upc, name, category, selling_price, active, type, manufacturer, reorder_level, stock_quantity
            ) VALUES 
            ('itm-001', 'CONS-GEN', NULL, 'General Consultation', 'Clinical', 5000.0, 1, 'consultation', NULL, NULL, NULL),
            ('itm-002', 'CONS-SPEC', NULL, 'Specialist Consultation', 'Clinical', 15000.0, 1, 'consultation', NULL, NULL, NULL),
            ('itm-003', 'ADM-FILE', NULL, 'New File Opening Fee', 'Admin', 2500.0, 1, 'administrative_fee', NULL, NULL, NULL),
            ('itm-004', 'MED-PA-500', '6151100001234', 'Paracetamol 500mg', 'Pharmacy', 50.0, 1, 'medication', 'Emzor Pharmaceuticals', 100, 500),
            ('itm-005', 'MED-AM-250', '6151100005678', 'Amoxicillin 250mg', 'Pharmacy', 200.0, 1, 'medication', 'GlaxoSmithKline', 50, 120),
            ('itm-006', 'LAB-FBC', NULL, 'Full Blood Count', 'Laboratory', 4500.0, 1, 'laboratory_service', NULL, NULL, NULL),
            ('itm-007', 'LAB-MP', NULL, 'Malaria Parasite Test', 'Laboratory', 3000.0, 1, 'laboratory_service', NULL, NULL, NULL),
            ('itm-008', 'ADM-WARD-DEP', NULL, 'Private Ward Deposit', 'In-patient', 50000.0, 1, 'admission_fee', NULL, NULL, NULL)",
            [],
        )?;

        // Seed batches for medications
        conn.execute(
            "INSERT INTO pos_batches (
                id, item_id, batch_number, expiry_date, purchase_cost, quantity, initial_quantity, created_at
            ) VALUES 
            ('b-001', 'itm-004', 'BN12345', '2026-12-31', 35.0, 300, 500, '2024-01-01'),
            ('b-002', 'itm-004', 'BN67890', '2025-06-30', 38.0, 200, 300, '2024-03-01'),
            ('b-003', 'itm-005', 'AMX9988', '2026-08-15', 140.0, 120, 200, '2024-02-15')",
            [],
        )?;
    }

    Ok(())
}
