export enum VideoMode {
  TEXT_40 = 'TEXT_40',
  TEXT_80 = 'TEXT_80',
  LGR = 'LGR',
  DLGR = 'DLGR',
  HGR = 'HGR',
  DHGR = 'DHGR'
}

export enum DisplayPhosphor {
  GREEN = 'GREEN',
  AMBER = 'AMBER',
  WHITE = 'WHITE',
  COLOR_NTSC = 'COLOR_NTSC',
  RGB = 'RGB'
}

export enum ClockSpeed {
  SPEED_1MHZ = 1.023,
  SPEED_2_8MHZ = 2.8,
  SPEED_4MHZ = 4.0,
  SPEED_8MHZ = 8.0,
  SPEED_16MHZ = 16.0,
  SPEED_TURBO = 50.0
}

export interface CPU65C02State {
  a: number;      // Accumulator (8-bit)
  x: number;      // X Index (8-bit)
  y: number;      // Y Index (8-bit)
  sp: number;     // Stack Pointer (8-bit)
  pc: number;     // Program Counter (16-bit)
  status: {
    n: boolean;   // Negative (bit 7)
    v: boolean;   // Overflow (bit 6)
    e: boolean;   // Reserved/Expansion (bit 5)
    b: boolean;   // Break (bit 4)
    d: boolean;   // Decimal (bit 3)
    i: boolean;   // Interrupt Disable (bit 2)
    z: boolean;   // Zero (bit 1)
    c: boolean;   // Carry (bit 0)
  };
  cycles: number;
  totalCycles: number;
  isHalted: boolean;
  waitingForInterrupt: boolean;
}

export interface SoftswitchesState {
  // Display switches
  text: boolean;        // $C050 TXTCLR / $C051 TXTSET
  mixed: boolean;       // $C052 MIXCLR / $C053 MIXSET
  page2: boolean;       // $C054 TXTPAGE1 / $C055 TXTPAGE2
  hires: boolean;       // $C056 LORES / $C057 HIRES
  col80: boolean;       // $C00C 80COLCLR / $C00D 80COLSET
  dhires: boolean;      // $C05E DHIRESOFF / $C05F DHIRESON
  altCharset: boolean;  // $C00E / $C00F MouseText/Alt Charset
  
  // Memory management switches (MMU)
  store80: boolean;     // $C000 / $C001 80STORE
  ramrd: boolean;       // $C002 / $C003 Read Main/Aux RAM
  ramwrt: boolean;      // $C004 / $C005 Write Main/Aux RAM
  altzp: boolean;       // $C008 / $C009 Main/Aux Zero Page & Stack
  slotc3rom: boolean;   // $C00A / $C00B Slot 3 / Internal ROM
  intcxrom: boolean;    // $C006 / $C007 Internal CX ROM / Slot ROM
  
  // Language card switches ($C080-$C08F)
  lcBank2: boolean;     // Bank 2 (true) or Bank 1 (false) ($D000-$DFFF)
  lcReadRam: boolean;   // Read from LC RAM (true) or ROM (false)
  lcWriteRam: boolean;  // Write enable to LC RAM
  lcPreWrite: boolean;  // Two consecutive accesses required to enable write
  
  // Extended Memory (Slinky / RamWorks)
  slinkyAddress: number;// 24-bit expanded RAM address
  ramworksBank: number; // Active 64KB Aux Bank (0-255, up to 16MB)
}

export interface DisassemblyLine {
  address: number;
  bytes: number[];
  opcode: string;
  operands: string;
  cycles: number;
  label?: string;
  comment?: string;
  isBreakpoint?: boolean;
}

export interface DiskDriveStatus {
  mounted: boolean;
  name: string;
  track: number;
  sector: number;
  isMotorOn: boolean;
  isWriteProtected: boolean;
  isReading: boolean;
  isWriting: boolean;
  type: '5.25' | '3.5' | 'HD';
  sizeBytes: number;
}

export interface SmartPortHardDriveStatus {
  mounted: boolean;
  name: string;
  sizeMB: number;
  totalBlocks: number;
  lastAccessedBlock: number;
  isReading: boolean;
  isWriting: boolean;
}

export interface RomPackage {
  id: string;
  name: string;
  description: string;
  version: string;
  sizeBytes: number;
  hasProDOS: boolean;
  hasDOS33: boolean;
  hasAutoBoot: boolean;
  data: Uint8Array;
}

export interface ModernCodeCompilationResult {
  success: boolean;
  language: 'java' | 'csharp';
  sourceCode: string;
  byteCodeSize: number;
  generated6502Asm: string;
  binary: Uint8Array;
  entryAddress: number;
  symbols: Array<{ name: string; address: number }>;
  logs: string[];
}
