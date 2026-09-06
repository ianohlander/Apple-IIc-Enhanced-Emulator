// ============================================================================
// Copyright (c) 2026 Ian Ohlander. All rights reserved.
// Apple //c Ultra Architecture - User-Scriptable Custom Sandbox Card
// ============================================================================

import { IPeripheralCard } from '../IPeripheralCard';

export class CustomScriptableCard implements IPeripheralCard {
  public name = 'Custom User-Scriptable Card';
  public slot = 3;
  public description = 'Custom JavaScript sandbox card responding to $C080+$n0 and $Cn00';
  public icon = '🧪';
  public isPlugged = true;

  public registers: number[] = new Array(16).fill(0);
  public rom: number[] = new Array(256).fill(0x60); // Default RTS

  public onReadHandler?: (offset: number) => number;
  public onWriteHandler?: (offset: number, value: number) => void;

  public ioRead(offset: number): number {
    if (this.onReadHandler) {
      try {
        return this.onReadHandler(offset) & 0xff;
      } catch (e) { /* ignore sandbox error */ }
    }
    return this.registers[offset & 0x0f] || 0;
  }

  public ioWrite(offset: number, value: number): void {
    const val = value & 0xff;
    this.registers[offset & 0x0f] = val;
    if (this.onWriteHandler) {
      try {
        this.onWriteHandler(offset, val);
      } catch (e) { /* ignore sandbox error */ }
    }
  }

  public romRead(offset: number): number {
    return this.rom[offset & 0xff] || 0x60;
  }

  public reset(): void {
    this.registers.fill(0);
  }

  public getDiagnostics(): Record<string, number | string | boolean> {
    return {
      'Mode': 'User JavaScript Sandbox',
      'Registers Latched': this.registers.filter(r => r > 0).length,
      'Slot': this.slot
    };
  }
}
