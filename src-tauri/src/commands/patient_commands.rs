use crate::db::DbPool;
use crate::error::AppError;
use crate::models::{
    Actor, CreateAppointmentInput, CreateInvoiceInput, CreatePaymentInput, CreatePrescriptionInput,
    CreateVisitInput, FamilyFile, Patient, PatientSearchParams, RegisterPatientInput,
    UpdateAppointmentInput, UpdatePatientInput,
};
use crate::repositories::PatientRepository;
use tauri::State;

#[tauri::command]
pub fn get_patients(
    pool: State<DbPool>,
    params: Option<PatientSearchParams>,
) -> Result<Vec<Patient>, AppError> {
    let conn = pool.get()?;
    PatientRepository::get_all(&conn, params)
}

#[tauri::command]
pub fn get_patient_by_id(pool: State<DbPool>, id: String) -> Result<Option<Patient>, AppError> {
    let conn = pool.get()?;
    PatientRepository::get_by_id(&conn, &id)
}

#[tauri::command]
pub fn create_patient(
    pool: State<DbPool>,
    data: RegisterPatientInput,
    actor: Actor,
) -> Result<Patient, AppError> {
    let mut conn = pool.get()?;
    PatientRepository::create(&mut conn, data, actor)
}

#[tauri::command]
pub fn update_patient(
    pool: State<DbPool>,
    id: String,
    data: UpdatePatientInput,
    actor: Actor,
) -> Result<Option<Patient>, AppError> {
    let mut conn = pool.get()?;
    PatientRepository::update(&mut conn, &id, data, actor)
}

#[tauri::command]
pub fn set_patient_status(
    pool: State<DbPool>,
    id: String,
    status: String,
    actor: Actor,
) -> Result<Option<Patient>, AppError> {
    let mut conn = pool.get()?;
    PatientRepository::set_status(&mut conn, &id, &status, actor)
}

#[tauri::command]
pub fn add_patient_visit(
    pool: State<DbPool>,
    patient_id: String,
    visit: CreateVisitInput,
    actor: Actor,
) -> Result<Option<Patient>, AppError> {
    let mut conn = pool.get()?;
    PatientRepository::add_visit(&mut conn, &patient_id, visit, actor)
}

#[tauri::command]
pub fn add_patient_prescription(
    pool: State<DbPool>,
    patient_id: String,
    prescription: CreatePrescriptionInput,
    actor: Actor,
) -> Result<Option<Patient>, AppError> {
    let mut conn = pool.get()?;
    PatientRepository::add_prescription(&mut conn, &patient_id, prescription, actor)
}

#[tauri::command]
pub fn cancel_patient_prescription(
    pool: State<DbPool>,
    patient_id: String,
    prescription_id: String,
    actor: Actor,
) -> Result<Option<Patient>, AppError> {
    let mut conn = pool.get()?;
    PatientRepository::cancel_prescription(&mut conn, &patient_id, &prescription_id, actor)
}

#[tauri::command]
pub fn add_patient_appointment(
    pool: State<DbPool>,
    patient_id: String,
    appointment: CreateAppointmentInput,
    actor: Actor,
) -> Result<Option<Patient>, AppError> {
    let mut conn = pool.get()?;
    PatientRepository::add_appointment(&mut conn, &patient_id, appointment, actor)
}

#[tauri::command]
pub fn update_patient_appointment(
    pool: State<DbPool>,
    patient_id: String,
    appointment_id: String,
    data: UpdateAppointmentInput,
    actor: Actor,
) -> Result<Option<Patient>, AppError> {
    let mut conn = pool.get()?;
    PatientRepository::update_appointment(&mut conn, &patient_id, &appointment_id, data, actor)
}

#[tauri::command]
pub fn cancel_patient_appointment(
    pool: State<DbPool>,
    patient_id: String,
    appointment_id: String,
    actor: Actor,
) -> Result<Option<Patient>, AppError> {
    let mut conn = pool.get()?;
    PatientRepository::cancel_appointment(&mut conn, &patient_id, &appointment_id, actor)
}

#[tauri::command]
pub fn add_patient_invoice(
    pool: State<DbPool>,
    patient_id: String,
    invoice: CreateInvoiceInput,
    actor: Actor,
) -> Result<Option<Patient>, AppError> {
    let mut conn = pool.get()?;
    PatientRepository::add_invoice(&mut conn, &patient_id, invoice, actor)
}

#[tauri::command]
pub fn add_patient_payment(
    pool: State<DbPool>,
    patient_id: String,
    payment: CreatePaymentInput,
    actor: Actor,
) -> Result<Option<Patient>, AppError> {
    let mut conn = pool.get()?;
    PatientRepository::add_payment(&mut conn, &patient_id, payment, actor)
}

#[tauri::command]
pub fn check_duplicate_patient(
    pool: State<DbPool>,
    name: String,
    date_of_birth: String,
) -> Result<Option<Patient>, AppError> {
    let conn = pool.get()?;
    PatientRepository::check_duplicate(&conn, &name, &date_of_birth)
}

#[tauri::command]
pub fn get_next_file_number(pool: State<DbPool>) -> Result<String, AppError> {
    let conn = pool.get()?;
    PatientRepository::get_next_file_number(&conn)
}

#[tauri::command]
pub fn is_file_number_taken(pool: State<DbPool>, file_number: String) -> Result<bool, AppError> {
    let conn = pool.get()?;
    PatientRepository::is_file_number_taken(&conn, &file_number)
}

#[tauri::command]
pub fn get_family_files(pool: State<DbPool>) -> Result<Vec<FamilyFile>, AppError> {
    let conn = pool.get()?;
    PatientRepository::get_family_files(&conn)
}

#[tauri::command]
pub fn search_family_files(pool: State<DbPool>, query: String) -> Result<Vec<FamilyFile>, AppError> {
    let conn = pool.get()?;
    PatientRepository::search_family_files(&conn, &query)
}
