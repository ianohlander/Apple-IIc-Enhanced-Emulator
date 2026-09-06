// ============================================================================
// Copyright (c) 2026 Ian Ohlander. All rights reserved.
// Apple //c Ultra Architecture - SmartPort 32MB Hard Disk Controller Card Adapter
// ============================================================================

import { IPeripheralCard } from '../IPeripheralCard';
import { SmartPortController } from '../../storage/smartport';

export class SmartPortCard implements IPeripheralCard {
  public readonly name = 'SmartPort 32MB SCSI / Hard Disk Controller';
  public readonly slot = 7;
  public readonly description = 'High-capacity 32MB block storage controller (65,536 blocks) with ProDOS MLI ($C700)';
  public readonly icon = '💽';
  public isPlugged = true;

  private controller: SmartPortController;

  constructor(controller?: SmartPortController) {
    this.controller = controller || new SmartPortController();
  }

  public ioRead(offset: number): number {
    return this.controller.read(offset);
  }

  public ioWrite(offset: number, value: number): void {
    this.controller.write(offset, value);
  }

  public romRead(offset: number): number {
    // ProDOS SmartPort Block Device ID at $C700:
    // $Cn01 = $20, $Cn03 = $00, $Cn05 = $03, $Cn07 = $00 (ProDOS Block Device)
    const rom: Record<number, number> = {
      0x01: 0x20,
      0x03: 0x00,
      0x05: 0x03,
      0x07: 0x00
    };
    return rom[offset] !== undefined ? rom[offset] : 0x60;
  }

  public reset(): void {
    this.controller.reset();
  }

  public getController(): SmartPortController {
    return this.controller;
  }

  public getDiagnostics(): Record<string, number | string | boolean> {
    return {
      'Volume': '/HD (ProDOS)',
      'Capacity': '32,768 KB (32 MB)',
      'Total Blocks': '65,536 Blocks',
      'Status': 'ONLINE'
    };
  }
}
