// ============================================================================
// Copyright (c) 2026 Ian Ohlander. All rights reserved.
// Apple //c Ultra Architecture - User-Scriptable Custom Sandbox Card
// ============================================================================

import { IPeripheralCard } from '../IPeripheralCard';

export class CustomScriptableCard implements IPeripheralCard {
  public name = 'Custom User-Scriptable Card';
  public slot = 3;
  public description = 'Custom JavaScript sandbox card responding to $C080+$n0, $Cn00, and external I/O bridges';
  public icon = '🧪';
  public isPlugged = true;

  public registers: number[] = new Array(16).fill(0);
  public rom: number[] = new Array(256).fill(0x60); // Default 65C02 RTS ($60)
  public expansionRom: number[] = new Array(2048).fill(0x60);

  // Dynamic User Handlers
  public onReadHandler?: (offset: number) => number;
  public onWriteHandler?: (offset: number, value: number) => void;
  public onRomReadHandler?: (offset: number) => number;
  public onTickHandler?: (cycles: number) => void;
  public onResetHandler?: () => void;

  // Custom User State Storage Dictionary
  public state: Record<string, any> = {};

  public ioRead(offset: number): number {
    const regOffset = offset & 0x0f;
    if (this.onReadHandler) {
      try {
        const val = this.onReadHandler(regOffset);
        if (typeof val === 'number') return val & 0xff;
      } catch (e) {
        console.warn('Custom Card onReadHandler error:', e);
      }
    }
    return this.registers[regOffset] || 0;
  }

  public ioWrite(offset: number, value: number): void {
    const regOffset = offset & 0x0f;
    const val = value & 0xff;
    this.registers[regOffset] = val;
    if (this.onWriteHandler) {
      try {
        this.onWriteHandler(regOffset, val);
      } catch (e) {
        console.warn('Custom Card onWriteHandler error:', e);
      }
    }
  }

  public romRead(offset: number): number {
    const romOffset = offset & 0xff;
    if (this.onRomReadHandler) {
      try {
        const val = this.onRomReadHandler(romOffset);
        if (typeof val === 'number') return val & 0xff;
      } catch (e) {
        console.warn('Custom Card onRomReadHandler error:', e);
      }
    }
    return this.rom[romOffset] !== undefined ? this.rom[romOffset] : 0x60;
  }

  public expansionRomRead(offset: number): number {
    const expOffset = offset & 0x7ff;
    return this.expansionRom[expOffset] !== undefined ? this.expansionRom[expOffset] : 0x60;
  }

  public tick(cycles: number): void {
    if (this.onTickHandler) {
      try {
        this.onTickHandler(cycles);
      } catch (e) {
        console.warn('Custom Card onTickHandler error:', e);
      }
    }
  }

  public reset(): void {
    this.registers.fill(0);
    if (this.onResetHandler) {
      try {
        this.onResetHandler();
      } catch (e) {
        console.warn('Custom Card onResetHandler error:', e);
      }
    }
  }

  public setRegister(offset: number, value: number): void {
    this.registers[offset & 0x0f] = value & 0xff;
  }

  public getRegister(offset: number): number {
    return this.registers[offset & 0x0f] || 0;
  }

  public loadRomBytes(bytes: number[] | Uint8Array, startOffset = 0): void {
    for (let i = 0; i < bytes.length && (startOffset + i) < 256; i++) {
      this.rom[startOffset + i] = bytes[i] & 0xff;
    }
  }

  public getDiagnostics(): Record<string, number | string | boolean> {
    return {
      'Card Name': this.name,
      'Slot Location': `Slot ${this.slot} ($C0${(8 + this.slot).toString(16).toUpperCase()}0)`,
      'Active Handlers': `Read: ${!!this.onReadHandler}, Write: ${!!this.onWriteHandler}, Tick: ${!!this.onTickHandler}`,
      'Latched Registers': this.registers.filter(r => r > 0).length,
      'Plugged Status': this.isPlugged
    };
  }
}
