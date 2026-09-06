// Copyright (c) 2026 Ian Ohlander. All rights reserved.
// Apple //c Ultra Workstation Pro - Desktop Native Engine

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod licensing;
mod workspace;

use licensing::{verify_offline_license, LicenseVerificationResult};
use workspace::{initialize_user_workspace, list_custom_cards_internal, save_custom_card_internal, CustomCardMeta};

#[tauri::command]
fn verify_license(license_key: String) -> LicenseVerificationResult {
    verify_offline_license(&license_key)
}

#[tauri::command]
fn get_workspace_path() -> Result<String, String> {
    initialize_user_workspace().map(|p| p.to_string_lossy().to_string())
}

#[tauri::command]
fn list_saved_cards() -> Result<Vec<CustomCardMeta>, String> {
    list_custom_cards_internal()
}

#[tauri::command]
fn save_local_card(card_name: String, card_code: String) -> Result<String, String> {
    save_custom_card_internal(&card_name, &card_code)
}

fn main() {
    // Initialize user documents directory structure on first startup
    let _ = initialize_user_workspace();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            verify_license,
            get_workspace_path,
            list_saved_cards,
            save_local_card
        ])
        .run(tauri::generate_context!())
        .expect("Error occurred while executing Apple //c Ultra desktop workstation.");
}
