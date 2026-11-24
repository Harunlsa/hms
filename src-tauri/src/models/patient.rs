use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EmergencyContact {
    pub id: String,
    pub name: String,
    pub phone: String,
    pub relationship: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuditEntry {
    pub id: String,
    pub timestamp: String,
    pub user_id: String,
    pub user_name: String,
    pub action: String, // "created" | "updated" | "status_changed"
    pub changes: Option<serde_json::Value>,
    pub source: String, // "UI" | "system" | "import"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Prescription {
    pub id: String,
    pub medicine: String,
    pub dosage: String,
    pub frequency: String,
    pub duration: String,
    pub notes: Option<String>,
    pub status: String, // "active" | "completed" | "cancelled"
    pub issued_date: String,
    pub prescribing_doctor: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Visit {
    pub id: String,
    pub patient_id: String,
    pub date: String,
    pub doctor_name: String,
    pub doctor_id: String,
    pub reason: String,
    pub summary: String,
    pub status: String, // "completed" | "ongoing" | "cancelled"
    pub r#type: String,  // "consultation" | "emergency" | "follow-up" | "routine-checkup"
    pub notes: String,
    pub diagnosis: String,
    pub observations: String,
    pub prescriptions: Vec<Prescription>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Appointment {
    pub id: String,
    pub patient_id: String,
    pub date: String,
    pub doctor_id: String,
    pub doctor_name: String,
    pub reason: String,
    pub status: String, // "pending" | "confirmed" | "cancelled" | "completed" | "missed"
    pub location: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InvoiceItem {
    pub id: String,
    pub description: String,
    pub amount: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Invoice {
    pub id: String,
    pub patient_id: String,
    pub visit_id: Option<String>,
    pub date: String,
    pub items: Vec<InvoiceItem>,
    pub amount: f64,
    pub paid_amount: f64,
    pub status: String, // "paid" | "pending" | "overdue"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Payment {
    pub id: String,
    pub patient_id: String,
    pub invoice_id: Option<String>,
    pub date: String,
    pub amount: f64,
    pub method: String, // "cash" | "transfer" | "card"
    pub reference: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Patient {
    pub id: String,
    pub file_number: String,
    pub file_type: String, // "individual" | "family"
    pub family_file_id: Option<String>,
    pub family_file_number: Option<String>,
    pub family_file_name: Option<String>,
    pub name: String,
    pub date_of_birth: String,
    pub gender: String, // "male" | "female"
    pub phone: Option<String>,
    pub email: Option<String>,
    pub address: Option<String>,
    pub emergency_contacts: Vec<EmergencyContact>,

    pub conditions: Vec<String>,
    pub allergies: Vec<String>,
    pub blood_group: Option<String>,
    pub upcoming_appointment: Option<String>,

    pub status: String, // "active" | "inactive" | "archived"
    pub created_at: String,
    pub updated_at: Option<String>,
    pub audit_log: Vec<AuditEntry>,
    pub visits: Vec<Visit>,
    pub appointments: Vec<Appointment>,
    pub invoices: Vec<Invoice>,
    pub payments: Vec<Payment>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterEmergencyContactInput {
    pub name: String,
    pub phone: String,
    pub relationship: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterPatientInput {
    pub name: String,
    pub date_of_birth: String,
    pub gender: String,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub address: Option<String>,
    pub emergency_contacts: Option<Vec<RegisterEmergencyContactInput>>,
    pub file_type: String,
    pub file_number: String,
    pub family_file_id: Option<String>,
    pub create_family_file: Option<bool>,
    pub family_file_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePatientInput {
    pub name: Option<String>,
    pub date_of_birth: Option<String>,
    pub gender: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub address: Option<String>,
    pub conditions: Option<Vec<String>>,
    pub allergies: Option<Vec<String>>,
    pub blood_group: Option<String>,
    pub upcoming_appointment: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateVisitInput {
    pub date: String,
    pub doctor_name: String,
    pub doctor_id: String,
    pub reason: String,
    pub summary: String,
    pub status: String,
    pub r#type: String,
    pub notes: String,
    pub diagnosis: String,
    pub observations: String,
    pub prescriptions: Vec<CreatePrescriptionInput>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePrescriptionInput {
    pub medicine: String,
    pub dosage: String,
    pub frequency: String,
    pub duration: String,
    pub notes: Option<String>,
    pub status: String,
    pub issued_date: String,
    pub prescribing_doctor: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateAppointmentInput {
    pub date: String,
    pub doctor_id: String,
    pub doctor_name: String,
    pub reason: String,
    pub status: String,
    pub location: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct UpdateAppointmentInput {
    pub date: Option<String>,
    pub doctor_id: Option<String>,
    pub doctor_name: Option<String>,
    pub reason: Option<String>,
    pub status: Option<String>,
    pub location: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateInvoiceInput {
    pub visit_id: Option<String>,
    pub date: String,
    pub items: Vec<CreateInvoiceItemInput>,
    pub amount: f64,
    pub paid_amount: f64,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateInvoiceItemInput {
    pub description: String,
    pub amount: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePaymentInput {
    pub invoice_id: Option<String>,
    pub date: String,
    pub amount: f64,
    pub method: String,
    pub reference: Option<String>,
}
