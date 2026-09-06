// ============================================================================
// Copyright (c) 2026 Ian Ohlander. All rights reserved.
// Apple //c Ultra Architecture - Disk II Floppy Controller Card Adapter
// ============================================================================

import { IPeripheralCard } from '../IPeripheralCard';
import { DiskIIController } from '../../storage/diskII';

export class DiskIICard implements IPeripheralCard {
  public readonly name = 'Disk II 5.25" Floppy Controller';
  public readonly slot = 6;
  public readonly description = 'Wozniak IWM GCR floppy controller with dual 140KB drives ($C0E0 / $C600)';
  public readonly icon = '💾';
  public isPlugged = true;

  private controller: DiskIIController;

  constructor(controller?: DiskIIController) {
    this.controller = controller || new DiskIIController();
  }

  public ioRead(offset: number): number {
    return this.controller.read(offset);
  }

  public ioWrite(offset: number, value: number): void {
    this.controller.write(offset, value);
  }

  public romRead(offset: number): number {
    // ProDOS Disk II Controller identification: $C601 = $20, $C603 = $00, $C605 = $03, $C607 = $3C
    const bootRom: Record<number, number> = {
      0x01: 0x20,
      0x03: 0x00,
      0x05: 0x03,
      0x07: 0x3C,
      0x00: 0xA2, // LDX #$20
      0x02: 0xA0  // LDY #$00
    };
    return bootRom[offset] !== undefined ? bootRom[offset] : 0x60;
  }

  public reset(): void {
    this.controller.reset();
  }

  public getController(): DiskIIController {
    return this.controller;
  }

  public getDiagnostics(): Record<string, number | string | boolean> {
    const d1 = this.controller.drive1;
    return {
      'Drive 1': d1.disk ? d1.disk.name : 'EMPTY',
      'Track': d1.currentTrack,
      'Motor': d1.isMotorOn ? 'RUNNING' : 'OFF'
    };
  }
}
