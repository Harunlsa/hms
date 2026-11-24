use crate::error::{AppError, AppResult};
use crate::models::{
    Actor, Appointment, AuditEntry, CreateAppointmentInput, CreateInvoiceInput, CreatePaymentInput,
    CreatePrescriptionInput, CreateVisitInput, EmergencyContact, FamilyFile, Invoice, InvoiceItem,
    Patient, PatientSearchParams, Payment, Prescription, RegisterPatientInput,
    UpdateAppointmentInput, UpdatePatientInput, Visit,
};
use chrono::Utc;
use rusqlite::{params, Connection, OptionalExtension};
use uuid::Uuid;

pub struct PatientRepository;

impl PatientRepository {
    pub fn get_all(
        conn: &Connection,
        params: Option<PatientSearchParams>,
    ) -> AppResult<Vec<Patient>> {
        let mut query = String::from(
            "SELECT p.id, p.file_number, p.file_type, p.family_file_id, p.name, p.date_of_birth,
                    p.gender, p.phone, p.email, p.address, p.conditions_json, p.allergies_json,
                    p.blood_group, p.upcoming_appointment, p.status, p.created_at, p.updated_at,
                    ff.file_number as family_file_number, ff.head_name as family_file_name
             FROM patients p
             LEFT JOIN family_files ff ON p.family_file_id = ff.id
             WHERE 1=1",
        );

        let mut query_params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        if let Some(p) = params {
            if let Some(q) = p.query {
                if !q.trim().is_empty() {
                    query.push_str(" AND (LOWER(p.name) LIKE ? OR LOWER(p.file_number) LIKE ?)");
                    let search_pattern = format!("%{}%", q.to_lowercase());
                    query_params.push(Box::new(search_pattern.clone()));
                    query_params.push(Box::new(search_pattern));
                }
            }
            if let Some(status) = p.status {
                if status != "all" {
                    query.push_str(" AND p.status = ?");
                    query_params.push(Box::new(status));
                }
            }
        }

        query.push_str(" ORDER BY p.created_at DESC");

        let mut stmt = conn.prepare(&query)?;
        let param_refs: Vec<&dyn rusqlite::ToSql> = query_params.iter().map(|p| p.as_ref()).collect();

        let patient_summaries = stmt.query_map(param_refs.as_slice(), |row| {
            let id: String = row.get(0)?;
            let file_number: String = row.get(1)?;
            let file_type: String = row.get(2)?;
            let family_file_id: Option<String> = row.get(3)?;
            let name: String = row.get(4)?;
            let date_of_birth: String = row.get(5)?;
            let gender: String = row.get(6)?;
            let phone: Option<String> = row.get(7)?;
            let email: Option<String> = row.get(8)?;
            let address: Option<String> = row.get(9)?;
            let conditions_json: String = row.get(10)?;
            let allergies_json: String = row.get(11)?;
            let blood_group: Option<String> = row.get(12)?;
            let upcoming_appointment: Option<String> = row.get(13)?;
            let status: String = row.get(14)?;
            let created_at: String = row.get(15)?;
            let updated_at: Option<String> = row.get(16)?;
            let family_file_number: Option<String> = row.get(17)?;
            let family_file_name: Option<String> = row.get(18)?;

            let conditions: Vec<String> = serde_json::from_str(&conditions_json).unwrap_or_default();
            let allergies: Vec<String> = serde_json::from_str(&allergies_json).unwrap_or_default();

            Ok(Patient {
                id,
                file_number,
                file_type,
                family_file_id,
                family_file_number,
                family_file_name,
                name,
                date_of_birth,
                gender,
                phone,
                email,
                address,
                emergency_contacts: Vec::new(),
                conditions,
                allergies,
                blood_group,
                upcoming_appointment,
                status,
                created_at,
                updated_at,
                audit_log: Vec::new(),
                visits: Vec::new(),
                appointments: Vec::new(),
                invoices: Vec::new(),
                payments: Vec::new(),
            })
        })?;

        let mut patients = Vec::new();
        for p in patient_summaries {
            patients.push(p?);
        }

        Ok(patients)
    }

    pub fn get_by_id(conn: &Connection, id: &str) -> AppResult<Option<Patient>> {
        let mut stmt = conn.prepare(
            "SELECT p.id, p.file_number, p.file_type, p.family_file_id, p.name, p.date_of_birth,
                    p.gender, p.phone, p.email, p.address, p.conditions_json, p.allergies_json,
                    p.blood_group, p.upcoming_appointment, p.status, p.created_at, p.updated_at,
                    ff.file_number as family_file_number, ff.head_name as family_file_name
             FROM patients p
             LEFT JOIN family_files ff ON p.family_file_id = ff.id
             WHERE p.id = ?",
        )?;

        let patient_opt = stmt
            .query_row(params![id], |row| {
                let pid: String = row.get(0)?;
                let file_number: String = row.get(1)?;
                let file_type: String = row.get(2)?;
                let family_file_id: Option<String> = row.get(3)?;
                let name: String = row.get(4)?;
                let date_of_birth: String = row.get(5)?;
                let gender: String = row.get(6)?;
                let phone: Option<String> = row.get(7)?;
                let email: Option<String> = row.get(8)?;
                let address: Option<String> = row.get(9)?;
                let conditions_json: String = row.get(10)?;
                let allergies_json: String = row.get(11)?;
                let blood_group: Option<String> = row.get(12)?;
                let upcoming_appointment: Option<String> = row.get(13)?;
                let status: String = row.get(14)?;
                let created_at: String = row.get(15)?;
                let updated_at: Option<String> = row.get(16)?;
                let family_file_number: Option<String> = row.get(17)?;
                let family_file_name: Option<String> = row.get(18)?;

                let conditions: Vec<String> =
                    serde_json::from_str(&conditions_json).unwrap_or_default();
                let allergies: Vec<String> =
                    serde_json::from_str(&allergies_json).unwrap_or_default();

                Ok(Patient {
                    id: pid,
                    file_number,
                    file_type,
                    family_file_id,
                    family_file_number,
                    family_file_name,
                    name,
                    date_of_birth,
                    gender,
                    phone,
                    email,
                    address,
                    emergency_contacts: Vec::new(),
                    conditions,
                    allergies,
                    blood_group,
                    upcoming_appointment,
                    status,
                    created_at,
                    updated_at,
                    audit_log: Vec::new(),
                    visits: Vec::new(),
                    appointments: Vec::new(),
                    invoices: Vec::new(),
                    payments: Vec::new(),
                })
            })
            .optional()?;

        let mut patient = match patient_opt {
            Some(p) => p,
            None => return Ok(None),
        };

        // Populate emergency contacts
        patient.emergency_contacts = Self::load_emergency_contacts(conn, id)?;

        // Populate audit logs
        patient.audit_log = Self::load_audit_logs(conn, id)?;

        // Populate visits with prescriptions
        patient.visits = Self::load_visits(conn, id)?;

        // Populate appointments
        patient.appointments = Self::load_appointments(conn, id)?;

        // Populate invoices with items
        patient.invoices = Self::load_invoices(conn, id)?;

        // Populate payments
        patient.payments = Self::load_payments(conn, id)?;

        Ok(Some(patient))
    }

    pub fn create(
        conn: &mut Connection,
        data: RegisterPatientInput,
        actor: Actor,
    ) -> AppResult<Patient> {
        let patient_id = format!("pat-{}", Uuid::new_v4().simple());
        let now = Utc::now().to_rfc3339();

        let mut family_file_id = data.family_file_id.clone();

        // Handle family file creation if requested
        if data.create_family_file.unwrap_or(false) && data.family_file_name.is_some() {
            let fam_id = format!("fam-{}", Uuid::new_v4().simple());
            let fam_number = format!("FAM-{}", Utc::now().format("%Y%m%d%H%M%S"));
            let head_name = data.family_file_name.unwrap();

            conn.execute(
                "INSERT INTO family_files (id, file_number, head_name, created_at) VALUES (?, ?, ?, ?)",
                params![fam_id, fam_number, head_name, now],
            )?;

            family_file_id = Some(fam_id);
        }

        let conditions_json = serde_json::to_string(&Vec::<String>::new())?;
        let allergies_json = serde_json::to_string(&Vec::<String>::new())?;

        let tx = conn.transaction()?;

        tx.execute(
            "INSERT INTO patients (
                id, file_number, file_type, family_file_id, name, date_of_birth, gender,
                phone, email, address, conditions_json, allergies_json, blood_group,
                status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)",
            params![
                patient_id,
                data.file_number,
                data.file_type,
                family_file_id,
                data.name,
                data.date_of_birth,
                data.gender,
                data.phone,
                data.email,
                data.address,
                conditions_json,
                allergies_json,
                Option::<String>::None,
                now
            ],
        )?;

        // Insert emergency contacts if provided
        if let Some(contacts) = data.emergency_contacts {
            for c in contacts {
                let ec_id = format!("ec-{}", Uuid::new_v4().simple());
                tx.execute(
                    "INSERT INTO emergency_contacts (id, patient_id, name, phone, relationship) VALUES (?, ?, ?, ?, ?)",
                    params![ec_id, patient_id, c.name, c.phone, c.relationship],
                )?;
            }
        }

        // Add audit log
        let audit_id = format!("aud-{}", Uuid::new_v4().simple());
        tx.execute(
            "INSERT INTO patient_audit_logs (id, patient_id, timestamp, user_id, user_name, action, source)
             VALUES (?, ?, ?, ?, ?, 'created', 'UI')",
            params![audit_id, patient_id, now, actor.id, actor.name],
        )?;

        tx.commit()?;

        match Self::get_by_id(conn, &patient_id)? {
            Some(p) => Ok(p),
            None => Err(AppError::NotFound("Patient was created but could not be retrieved".into())),
        }
    }

    pub fn update(
        conn: &mut Connection,
        id: &str,
        data: UpdatePatientInput,
        actor: Actor,
    ) -> AppResult<Option<Patient>> {
        let now = Utc::now().to_rfc3339();

        let mut updates = Vec::new();
        let mut query_params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        if let Some(name) = data.name {
            updates.push("name = ?");
            query_params.push(Box::new(name));
        }
        if let Some(dob) = data.date_of_birth {
            updates.push("date_of_birth = ?");
            query_params.push(Box::new(dob));
        }
        if let Some(gender) = data.gender {
            updates.push("gender = ?");
            query_params.push(Box::new(gender));
        }
        if let Some(phone) = data.phone {
            updates.push("phone = ?");
            query_params.push(Box::new(phone));
        }
        if let Some(email) = data.email {
            updates.push("email = ?");
            query_params.push(Box::new(email));
        }
        if let Some(address) = data.address {
            updates.push("address = ?");
            query_params.push(Box::new(address));
        }
        if let Some(conditions) = data.conditions {
            updates.push("conditions_json = ?");
            query_params.push(Box::new(serde_json::to_string(&conditions)?));
        }
        if let Some(allergies) = data.allergies {
            updates.push("allergies_json = ?");
            query_params.push(Box::new(serde_json::to_string(&allergies)?));
        }
        if let Some(blood_group) = data.blood_group {
            updates.push("blood_group = ?");
            query_params.push(Box::new(blood_group));
        }
        if let Some(appt) = data.upcoming_appointment {
            updates.push("upcoming_appointment = ?");
            query_params.push(Box::new(appt));
        }

        if updates.is_empty() {
            return Self::get_by_id(conn, id);
        }

        updates.push("updated_at = ?");
        query_params.push(Box::new(now.clone()));

        query_params.push(Box::new(id.to_string()));

        let update_sql = format!(
            "UPDATE patients SET {} WHERE id = ?",
            updates.join(", ")
        );

        let tx = conn.transaction()?;
        let param_refs: Vec<&dyn rusqlite::ToSql> = query_params.iter().map(|p| p.as_ref()).collect();
        tx.execute(&update_sql, param_refs.as_slice())?;

        let audit_id = format!("aud-{}", Uuid::new_v4().simple());
        tx.execute(
            "INSERT INTO patient_audit_logs (id, patient_id, timestamp, user_id, user_name, action, source)
             VALUES (?, ?, ?, ?, ?, 'updated', 'UI')",
            params![audit_id, id, now, actor.id, actor.name],
        )?;

        tx.commit()?;

        Self::get_by_id(conn, id)
    }

    pub fn set_status(
        conn: &mut Connection,
        id: &str,
        status: &str,
        actor: Actor,
    ) -> AppResult<Option<Patient>> {
        let now = Utc::now().to_rfc3339();

        let tx = conn.transaction()?;
        tx.execute(
            "UPDATE patients SET status = ?, updated_at = ? WHERE id = ?",
            params![status, now, id],
        )?;

        let audit_id = format!("aud-{}", Uuid::new_v4().simple());
        tx.execute(
            "INSERT INTO patient_audit_logs (id, patient_id, timestamp, user_id, user_name, action, source)
             VALUES (?, ?, ?, ?, ?, 'status_changed', 'UI')",
            params![audit_id, id, now, actor.id, actor.name],
        )?;

        tx.commit()?;
        Self::get_by_id(conn, id)
    }

    pub fn add_visit(
        conn: &mut Connection,
        patient_id: &str,
        visit: CreateVisitInput,
        _actor: Actor,
    ) -> AppResult<Option<Patient>> {
        let visit_id = format!("vis-{}", Uuid::new_v4().simple());

        let tx = conn.transaction()?;
        tx.execute(
            "INSERT INTO visits (
                id, patient_id, date, doctor_name, doctor_id, reason, summary, status,
                type, notes, diagnosis, observations
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            params![
                visit_id,
                patient_id,
                visit.date,
                visit.doctor_name,
                visit.doctor_id,
                visit.reason,
                visit.summary,
                visit.status,
                visit.r#type,
                visit.notes,
                visit.diagnosis,
                visit.observations
            ],
        )?;

        for p in visit.prescriptions {
            let rx_id = format!("rx-{}", Uuid::new_v4().simple());
            tx.execute(
                "INSERT INTO prescriptions (
                    id, patient_id, visit_id, medicine, dosage, frequency, duration,
                    notes, status, issued_date, prescribing_doctor
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                params![
                    rx_id,
                    patient_id,
                    visit_id,
                    p.medicine,
                    p.dosage,
                    p.frequency,
                    p.duration,
                    p.notes,
                    p.status,
                    p.issued_date,
                    p.prescribing_doctor
                ],
            )?;
        }

        tx.commit()?;
        Self::get_by_id(conn, patient_id)
    }

    pub fn add_prescription(
        conn: &mut Connection,
        patient_id: &str,
        prescription: CreatePrescriptionInput,
        _actor: Actor,
    ) -> AppResult<Option<Patient>> {
        let rx_id = format!("rx-{}", Uuid::new_v4().simple());

        conn.execute(
            "INSERT INTO prescriptions (
                id, patient_id, visit_id, medicine, dosage, frequency, duration,
                notes, status, issued_date, prescribing_doctor
            ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)",
            params![
                rx_id,
                patient_id,
                prescription.medicine,
                prescription.dosage,
                prescription.frequency,
                prescription.duration,
                prescription.notes,
                prescription.status,
                prescription.issued_date,
                prescription.prescribing_doctor
            ],
        )?;

        Self::get_by_id(conn, patient_id)
    }

    pub fn cancel_prescription(
        conn: &mut Connection,
        patient_id: &str,
        prescription_id: &str,
        _actor: Actor,
    ) -> AppResult<Option<Patient>> {
        conn.execute(
            "UPDATE prescriptions SET status = 'cancelled' WHERE id = ? AND patient_id = ?",
            params![prescription_id, patient_id],
        )?;

        Self::get_by_id(conn, patient_id)
    }

    pub fn add_appointment(
        conn: &mut Connection,
        patient_id: &str,
        appointment: CreateAppointmentInput,
        _actor: Actor,
    ) -> AppResult<Option<Patient>> {
        let appt_id = format!("apt-{}", Uuid::new_v4().simple());

        let tx = conn.transaction()?;
        tx.execute(
            "INSERT INTO appointments (
                id, patient_id, date, doctor_id, doctor_name, reason, status, location, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            params![
                appt_id,
                patient_id,
                appointment.date,
                appointment.doctor_id,
                appointment.doctor_name,
                appointment.reason,
                appointment.status,
                appointment.location,
                appointment.notes
            ],
        )?;

        // Update upcoming_appointment field on patient
        tx.execute(
            "UPDATE patients SET upcoming_appointment = ? WHERE id = ?",
            params![appointment.date, patient_id],
        )?;

        tx.commit()?;
        Self::get_by_id(conn, patient_id)
    }

    pub fn update_appointment(
        conn: &mut Connection,
        patient_id: &str,
        appointment_id: &str,
        data: UpdateAppointmentInput,
        _actor: Actor,
    ) -> AppResult<Option<Patient>> {
        let mut updates = Vec::new();
        let mut query_params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        if let Some(date) = data.date {
            updates.push("date = ?");
            query_params.push(Box::new(date));
        }
        if let Some(doc_id) = data.doctor_id {
            updates.push("doctor_id = ?");
            query_params.push(Box::new(doc_id));
        }
        if let Some(doc_name) = data.doctor_name {
            updates.push("doctor_name = ?");
            query_params.push(Box::new(doc_name));
        }
        if let Some(reason) = data.reason {
            updates.push("reason = ?");
            query_params.push(Box::new(reason));
        }
        if let Some(status) = data.status {
            updates.push("status = ?");
            query_params.push(Box::new(status));
        }
        if let Some(loc) = data.location {
            updates.push("location = ?");
            query_params.push(Box::new(loc));
        }
        if let Some(notes) = data.notes {
            updates.push("notes = ?");
            query_params.push(Box::new(notes));
        }

        if !updates.is_empty() {
            query_params.push(Box::new(appointment_id.to_string()));
            query_params.push(Box::new(patient_id.to_string()));

            let sql = format!(
                "UPDATE appointments SET {} WHERE id = ? AND patient_id = ?",
                updates.join(", ")
            );
            let param_refs: Vec<&dyn rusqlite::ToSql> = query_params.iter().map(|p| p.as_ref()).collect();
            conn.execute(&sql, param_refs.as_slice())?;
        }

        Self::get_by_id(conn, patient_id)
    }

    pub fn cancel_appointment(
        conn: &mut Connection,
        patient_id: &str,
        appointment_id: &str,
        _actor: Actor,
    ) -> AppResult<Option<Patient>> {
        conn.execute(
            "UPDATE appointments SET status = 'cancelled' WHERE id = ? AND patient_id = ?",
            params![appointment_id, patient_id],
        )?;

        Self::get_by_id(conn, patient_id)
    }

    pub fn add_invoice(
        conn: &mut Connection,
        patient_id: &str,
        invoice: CreateInvoiceInput,
        _actor: Actor,
    ) -> AppResult<Option<Patient>> {
        let inv_id = format!("inv-{}", Uuid::new_v4().simple());

        let tx = conn.transaction()?;
        tx.execute(
            "INSERT INTO invoices (id, patient_id, visit_id, date, amount, paid_amount, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)",
            params![
                inv_id,
                patient_id,
                invoice.visit_id,
                invoice.date,
                invoice.amount,
                invoice.paid_amount,
                invoice.status
            ],
        )?;

        for item in invoice.items {
            let item_id = format!("ii-{}", Uuid::new_v4().simple());
            tx.execute(
                "INSERT INTO invoice_items (id, invoice_id, description, amount) VALUES (?, ?, ?, ?)",
                params![item_id, inv_id, item.description, item.amount],
            )?;
        }

        tx.commit()?;
        Self::get_by_id(conn, patient_id)
    }

    pub fn add_payment(
        conn: &mut Connection,
        patient_id: &str,
        payment: CreatePaymentInput,
        _actor: Actor,
    ) -> AppResult<Option<Patient>> {
        let p_id = format!("pay-{}", Uuid::new_v4().simple());

        let tx = conn.transaction()?;
        tx.execute(
            "INSERT INTO payments (id, patient_id, invoice_id, date, amount, method, reference)
             VALUES (?, ?, ?, ?, ?, ?, ?)",
            params![
                p_id,
                patient_id,
                payment.invoice_id,
                payment.date,
                payment.amount,
                payment.method,
                payment.reference
            ],
        )?;

        // If invoice_id is present, update paid_amount on invoice
        if let Some(ref inv_id) = payment.invoice_id {
            tx.execute(
                "UPDATE invoices SET paid_amount = paid_amount + ? WHERE id = ?",
                params![payment.amount, inv_id],
            )?;

            // If fully paid, set status to paid
            tx.execute(
                "UPDATE invoices SET status = 'paid' WHERE id = ? AND paid_amount >= amount",
                params![inv_id],
            )?;
        }

        tx.commit()?;
        Self::get_by_id(conn, patient_id)
    }

    pub fn check_duplicate(
        conn: &Connection,
        name: &str,
        date_of_birth: &str,
    ) -> AppResult<Option<Patient>> {
        let mut stmt = conn.prepare(
            "SELECT id FROM patients WHERE LOWER(name) = LOWER(?) AND date_of_birth = ? LIMIT 1",
        )?;

        let id_opt: Option<String> = stmt
            .query_row(params![name, date_of_birth], |r| r.get(0))
            .optional()?;

        match id_opt {
            Some(id) => Self::get_by_id(conn, &id),
            None => Ok(None),
        }
    }

    pub fn get_next_file_number(conn: &Connection) -> AppResult<String> {
        let count: i64 = conn.query_row("SELECT COUNT(*) FROM patients", [], |r| r.get(0))?;
        let year = Utc::now().format("%Y");
        Ok(format!("HMS-{}-{:04}", year, count + 1))
    }

    pub fn is_file_number_taken(conn: &Connection, file_number: &str) -> AppResult<bool> {
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM patients WHERE file_number = ?",
            params![file_number],
            |r| r.get(0),
        )?;
        Ok(count > 0)
    }

    pub fn get_family_files(conn: &Connection) -> AppResult<Vec<FamilyFile>> {
        let mut stmt = conn.prepare(
            "SELECT id, file_number, head_name, created_at FROM family_files ORDER BY created_at DESC",
        )?;

        let rows = stmt.query_map([], |row| {
            let id: String = row.get(0)?;
            let file_number: String = row.get(1)?;
            let head_name: String = row.get(2)?;
            let created_at: String = row.get(3)?;
            Ok((id, file_number, head_name, created_at))
        })?;

        let mut results = Vec::new();
        for r in rows {
            let (id, file_number, head_name, created_at) = r?;
            let mut member_stmt =
                conn.prepare("SELECT id FROM patients WHERE family_file_id = ?")?;
            let member_rows = member_stmt.query_map(params![id], |mr| mr.get::<_, String>(0))?;
            let mut member_ids = Vec::new();
            for m in member_rows {
                member_ids.push(m?);
            }

            results.push(FamilyFile {
                id,
                file_number,
                head_name,
                member_ids,
                created_at,
            });
        }

        Ok(results)
    }

    pub fn search_family_files(conn: &Connection, query: &str) -> AppResult<Vec<FamilyFile>> {
        let q = format!("%{}%", query.to_lowercase());
        let mut stmt = conn.prepare(
            "SELECT id, file_number, head_name, created_at FROM family_files
             WHERE LOWER(head_name) LIKE ? OR LOWER(file_number) LIKE ?
             ORDER BY created_at DESC",
        )?;

        let rows = stmt.query_map(params![q, q], |row| {
            let id: String = row.get(0)?;
            let file_number: String = row.get(1)?;
            let head_name: String = row.get(2)?;
            let created_at: String = row.get(3)?;
            Ok((id, file_number, head_name, created_at))
        })?;

        let mut results = Vec::new();
        for r in rows {
            let (id, file_number, head_name, created_at) = r?;
            let mut member_stmt =
                conn.prepare("SELECT id FROM patients WHERE family_file_id = ?")?;
            let member_rows = member_stmt.query_map(params![id], |mr| mr.get::<_, String>(0))?;
            let mut member_ids = Vec::new();
            for m in member_rows {
                member_ids.push(m?);
            }

            results.push(FamilyFile {
                id,
                file_number,
                head_name,
                member_ids,
                created_at,
            });
        }

        Ok(results)
    }

    // --- Helpers for loading related data ---

    fn load_emergency_contacts(conn: &Connection, patient_id: &str) -> AppResult<Vec<EmergencyContact>> {
        let mut stmt = conn.prepare(
            "SELECT id, name, phone, relationship FROM emergency_contacts WHERE patient_id = ?",
        )?;
        let rows = stmt.query_map(params![patient_id], |row| {
            Ok(EmergencyContact {
                id: row.get(0)?,
                name: row.get(1)?,
                phone: row.get(2)?,
                relationship: row.get(3)?,
            })
        })?;
        let mut contacts = Vec::new();
        for r in rows {
            contacts.push(r?);
        }
        Ok(contacts)
    }

    fn load_audit_logs(conn: &Connection, patient_id: &str) -> AppResult<Vec<AuditEntry>> {
        let mut stmt = conn.prepare(
            "SELECT id, timestamp, user_id, user_name, action, changes_json, source
             FROM patient_audit_logs WHERE patient_id = ? ORDER BY timestamp DESC",
        )?;
        let rows = stmt.query_map(params![patient_id], |row| {
            let changes_raw: Option<String> = row.get(5)?;
            let changes = changes_raw.and_then(|c| serde_json::from_str(&c).ok());
            Ok(AuditEntry {
                id: row.get(0)?,
                timestamp: row.get(1)?,
                user_id: row.get(2)?,
                user_name: row.get(3)?,
                action: row.get(4)?,
                changes,
                source: row.get(6)?,
            })
        })?;
        let mut logs = Vec::new();
        for r in rows {
            logs.push(r?);
        }
        Ok(logs)
    }

    fn load_visits(conn: &Connection, patient_id: &str) -> AppResult<Vec<Visit>> {
        let mut stmt = conn.prepare(
            "SELECT id, patient_id, date, doctor_name, doctor_id, reason, summary, status,
                    type, notes, diagnosis, observations
             FROM visits WHERE patient_id = ? ORDER BY date DESC",
        )?;

        let rows = stmt.query_map(params![patient_id], |row| {
            let visit_id: String = row.get(0)?;
            Ok(Visit {
                id: visit_id,
                patient_id: row.get(1)?,
                date: row.get(2)?,
                doctor_name: row.get(3)?,
                doctor_id: row.get(4)?,
                reason: row.get(5)?,
                summary: row.get(6)?,
                status: row.get(7)?,
                r#type: row.get(8)?,
                notes: row.get(9)?,
                diagnosis: row.get(10)?,
                observations: row.get(11)?,
                prescriptions: Vec::new(),
            })
        })?;

        let mut visits = Vec::new();
        for r in rows {
            let mut visit = r?;
            let mut rx_stmt = conn.prepare(
                "SELECT id, medicine, dosage, frequency, duration, notes, status, issued_date, prescribing_doctor
                 FROM prescriptions WHERE visit_id = ?",
            )?;
            let rx_rows = rx_stmt.query_map(params![visit.id], |rx_row| {
                Ok(Prescription {
                    id: rx_row.get(0)?,
                    medicine: rx_row.get(1)?,
                    dosage: rx_row.get(2)?,
                    frequency: rx_row.get(3)?,
                    duration: rx_row.get(4)?,
                    notes: rx_row.get(5)?,
                    status: rx_row.get(6)?,
                    issued_date: rx_row.get(7)?,
                    prescribing_doctor: rx_row.get(8)?,
                })
            })?;
            for rx in rx_rows {
                visit.prescriptions.push(rx?);
            }
            visits.push(visit);
        }

        Ok(visits)
    }

    fn load_appointments(conn: &Connection, patient_id: &str) -> AppResult<Vec<Appointment>> {
        let mut stmt = conn.prepare(
            "SELECT id, patient_id, date, doctor_id, doctor_name, reason, status, location, notes
             FROM appointments WHERE patient_id = ? ORDER BY date DESC",
        )?;

        let rows = stmt.query_map(params![patient_id], |row| {
            Ok(Appointment {
                id: row.get(0)?,
                patient_id: row.get(1)?,
                date: row.get(2)?,
                doctor_id: row.get(3)?,
                doctor_name: row.get(4)?,
                reason: row.get(5)?,
                status: row.get(6)?,
                location: row.get(7)?,
                notes: row.get(8)?,
            })
        })?;

        let mut appointments = Vec::new();
        for r in rows {
            appointments.push(r?);
        }
        Ok(appointments)
    }

    fn load_invoices(conn: &Connection, patient_id: &str) -> AppResult<Vec<Invoice>> {
        let mut stmt = conn.prepare(
            "SELECT id, patient_id, visit_id, date, amount, paid_amount, status
             FROM invoices WHERE patient_id = ? ORDER BY date DESC",
        )?;

        let rows = stmt.query_map(params![patient_id], |row| {
            let invoice_id: String = row.get(0)?;
            Ok(Invoice {
                id: invoice_id,
                patient_id: row.get(1)?,
                visit_id: row.get(2)?,
                date: row.get(3)?,
                items: Vec::new(),
                amount: row.get(4)?,
                paid_amount: row.get(5)?,
                status: row.get(6)?,
            })
        })?;

        let mut invoices = Vec::new();
        for r in rows {
            let mut invoice = r?;
            let mut item_stmt = conn.prepare(
                "SELECT id, description, amount FROM invoice_items WHERE invoice_id = ?",
            )?;
            let item_rows = item_stmt.query_map(params![invoice.id], |item_row| {
                Ok(InvoiceItem {
                    id: item_row.get(0)?,
                    description: item_row.get(1)?,
                    amount: item_row.get(2)?,
                })
            })?;
            for item in item_rows {
                invoice.items.push(item?);
            }
            invoices.push(invoice);
        }

        Ok(invoices)
    }

    fn load_payments(conn: &Connection, patient_id: &str) -> AppResult<Vec<Payment>> {
        let mut stmt = conn.prepare(
            "SELECT id, patient_id, invoice_id, date, amount, method, reference
             FROM payments WHERE patient_id = ? ORDER BY date DESC",
        )?;

        let rows = stmt.query_map(params![patient_id], |row| {
            Ok(Payment {
                id: row.get(0)?,
                patient_id: row.get(1)?,
                invoice_id: row.get(2)?,
                date: row.get(3)?,
                amount: row.get(4)?,
                method: row.get(5)?,
                reference: row.get(6)?,
            })
        })?;

        let mut payments = Vec::new();
        for r in rows {
            payments.push(r?);
        }
        Ok(payments)
    }
}
