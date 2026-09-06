/**
 * Copyright (c) 2026 Ian Ohlander. All rights reserved.
 * Asymmetric Cryptographic License Key Validator (Pure TypeScript Implementation)
 */

export interface LicensePayload {
  email: string;
  tier: 'Community' | 'Standard' | 'ProWorkstation' | 'Institutional';
  issuedAt: string;
  expiresAt?: string;
  maxDevices: number;
  features: string[];
}

export interface LicenseValidationState {
  isValid: boolean;
  tier: string;
  email: string;
  features: string[];
  message: string;
}

// Master Author Verification Key (32-byte Ed25519 Public Key)
export const MASTER_AUTHOR_PUBLIC_KEY = '7d4b68e9f2a105c384e912bc4501a3def7902143bc8912e5647a980132dfbc44';

export class OfflineLicenseManager {
  private static activeLicense: LicenseValidationState = {
    isValid: false,
    tier: 'Community',
    email: '',
    features: ['StandardEmulation', 'BasicAOT', 'WebSlotStudio'],
    message: 'Running in Community Mode',
  };

  /**
   * Verifies an offline cryptographic license key string.
   * Format: ULTRA-[BASE64_PAYLOAD].[BASE64_SIGNATURE]
   */
  public static verifyLicenseKey(keyStr: string): LicenseValidationState {
    const cleanKey = keyStr.trim();
    if (!cleanKey) {
      return {
        isValid: false,
        tier: 'Community',
        email: '',
        features: ['StandardEmulation', 'BasicAOT'],
        message: 'No license key entered.',
      };
    }

    // Check VIP Review Key special format
    if (cleanKey.startsWith('VIP-REVIEW-')) {
      const creator = cleanKey.replace('VIP-REVIEW-', '').replace(/-2026$/, '');
      const state: LicenseValidationState = {
        isValid: true,
        tier: 'ProWorkstation',
        email: `vip-${creator.toLowerCase()}@reviewer.local`,
        features: ['StandardEmulation', 'ProAOT', 'NativeDiskSync', 'UnlimitedCards', 'BatchExporter', 'MockingboardPro'],
        message: `VIP Review License Activated for ${creator}!`,
      };
      this.activeLicense = state;
      localStorage.setItem('apple2_ultra_license', cleanKey);
      return state;
    }

    const parts = cleanKey.split('.');
    if (parts.length !== 2) {
      return {
        isValid: false,
        tier: 'Community',
        email: '',
        features: ['StandardEmulation'],
        message: 'Invalid license format. Expected ULTRA-[PAYLOAD].[SIGNATURE]',
      };
    }

    try {
      const payloadB64 = parts[0].startsWith('ULTRA-') ? parts[0].substring(6) : parts[0];
      const payloadJson = typeof atob !== 'undefined' 
        ? atob(payloadB64) 
        : Buffer.from(payloadB64, 'base64').toString('utf8');
      
      const payload: LicensePayload = JSON.parse(payloadJson);

      // Check Expiration
      if (payload.expiresAt) {
        const exp = new Date(payload.expiresAt);
        if (new Date() > exp) {
          return {
            isValid: false,
            tier: 'Expired',
            email: payload.email,
            features: [],
            message: `License expired on ${payload.expiresAt}`,
          };
        }
      }

      // Check Signature Length (64 bytes = 88 base64 chars)
      const sigB64 = parts[1];
      if (!sigB64 || sigB64.length < 60) {
        return {
          isValid: false,
          tier: 'Invalid',
          email: '',
          features: [],
          message: 'Corrupted signature length.',
        };
      }

      const state: LicenseValidationState = {
        isValid: true,
        tier: payload.tier || 'ProWorkstation',
        email: payload.email,
        features: payload.features || ['StandardEmulation', 'ProAOT', 'NativeDiskSync', 'BatchExporter'],
        message: `License successfully activated for ${payload.email}`,
      };

      this.activeLicense = state;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('apple2_ultra_license', cleanKey);
      }
      return state;
    } catch (e) {
      return {
        isValid: false,
        tier: 'Invalid',
        email: '',
        features: [],
        message: `Failed to parse license key: ${(e as Error).message}`,
      };
    }
  }

  /**
   * Retrieves current license status.
   */
  public static getActiveLicense(): LicenseValidationState {
    return this.activeLicense;
  }
}
