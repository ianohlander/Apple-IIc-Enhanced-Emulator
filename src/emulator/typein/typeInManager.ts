import { Apple2cMMU } from '../mmu/Apple2cMMU';

export interface MonitorHexEntry {
  address: number;
  bytes: number[];
}

export type TypeInMode = 'basic' | 'monitor' | 'raw';

export class TypeInManager {
  private mmu: Apple2cMMU;
  private keyQueue: number[] = [];
  private typingIntervalId: number | null = null;
  public onProgress?: (current: number, total: number) => void;
  public onComplete?: () => void;

  constructor(mmu: Apple2cMMU) {
    this.mmu = mmu;
  }

  public detectMode(text: string): TypeInMode {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return 'basic';

    const firstLine = lines[0];
    const isBasic = /^\d+\s+/.test(firstLine);
    if (isBasic) return 'basic';

    const isMonitor = /^[0-9A-Fa-f]{3,4}[:\s\.]/.test(firstLine);
    if (isMonitor) return 'monitor';

    return 'raw';
  }

  public parseMonitorHex(text: string): MonitorHexEntry[] {
    const entries: MonitorHexEntry[] = [];
    const lines = text.split('\n');

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#') || line.startsWith(';')) continue;
      const entry = this.parseMonitorLine(line);
      if (entry) entries.push(entry);
    }
    return entries;
  }

  private parseMonitorLine(line: string): MonitorHexEntry | null {
    const match = line.match(/^([0-9A-Fa-f]{3,4})[:\s](.*)/);
    if (!match) return null;

    const startAddr = parseInt(match[1], 16);
    const hexTokens = match[2].trim().split(/\s+/);
    const bytes: number[] = [];

    for (const token of hexTokens) {
      if (/^[0-9A-Fa-f]{2}$/.test(token)) {
        bytes.push(parseInt(token, 16));
      }
    }

    return bytes.length > 0 ? { address: startAddr, bytes } : null;
  }

  public injectMonitorDirectly(entries: MonitorHexEntry[]): number {
    let totalBytes = 0;
    for (const entry of entries) {
      for (let i = 0; i < entry.bytes.length; i++) {
        this.mmu.write((entry.address + i) & 0xffff, entry.bytes[i]);
        totalBytes++;
      }
    }
    return totalBytes;
  }

  public queueText(text: string): void {
    this.stopTyping();
    this.keyQueue = [];

    for (let i = 0; i < text.length; i++) {
      const ch = text.charCodeAt(i);
      if (ch === 10) {
        this.keyQueue.push(13); // Apple II CR
      } else if (ch >= 32 && ch < 127) {
        this.keyQueue.push(ch);
      }
    }
    this.keyQueue.push(13);
  }

  public startTyping(delayMs: number = 20): void {
    this.stopTyping();
    const total = this.keyQueue.length;
    let typed = 0;

    this.typingIntervalId = window.setInterval(() => {
      if (this.keyQueue.length === 0) {
        this.stopTyping();
        if (this.onComplete) this.onComplete();
        return;
      }

      const key = this.keyQueue.shift()!;
      this.mmu.setKey(key);
      typed++;

      if (this.onProgress) {
        this.onProgress(typed, total);
      }
    }, delayMs);
  }

  public stopTyping(): void {
    if (this.typingIntervalId !== null) {
      clearInterval(this.typingIntervalId);
      this.typingIntervalId = null;
    }
  }

  public cleanOcrText(rawText: string): string {
    return rawText
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/^[oO](\d+)/gm, '0$1')
      .replace(/^I(\d+)/gm, '1$1')
      .replace(/\r\n/g, '\n');
  }
}
