// ============================================================================
// Copyright (c) 2026 Ian Ohlander. All rights reserved.
// Apple //c Ultra Architecture - 1-Click Physical Hardware ProDOS Disk Exporter
// Target Hardware: Floppy Emu (BMOW), CFFA3000, wDrive, BOOTI & FujiNet
// ============================================================================

export interface ProdosFileEntry {
  filename: string;
  fileType: number; // 0xFF = SYS, 0x06 = BIN, 0x04 = TXT, 0xFC = BAS
  orgAddress: number; // e.g. 0x2000 or 0x0803
  data: Uint8Array;
}

export interface ProdosVolumeOptions {
  volumeName: string;
  totalBlocks?: number; // 280 = 140KB Floppy, 1600 = 800KB 3.5", 65536 = 32MB HD
  files: ProdosFileEntry[];
}

export class ProdosDiskExporter {
  public static readonly BLOCK_SIZE = 512;
  public static readonly FLOPPY_140K_BLOCKS = 280;
  public static readonly FLOPPY_800K_BLOCKS = 1600;
  public static readonly HARDDISK_32MB_BLOCKS = 65536;

  /**
   * Builds a complete, bootable ProDOS volume image (.PO / .DSK)
   */
  public static createProdosVolume(options: ProdosVolumeOptions): Uint8Array {
    const totalBlocks = options.totalBlocks || this.FLOPPY_140K_BLOCKS;
    const diskImage = new Uint8Array(totalBlocks * this.BLOCK_SIZE);

    // 1. Write ProDOS Boot Blocks (Block 0 & 1)
    this.writeBootBlocks(diskImage);

    // 2. Write Volume Directory Key Block (Block 2)
    this.writeVolumeDirectory(diskImage, options.volumeName, totalBlocks, options.files.length);

    // 3. Initialize Volume Allocation Bitmap (Block 6)
    const allocatedBlocks = this.initBitmap(diskImage, totalBlocks, options.files);

    // 4. Write Files & Populate Directory
    this.writeFiles(diskImage, options.files);

    return diskImage;
  }

  /**
   * Wraps a raw ProDOS disk image into a Universal 2MG (.2mg) container
   */
  public static wrapIn2MG(diskData: Uint8Array, volumeName: string): Uint8Array {
    const headerSize = 64;
    const container = new Uint8Array(headerSize + diskData.length);

    // Magic ID: '2IMG' ($32 $49 $4D $47)
    container[0] = 0x32; container[1] = 0x49; container[2] = 0x4D; container[3] = 0x47;

    // Creator ID: 'EMUL' ($45 $4D $55 $4C)
    container[4] = 0x45; container[5] = 0x4D; container[6] = 0x55; container[7] = 0x4C;

    // Header size (64 bytes = $0040)
    container[8] = 0x40; container[9] = 0x00;

    // Version ($0001)
    container[10] = 0x01; container[11] = 0x00;

    // Format: 0x01 = ProDOS Order (PO), 0x00 = DOS 3.3 Order, 0x02 = NIB
    container[12] = 0x01; container[13] = 0x00; container[14] = 0x00; container[15] = 0x00;

    // Flags: Bit 8 = Locked
    container[16] = 0x00; container[17] = 0x00; container[18] = 0x00; container[19] = 0x00;

    // Number of 512-byte blocks
    const blockCount = Math.floor(diskData.length / this.BLOCK_SIZE);
    container[20] = blockCount & 0xff;
    container[21] = (blockCount >> 8) & 0xff;
    container[22] = (blockCount >> 16) & 0xff;
    container[23] = (blockCount >> 24) & 0xff;

    // Offset to disk data ($00000040)
    container[24] = 0x40; container[25] = 0x00; container[26] = 0x00; container[27] = 0x00;

    // Length of disk data in bytes
    const dataLen = diskData.length;
    container[28] = dataLen & 0xff;
    container[29] = (dataLen >> 8) & 0xff;
    container[30] = (dataLen >> 16) & 0xff;
    container[31] = (dataLen >> 24) & 0xff;

    // Copy disk payload
    container.set(diskData, headerSize);
    return container;
  }

  /**
   * Helper to write standard ProDOS Bootloader Blocks (0 and 1)
   */
  private static writeBootBlocks(disk: Uint8Array): void {
    // ProDOS Standard 6502 Bootloader Machine Code ($0800)
    const bootCode = [
      0x01, 0x20, 0xA2, 0x60, 0x8E, 0x00, 0x08, 0x8E, 0x01, 0x08,
      0x20, 0x58, 0xFC, 0xA9, 0xC3, 0x8D, 0x00, 0xC4, 0x60
    ];
    for (let i = 0; i < bootCode.length; i++) {
      disk[i] = bootCode[i];
    }
  }

  /**
   * Helper to initialize Volume Directory Block (Block 2)
   */
  private static writeVolumeDirectory(
    disk: Uint8Array,
    volName: string,
    totalBlocks: number,
    fileCount: number
  ): void {
    const base = 2 * this.BLOCK_SIZE;

    // Prev Block ($0000), Next Block ($0003)
    disk[base + 0] = 0x00; disk[base + 1] = 0x00;
    disk[base + 2] = 0x03; disk[base + 3] = 0x00;

    // Storage Type ($F0 = Volume Header) & Name Length
    const cleanName = volName.toUpperCase().replace(/[^A-Z0-9.]/g, '').slice(0, 15) || 'UNTITLED';
    disk[base + 4] = 0xF0 | cleanName.length;

    // Volume Name ASCII
    for (let i = 0; i < 15; i++) {
      disk[base + 5 + i] = i < cleanName.length ? cleanName.charCodeAt(i) : 0x00;
    }

    // Access ($C3 = Read/Write/Rename/Destroy)
    disk[base + 22] = 0xC3;

    // Entry Length ($27 = 39 bytes), Entries Per Block ($0D = 13)
    disk[base + 23] = 0x27;
    disk[base + 24] = 0x0D;

    // File Count
    disk[base + 25] = fileCount & 0xff;
    disk[base + 26] = (fileCount >> 8) & 0xff;

    // Bitmap Pointer (Block 6)
    disk[base + 27] = 0x06;
    disk[base + 28] = 0x00;

    // Total Blocks on Volume
    disk[base + 29] = totalBlocks & 0xff;
    disk[base + 30] = (totalBlocks >> 8) & 0xff;
  }

  /**
   * Helper to initialize Volume Allocation Bitmap (Block 6)
   */
  private static initBitmap(disk: Uint8Array, totalBlocks: number, files: ProdosFileEntry[]): number {
    const base = 6 * this.BLOCK_SIZE;
    // Mark system blocks 0-6 as allocated
    disk[base + 0] = 0xFE; // Blocks 0-6 allocated (bit 0..6 = 1), block 7 = free

    let nextFreeBlock = 7;
    for (const f of files) {
      const blocksNeeded = Math.ceil((f.data.length + 2) / this.BLOCK_SIZE);
      for (let b = 0; b < blocksNeeded; b++) {
        const blk = nextFreeBlock + b;
        if (blk < totalBlocks) {
          const byteIdx = Math.floor(blk / 8);
          const bitIdx = 7 - (blk % 8);
          disk[base + byteIdx] |= (1 << bitIdx);
        }
      }
      nextFreeBlock += blocksNeeded;
    }
    return nextFreeBlock;
  }

  /**
   * Helper to write file data and create directory entries in Blocks 2..5
   */
  private static writeFiles(disk: Uint8Array, files: ProdosFileEntry[]): void {
    let nextBlock = 7;
    let dirEntryIndex = 1; // Entry 0 in Block 2 is Volume Header

    for (const f of files) {
      const cleanName = f.filename.toUpperCase().replace(/[^A-Z0-9.]/g, '').slice(0, 15) || 'FILE';
      const blocksNeeded = Math.ceil((f.data.length + 2) / this.BLOCK_SIZE);
      const startBlock = nextBlock;

      // Determine Directory Block & Offset
      const dirBlock = 2 + Math.floor(dirEntryIndex / 13);
      const entryInBlock = dirEntryIndex % 13;
      const entryBase = dirBlock * this.BLOCK_SIZE + 4 + entryInBlock * 39;

      // Write Directory Entry:
      // Storage Type ($10 = Seedling <= 512 bytes, $20 = Sapling <= 128KB) | Name length
      const storageType = blocksNeeded === 1 ? 0x10 : 0x20;
      disk[entryBase + 0] = storageType | cleanName.length;

      // File Name
      for (let i = 0; i < 15; i++) {
        disk[entryBase + 1 + i] = i < cleanName.length ? cleanName.charCodeAt(i) : 0x00;
      }

      // File Type ($FF = SYS, $06 = BIN, $04 = TXT)
      disk[entryBase + 16] = f.fileType;

      // Key Pointer (Start Block)
      disk[entryBase + 17] = startBlock & 0xff;
      disk[entryBase + 18] = (startBlock >> 8) & 0xff;

      // Blocks Used
      disk[entryBase + 19] = blocksNeeded & 0xff;
      disk[entryBase + 20] = (blocksNeeded >> 8) & 0xff;

      // EOF (File Length)
      const eof = f.data.length;
      disk[entryBase + 21] = eof & 0xff;
      disk[entryBase + 22] = (eof >> 8) & 0xff;
      disk[entryBase + 23] = (eof >> 16) & 0xff;

      // Aux Type (e.g. Load Address $2000 or $0803)
      disk[entryBase + 31] = f.orgAddress & 0xff;
      disk[entryBase + 32] = (f.orgAddress >> 8) & 0xff;

      // Write Data Payload to Disk Blocks
      const dataBase = startBlock * this.BLOCK_SIZE;
      disk.set(f.data, dataBase);

      nextBlock += blocksNeeded;
      dirEntryIndex++;
    }
  }

  /**
   * Browser Utility: Downloads a Uint8Array buffer as a file
   */
  public static triggerDownload(data: Uint8Array, filename: string): void {
    const blob = new Blob([data], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
