// ============================================================================
// Copyright (c) 2026 Ian Ohlander. All rights reserved.
// Apple //c Ultra Architecture - Thunderclock Plus Real-Time Clock Card
// ============================================================================

import { IPeripheralCard } from '../IPeripheralCard';

export class ThunderclockCard implements IPeripheralCard {
  public readonly name = 'Thunderclock Plus Real-Time Clock';
  public readonly slot = 4;
  public readonly description = 'ProDOS real-time clock driver returning host system time & date ($C400)';
  public readonly icon = '⏰';
  public isPlugged = true;

  private latchRegister: number = 0;

    public ioRead(offset: number): number {
    const now = new Date();
    const table = [
      now.getSeconds(),
      now.getMinutes(),
      now.getHours(),
      now.getDate(),
      now.getMonth() + 1,
      now.getFullYear() % 100,
      Math.floor(now.getFullYear() / 100),
      now.getDay()
    ];
    return offset < table.length ? table[offset] : 0;
  }

  public ioWrite(offset: number, value: number): void {
    this.latchRegister = value;
  }

  public romRead(offset: number): number {
    // ProDOS Clock Card ID Signature at $C400:
    // $Cn00 = $08, $Cn02 = $28, $Cn04 = $58, $Cn06 = $70
    const romTable: Record<number, number> = {
      0x00: 0x08, // PHP
      0x02: 0x28, // PLP
      0x04: 0x58, // CLI
      0x06: 0x70  // BVS
    };
    return romTable[offset] !== undefined ? romTable[offset] : 0x60; // RTS
  }

  public reset(): void {
    this.latchRegister = 0;
  }

  public getDiagnostics(): Record<string, number | string | boolean> {
    const now = new Date();
    return {
      'Host Time': now.toLocaleTimeString(),
      'Host Date': now.toLocaleDateString(),
      'ProDOS Driver': 'ACTIVE @ $C400'
    };
  }
}
