/**
 * Copyright (c) 2026 Ian Ohlander. All rights reserved.
 * Desktop Native Bridge: Connects UI to Tauri 2.0 native commands or falls back to Web runtime.
 */

export interface NativeCardMeta {
  name: string;
  filename: string;
  byte_size: number;
  modified_at: string;
}

export interface LicenseCheckResult {
  isValid: boolean;
  tier: string;
  email?: string;
  message: string;
}

export class DesktopBridge {
  private static isDesktopRuntime: boolean | null = null;

  /**
   * Detects if the current environment is running inside the Tauri native desktop wrapper.
   */
  public static isDesktop(): boolean {
    if (this.isDesktopRuntime !== null) {
      return this.isDesktopRuntime;
    }
    this.isDesktopRuntime = typeof window !== 'undefined' && 
      ('__TAURI__' in window || '__TAURI_INTERNALS__' in window);
    return this.isDesktopRuntime;
  }

  /**
   * Invokes a native Tauri command if in desktop mode, or executes a web fallback.
   */
  public static async invokeCommand<T>(cmd: string, args: Record<string, unknown> = {}): Promise<T | null> {
    if (this.isDesktop()) {
      try {
        const tauriCore = (window as unknown as { __TAURI__: { core: { invoke: (cmd: string, args: unknown) => Promise<T> } } }).__TAURI__;
        if (tauriCore && tauriCore.core) {
          return await tauriCore.core.invoke(cmd, args);
        }
      } catch (err) {
        console.warn(`[DesktopBridge] Failed to invoke native command "${cmd}":`, err);
      }
    }
    return null;
  }

  /**
   * Lists custom expansion cards stored in ~/Documents/Apple2Ultra/Cards/.
   */
  public static async listSavedCards(): Promise<NativeCardMeta[]> {
    if (this.isDesktop()) {
      const cards = await this.invokeCommand<NativeCardMeta[]>('list_saved_cards');
      if (cards) return cards;
    }
    
    // Web Fallback: localStorage
    const saved = localStorage.getItem('apple2_ultra_custom_cards');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Object.keys(parsed).map(k => ({
          name: k,
          filename: `${k}.card.js`,
          byte_size: parsed[k].length,
          modified_at: 'Web Storage',
        }));
      } catch {
        return [];
      }
    }
    return [];
  }

  /**
   * Saves a custom expansion card to disk (~/Documents/Apple2Ultra/Cards/).
   */
  public static async saveCard(name: string, code: string): Promise<boolean> {
    if (this.isDesktop()) {
      const path = await this.invokeCommand<string>('save_local_card', { cardName: name, cardCode: code });
      if (path) return true;
    }

    // Web Fallback: localStorage
    try {
      const existing = JSON.parse(localStorage.getItem('apple2_ultra_custom_cards') || '{}');
      existing[name] = code;
      localStorage.setItem('apple2_ultra_custom_cards', JSON.stringify(existing));
      return true;
    } catch {
      return false;
    }
  }
}
