// ============================================================================
// Copyright (c) 2026 Ian Ohlander. All rights reserved.
// Apple //c Ultra Architecture - Virtual Peripheral Expansion Card Interface
// ============================================================================

export interface IPeripheralCard {
  /** Human-readable display name of the card */
  readonly name: string;

  /** Expansion slot index (1 through 7) */
  readonly slot: number;

  /** Brief description of hardware functionality */
  readonly description: string;

  /** Unicode / emoji icon representative of the card */
  readonly icon: string;

  /** Whether the card is currently plugged into the motherboard bus */
  isPlugged: boolean;

  /**
   * Read from dedicated 16-byte I/O softswitch register space ($C080 + $n0)
   * @param offset Register offset 0x00 to 0x0F
   * @returns 8-bit register data byte
   */
  ioRead(offset: number): number;

  /**
   * Write to dedicated 16-byte I/O softswitch register space ($C080 + $n0)
   * @param offset Register offset 0x00 to 0x0F
   * @param value 8-bit data byte written by CPU
   */
  ioWrite(offset: number, value: number): void;

  /**
   * Read from on-card 256-byte firmware ROM ($C100 + $n00 to $C1FF + $n00)
   * @param offset Byte offset 0x00 to 0xFF
   * @returns 8-bit opcode/data byte
   */
  romRead(offset: number): number;

  /**
   * Optional: Read from shared 2KB expansion ROM space ($C800–$CFFF)
   * @param offset Byte offset 0x000 to 0x7FF
   */
  expansionRomRead?(offset: number): number;

  /** Reset internal card state to power-on defaults */
  reset(): void;

  /**
   * Optional cycle tick hook for timing counters, audio DACs, or periodic IRQs
   * @param cycles Number of CPU clock cycles elapsed
   */
  tick?(cycles: number): void;

  /**
   * Optional diagnostics inspector returning key-value status
   */
  getDiagnostics?(): Record<string, number | string | boolean>;
}
