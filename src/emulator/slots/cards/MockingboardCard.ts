// ============================================================================
// Copyright (c) 2026 Ian Ohlander. All rights reserved.
// Apple //c Ultra Architecture - Mockingboard PSG Sound Card Adapter
// ============================================================================

import { IPeripheralCard } from '../IPeripheralCard';
import { MockingboardController } from '../../audio';

export class MockingboardCard implements IPeripheralCard {
  public readonly name = 'Sweet Micro Mockingboard ' + 'Stereo PSG';
  public readonly slot = 4;
  public readonly description = 'Dual AY-3-8910 sound synthesizers + 6522 VIAs (6 tone voices & noise)';
  public readonly icon = '🔊';
  public isPlugged = true;

  private controller: MockingboardController;

  constructor(controller?: MockingboardController) {
    this.controller = controller || new MockingboardController();
  }

  public ioRead(offset: number): number {
    return this.controller.read(offset);
  }

  public ioWrite(offset: number, value: number): void {
    this.controller.write(offset, value);
  }

  public romRead(offset: number): number {
    return 0x60; // RTS
  }

  public reset(): void {
    this.controller.reset();
  }

  public getController(): MockingboardController {
    return this.controller;
  }

  public getDiagnostics(): Record<string, number | string | boolean> {
    return {
      'Channels': '6 Tone + 2 Noise + 2 Envelope',
      'AY-3 Chips': '2x AY-3-8910',
      'VIA Registers': '6522 VIA @ $C0C0-$C0CF'
    };
  }
}
