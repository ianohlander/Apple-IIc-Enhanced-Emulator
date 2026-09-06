// ============================================================================
// Copyright (c) 2026 Ian Ohlander. All rights reserved.
// Apple //c Ultra Architecture - Virtual Dot Matrix / ImageWriter II Printer Card
// ============================================================================

import { IPeripheralCard } from '../IPeripheralCard';

export class PrinterCard implements IPeripheralCard {
  public readonly name = 'Apple ImageWriter II & Serial Printer';
  public readonly slot = 1;
  public readonly description = 'Dot matrix & serial printer controller with text buffer capture (PR#1)';
  public readonly icon = '🖨️';
  public isPlugged = true;

  public paperBuffer: string = '';
  public totalCharactersPrinted: number = 0;
  public onPrintChar?: (char: string) => void;

  private baudRate: number = 9600;
  private statusRegister: number = 0x10; // Ready / Buffer empty

  public ioRead(offset: number): number {
    if (offset === 0x00) return 0x00; // ACIA Data in
    if (offset === 0x01) return this.statusRegister; // ACIA Status (bit 4 = Tx empty)
    if (offset === 0x02) return 0x00; // Command register
    if (offset === 0x03) return 0x1e; // Control register (9600 baud, 8-N-1)
    return 0x00;
  }

  public ioWrite(offset: number, value: number): void {
    if (offset === 0x00) {
      this.receiveByte(value);
    }
  }

  public romRead(offset: number): number {
    // ProDOS / Pascal Serial Card Identification bytes:
    // $C101 = $38 (Printer card ID), $C103 = $18, $C105 = $01
    if (offset === 0x01) return 0x38;
    if (offset === 0x03) return 0x18;
    if (offset === 0x05) return 0x01;
    if (offset === 0x07) return 0x31;
    // $C100 entry vector: RTS ($60)
    return 0x60;
  }

  public reset(): void {
    this.statusRegister = 0x10;
  }

  public clearPaper(): void {
    this.paperBuffer = '';
    this.totalCharactersPrinted = 0;
  }

  public receiveByte(byte: number): void {
    const ascii = byte & 0x7f;
    const char = String.fromCharCode(ascii);
    this.paperBuffer += char;
    this.totalCharactersPrinted++;
    if (this.onPrintChar) {
      this.onPrintChar(char);
    }
  }

  public getDiagnostics(): Record<string, number | string | boolean> {
    return {
      'Chars Printed': this.totalCharactersPrinted,
      'Buffer Length': this.paperBuffer.length,
      'Baud Rate': this.baudRate,
      'Status': this.isPlugged ? 'ONLINE' : 'OFFLINE'
    };
  }
}
