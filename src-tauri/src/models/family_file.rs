use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FamilyFile {
    pub id: String,
    pub file_number: String,
    pub head_name: String,
    pub member_ids: Vec<String>,
    pub created_at: String,
}
