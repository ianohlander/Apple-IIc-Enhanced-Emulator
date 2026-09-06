// ============================================================================
// Copyright (c) 2026 Ian Ohlander. All rights reserved.
// Apple //c Ultra Architecture - Passport / Yamaha Web MIDI Master Card
// ============================================================================

import { IPeripheralCard } from '../IPeripheralCard';

export class MidiCard implements IPeripheralCard {
  public readonly name = 'Passport & Web MIDI Master Controller';
  public readonly slot = 2;
  public readonly description = '6850 ACIA MIDI Controller connected to Web MIDI & USB Synthesizers';
  public readonly icon = '🎹';
  public isPlugged = true;

  public midiAccess: any = null;
  public midiOutput: any = null;
  public totalMidiEvents: number = 0;
  public lastMidiByte: number = 0;

  constructor() {
    this.initWebMidi();
  }

  private initWebMidi(): void {
    if (typeof navigator !== 'undefined' && (navigator as any).requestMIDIAccess) {
      (navigator as any).requestMIDIAccess()
        .then((access: any) => {
          this.midiAccess = access;
          const outputs = Array.from(access.outputs.values());
          if (outputs.length > 0) {
            this.midiOutput = outputs[0];
          }
        })
        .catch(() => { /* Web MIDI optional */ });
    }
  }

  public ioRead(offset: number): number {
    // 6850 ACIA Status register: Bit 1 = Tx Buffer Empty (1)
    if (offset === 0x00) return 0x02;
    if (offset === 0x01) return this.lastMidiByte;
    return 0x00;
  }

  public ioWrite(offset: number, value: number): void {
    if (offset === 0x01) {
      this.lastMidiByte = value;
      this.totalMidiEvents++;
      if (this.midiOutput) {
        try {
          this.midiOutput.send([value]);
        } catch (e) { /* ignore transmit error */ }
      }
    }
  }

  public romRead(offset: number): number {
    // $C201 = $38 (Serial/Modem card ID), $C203 = $18
    if (offset === 0x01) return 0x38;
    if (offset === 0x03) return 0x18;
    return 0x60; // RTS
  }

  public reset(): void {
    this.totalMidiEvents = 0;
  }

  public getDiagnostics(): Record<string, number | string | boolean> {
    return {
      'Web MIDI': this.midiOutput ? 'CONNECTED' : 'DISCONNECTED / SYNTH',
      'Total Bytes Sent': this.totalMidiEvents,
      'Last Byte': '$' + this.lastMidiByte.toString(16).toUpperCase()
    };
  }
}
