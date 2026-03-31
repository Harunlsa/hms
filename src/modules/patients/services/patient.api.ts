// This file will house Tauri `invoke()` calls when the Rust backend is wired up.
// For now it re-exports the mock repository so the rest of the module is
// decoupled from the data source and swapping to real IPC requires only changing
// this file.

export { patientMockRepo as patientApi } from "../patient.mock";
