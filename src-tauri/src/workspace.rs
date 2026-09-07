// Copyright (c) 2026 Ian Ohlander. All rights reserved.
// Local Sandboxed Filesystem Workspace Manager for Desktop Pro

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
pub struct CustomCardMeta {
    pub name: String,
    pub filename: String,
    pub byte_size: u64,
    pub modified_at: String,
}

pub fn get_user_workspace_root() -> PathBuf {
    let mut dir = dirs::document_dir().unwrap_or_else(|| PathBuf::from("./"));
    dir.push("Ultra6502");
    dir
}

pub fn initialize_user_workspace() -> Result<PathBuf, String> {
    let root = get_user_workspace_root();
    let cards_dir = root.join("Cards");
    let disks_dir = root.join("Disks");
    let configs_dir = root.join("Configs");

    fs::create_dir_all(&cards_dir).map_err(|e| format!("Failed to create Cards directory: {}", e))?;
    fs::create_dir_all(&disks_dir).map_err(|e| format!("Failed to create Disks directory: {}", e))?;
    fs::create_dir_all(&configs_dir).map_err(|e| format!("Failed to create Configs directory: {}", e))?;

    Ok(root)
}

pub fn list_custom_cards_internal() -> Result<Vec<CustomCardMeta>, String> {
    let root = get_user_workspace_root();
    let cards_dir = root.join("Cards");
    if !cards_dir.exists() {
        initialize_user_workspace()?;
    }

    let mut cards = Vec::new();
    let entries = fs::read_dir(&cards_dir).map_err(|e| format!("Failed to read cards dir: {}", e))?;

    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|s| s.to_str()) == Some("js") {
            let filename = path.file_name().unwrap_or_default().to_string_lossy().to_string();
            let metadata = entry.metadata().ok();
            let size = metadata.as_ref().map(|m| m.len()).unwrap_or(0);
            
            cards.push(CustomCardMeta {
                name: filename.trim_end_matches(".card.js").trim_end_matches(".js").to_string(),
                filename,
                byte_size: size,
                modified_at: "Local Storage".into(),
            });
        }
    }

    Ok(cards)
}

pub fn save_custom_card_internal(name: &str, code: &str) -> Result<String, String> {
    let root = get_user_workspace_root();
    let cards_dir = root.join("Cards");
    fs::create_dir_all(&cards_dir).map_err(|e| e.to_string())?;

    let safe_name = name.replace(|c: char| !c.is_alphanumeric() && c != '-' && c != '_', "");
    let file_path = cards_dir.join(format!("{}.card.js", safe_name));

    fs::write(&file_path, code).map_err(|e| format!("Failed to write card file: {}", e))?;
    Ok(file_path.to_string_lossy().to_string())
}
