// ============================================================================
// Copyright (c) 2026 Ian Ohlander. All rights reserved.
// Apple //c Ultra Architecture - Central Slot & Peripheral Bus Manager
// ============================================================================

import { IPeripheralCard } from './IPeripheralCard';
import { PrinterCard } from './cards/PrinterCard';
import { MidiCard } from './cards/MidiCard';
import { ThunderclockCard } from './cards/ThunderclockCard';
import { MockingboardCard } from './cards/MockingboardCard';
import { UthernetCard } from './cards/UthernetCard';
import { DiskIICard } from './cards/DiskIICard';
import { SmartPortCard } from './cards/SmartPortCard';
import { CustomScriptableCard } from './cards/CustomScriptableCard';
import { DiskIIController } from '../storage/diskII';
import { SmartPortController } from '../storage/smartport';
import { MockingboardController } from '../audio';
import { UthernetController } from '../network/uthernet';

export class SlotManager {
  private slots: (IPeripheralCard | null)[] = [
    null, // Slot 0
    null, // Slot 1 (Printer)
    null, // Slot 2 (MIDI/Serial)
    null, // Slot 3 (80-Column / Custom)
    null, // Slot 4 (Thunderclock / Mockingboard A)
    null, // Slot 5 (Uthernet / Mockingboard B)
    null, // Slot 6 (Disk II)
    null  // Slot 7 (SmartPort 32MB)
  ];

  public onSlotChanged?: (slot: number, card: IPeripheralCard | null) => void;

  constructor(
    diskController?: DiskIIController,
    smartPort?: SmartPortController,
    mockingboard?: MockingboardController,
    uthernet?: UthernetController
  ) {
    this.initDefaultCards(diskController, smartPort, mockingboard, uthernet);
  }

  private initDefaultCards(
    diskController?: DiskIIController,
    smartPort?: SmartPortController,
    mockingboard?: MockingboardController,
    uthernet?: UthernetController
  ): void {
    this.slots[1] = new PrinterCard();
    this.slots[2] = new MidiCard();
    this.slots[3] = new CustomScriptableCard();
    this.slots[4] = new ThunderclockCard();
    this.slots[5] = new UthernetCard(uthernet);
    this.slots[6] = new DiskIICard(diskController);
    this.slots[7] = new SmartPortCard(smartPort);
  }

  public getCard(slotNumber: number): IPeripheralCard | null {
    if (slotNumber < 1 || slotNumber > 7) return null;
    return this.slots[slotNumber];
  }

  public plugCard(slotNumber: number, card: IPeripheralCard): void {
    if (slotNumber < 1 || slotNumber > 7) return;
    card.isPlugged = true;
    this.slots[slotNumber] = card;
    if (this.onSlotChanged) this.onSlotChanged(slotNumber, card);
  }

  public unplugCard(slotNumber: number): IPeripheralCard | null {
    if (slotNumber < 1 || slotNumber > 7) return null;
    const existing = this.slots[slotNumber];
    if (existing) {
      existing.isPlugged = false;
      this.slots[slotNumber] = null;
      if (this.onSlotChanged) this.onSlotChanged(slotNumber, null);
    }
    return existing;
  }

  public toggleCard(slotNumber: number): boolean {
    const card = this.slots[slotNumber];
    if (!card) return false;
    card.isPlugged = !card.isPlugged;
    if (this.onSlotChanged) this.onSlotChanged(slotNumber, card);
    return card.isPlugged;
  }

  public readIo(addr: number): number {
    const slot = (addr >> 4) & 0x07;
    const offset = addr & 0x0f;
    const card = this.slots[slot];
    if (card && card.isPlugged) {
      return card.ioRead(offset);
    }
    return 0x00;
  }

  public writeIo(addr: number, val: number): void {
    const slot = (addr >> 4) & 0x07;
    const offset = addr & 0x0f;
    const card = this.slots[slot];
    if (card && card.isPlugged) {
      card.ioWrite(offset, val);
    }
  }

  public readRom(addr: number): number {
    const slot = (addr >> 8) & 0x07;
    const offset = addr & 0xff;
    const card = this.slots[slot];
    if (card && card.isPlugged) {
      return card.romRead(offset);
    }
    return 0x60; // Default RTS
  }

  public resetAll(): void {
    for (let s = 1; s <= 7; s++) {
      const card = this.slots[s];
      if (card) card.reset();
    }
  }

  public tickAll(cycles: number): void {
    for (let s = 1; s <= 7; s++) {
      const card = this.slots[s];
      if (card && card.isPlugged && card.tick) {
        card.tick(cycles);
      }
    }
  }

  public getAllSlots(): { slot: number; card: IPeripheralCard | null }[] {
    const result = [];
    for (let s = 1; s <= 7; s++) {
      result.push({ slot: s, card: this.slots[s] });
    }
    return result;
  }
}
