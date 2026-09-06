// Copyright (c) 2026 Ian Ohlander. All rights reserved.
// Offline Asymmetric Cryptographic License Key Validator (Ed25519)

use serde::{Deserialize, Serialize};
use ed25519_dalek::{Signature, VerifyingKey, Verifier};
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use chrono::{DateTime, Utc};

// Public master verification key for Ian Ohlander / Apple //c Ultra (32 bytes hex)
// Generated from author master private key. Verified offline with zero internet required.
pub const MASTER_PUBLIC_KEY_HEX: &str = "7d4b68e9f2a105c384e912bc4501a3def7902143bc8912e5647a980132dfbc44";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LicensePayload {
    pub email: String,
    pub tier: String,          // "Standard", "ProWorkstation", "Institutional"
    pub issued_at: String,
    pub expires_at: Option<String>,
    pub max_devices: u32,
    pub features: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LicenseVerificationResult {
    pub is_valid: bool,
    pub payload: Option<LicensePayload>,
    pub message: String,
}

pub fn verify_offline_license(license_key: &str) -> LicenseVerificationResult {
    let clean_key = license_key.trim();
    if clean_key.is_empty() {
        return LicenseVerificationResult {
            is_valid: false,
            payload: None,
            message: "Empty license key provided.".into(),
        };
    }

    // Format: ULTRA-[BASE64_JSON_PAYLOAD].[BASE64_SIGNATURE_64BYTES]
    let parts: Vec<&str> = clean_key.split('.').collect();
    if parts.len() != 2 {
        return LicenseVerificationResult {
            is_valid: false,
            payload: None,
            message: "Invalid license key format. Expected ULTRA-[PAYLOAD].[SIGNATURE]".into(),
        };
    }

    let payload_b64 = parts[0].strip_prefix("ULTRA-").unwrap_or(parts[0]);
    let sig_b64 = parts[1];

    let payload_bytes = match BASE64.decode(payload_b64) {
        Ok(b) => b,
        Err(_) => return LicenseVerificationResult {
            is_valid: false,
            payload: None,
            message: "Malformed license payload encoding.".into(),
        },
    };

    let sig_bytes = match BASE64.decode(sig_b64) {
        Ok(b) => b,
        Err(_) => return LicenseVerificationResult {
            is_valid: false,
            payload: None,
            message: "Malformed license signature encoding.".into(),
        },
    };

    if sig_bytes.len() != 64 {
        return LicenseVerificationResult {
            is_valid: false,
            payload: None,
            message: "Invalid signature byte length.".into(),
        };
    }

    // Parse JSON payload
    let payload: LicensePayload = match serde_json::from_slice(&payload_bytes) {
        Ok(p) => p,
        Err(_) => return LicenseVerificationResult {
            is_valid: false,
            payload: None,
            message: "Failed to deserialize license JSON schema.".into(),
        },
    };

    // Check expiration date if set
    if let Some(ref exp_str) = payload.expires_at {
        if let Ok(exp_date) = DateTime::parse_from_rfc3339(exp_str) {
            let now: DateTime<Utc> = Utc::now();
            if now > exp_date {
                return LicenseVerificationResult {
                    is_valid: false,
                    payload: Some(payload),
                    message: format!("License expired on {}", exp_str),
                };
            }
        }
    }

    // Verify cryptographic Ed25519 signature against embedded public key
    let pub_bytes = match hex::decode(MASTER_PUBLIC_KEY_HEX) {
        Ok(b) => b,
        Err(_) => return LicenseVerificationResult {
            is_valid: false,
            payload: None,
            message: "Internal cryptographic key configuration error.".into(),
        },
    };

    let verifying_key = match VerifyingKey::from_bytes(&pub_bytes.try_into().unwrap_or([0u8; 32])) {
        Ok(k) => k,
        Err(_) => return LicenseVerificationResult {
            is_valid: false,
            payload: None,
            message: "Invalid public key bytes.".into(),
        },
    };

    let sig = match Signature::from_slice(&sig_bytes) {
        Ok(s) => s,
        Err(_) => return LicenseVerificationResult {
            is_valid: false,
            payload: None,
            message: "Invalid signature structural format.".into(),
        },
    };

    match verifying_key.verify(&payload_bytes, &sig) {
        Ok(_) => LicenseVerificationResult {
            is_valid: true,
            payload: Some(payload),
            message: "Cryptographically verified license.".into(),
        },
        Err(_) => LicenseVerificationResult {
            is_valid: false,
            payload: None,
            message: "Cryptographic signature mismatch. License is counterfeit or tampered.".into(),
        },
    }
}
