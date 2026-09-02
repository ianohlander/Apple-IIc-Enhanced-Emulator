// SmartPort Virtual Hard Disk Controller for Apple IIc Ultra (Slot 7 $C0F0-$C0FF)
import { SmartPortHardDriveStatus } from '../../types/emulator';

export class SmartPortHardDrive {
  public name: string = 'ProDOS-32MB.hdv';
  public sizeMB: number = 32;
  public totalBlocks: number = 65535; // 32MB ProDOS Volume (512 bytes / block)
  public blocks: Uint8Array;
  public isModified: boolean = false;

  constructor(name: string = 'ProDOS-32MB.hdv', sizeMB: number = 32, initialData?: Uint8Array) {
    this.name = name;
    this.sizeMB = sizeMB;
    this.totalBlocks = (sizeMB * 1024 * 1024) / 512;

    if (initialData) {
      this.blocks = new Uint8Array(initialData.length);
      this.blocks.set(initialData);
    } else {
      this.blocks = new Uint8Array(this.totalBlocks * 512);
      this.initializeProDOSVolume();
    }
  }

  public readBlock(blockNum: number): Uint8Array {
    const offset = (blockNum % this.totalBlocks) * 512;
    return this.blocks.slice(offset, offset + 512);
  }

  public writeBlock(blockNum: number, data: Uint8Array): void {
    const offset = (blockNum % this.totalBlocks) * 512;
    this.blocks.set(data.slice(0, 512), offset);
    this.isModified = true;
  }

  private initializeProDOSVolume(): void {
    // Write standard ProDOS bootloader block (Block 0 & 1)
    const b0 = new Uint8Array(512);
    b0[0] = 0x01; // ProDOS boot marker
    b0[1] = 0x38; // SEC
    b0[2] = 0xb0; // BCS
    b0[3] = 0x03;
    this.blocks.set(b0, 0);

    // Initialize Volume Directory Key Block (Block 2)
    const dirBlock = new Uint8Array(512);
    dirBlock[0] = 0x00; // Previous block ptr (0)
    dirBlock[1] = 0x00;
    dirBlock[2] = 0x03; // Next block ptr (Block 3)
    dirBlock[3] = 0x00;
    dirBlock[4] = 0xf5; // Storage type ($F = Volume Directory) + Name length (5)
    
    // Volume Name: "ULTRA"
    const volName = "ULTRA";
    for (let i = 0; i < volName.length; i++) {
      dirBlock[5 + i] = volName.charCodeAt(i);
    }

    dirBlock[0x23] = 0x27; // Entry length (39)
    dirBlock[0x24] = 0x0d; // Entries per block (13)
    dirBlock[0x25] = 0x01; // File count (low)
    dirBlock[0x26] = 0x00; // File count (high)
    dirBlock[0x27] = 0x06; // Volume bitmap pointer (Block 6)
    dirBlock[0x28] = 0x00;
    dirBlock[0x29] = (this.totalBlocks & 0xff); // Total volume blocks low
    dirBlock[0x2a] = ((this.totalBlocks >> 8) & 0xff); // Total volume blocks high

    this.blocks.set(dirBlock, 2 * 512);
  }
}

export class SmartPortController {
  public hardDrive1: SmartPortHardDrive | null = null;
  public hardDrive2: SmartPortHardDrive | null = null;
  public activeUnit: number = 1;
  public lastAccessedBlock: number = 0;
  public isReading: boolean = false;
  public isWriting: boolean = false;

  // I/O Registers for slot 7 ($C0F0-$C0FF)
  public command: number = 0;
  public unit: number = 1;
  public blockLow: number = 0;
  public blockHigh: number = 0;
  public bufferPtrLow: number = 0;
  public bufferPtrHigh: number = 0;
  public statusRegister: number = 0; // 0 = Ready

  constructor() {
    // Mount default 32MB ProDOS virtual hard drive
    this.hardDrive1 = new SmartPortHardDrive('ProDOS-32MB.hdv', 32);
  }

  public mountHardDrive(unit: number, hd: SmartPortHardDrive): void {
    if (unit === 1) {
      this.hardDrive1 = hd;
    } else {
      this.hardDrive2 = hd;
    }
  }

  public getStatus(unit: number): SmartPortHardDriveStatus {
    const hd = unit === 1 ? this.hardDrive1 : this.hardDrive2;
    return {
      mounted: hd !== null,
      name: hd ? hd.name : 'No Hard Drive',
      sizeMB: hd ? hd.sizeMB : 0,
      totalBlocks: hd ? hd.totalBlocks : 0,
      lastAccessedBlock: this.lastAccessedBlock,
      isReading: this.isReading,
      isWriting: this.isWriting
    };
  }

  public read(offset: number): number {
    offset &= 0x0f;
    switch (offset) {
      case 0x00: return this.statusRegister;
      case 0x01: return this.unit;
      case 0x02: return this.blockLow;
      case 0x03: return this.blockHigh;
      default: return 0x00;
    }
  }

  public write(offset: number, value: number): void {
    offset &= 0x0f;
    value &= 0xff;

    switch (offset) {
      case 0x00: // Command register: $01=Read, $02=Write, $00=Status
        this.command = value;
        this.executeCommand();
        break;
      case 0x01:
        this.unit = value;
        break;
      case 0x02:
        this.blockLow = value;
        break;
      case 0x03:
        this.blockHigh = value;
        break;
    }
  }

  private executeCommand(): void {
    const blockNum = (this.blockHigh << 8) | this.blockLow;
    this.lastAccessedBlock = blockNum;
    const hd = this.unit === 1 ? this.hardDrive1 : this.hardDrive2;

    if (!hd) {
      this.statusRegister = 0x28; // No device error
      return;
    }

    if (this.command === 0x01) {
      // Read Block
      this.isReading = true;
      this.statusRegister = 0x00; // Success
      setTimeout(() => { this.isReading = false; }, 50);
    } else if (this.command === 0x02) {
      // Write Block
      this.isWriting = true;
      this.statusRegister = 0x00; // Success
      setTimeout(() => { this.isWriting = false; }, 50);
    }
  }
}
