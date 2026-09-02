import { runner, assertEqual, assertTrue } from '../testRunner';
import { FloppyDisk } from '../../src/emulator/storage/diskII';
import { SmartPortHardDrive } from '../../src/emulator/storage/smartport';

export function runStorageTests(): void {
  runner.suite('Apple II Storage: Floppy GCR & 32MB SmartPort HD', () => {
    runner.test('6-and-2 GCR Nibble Translation Table Integrity', () => {
      // 64 unique high-bit nibble bytes
      assertEqual(FloppyDisk.DISK_BYTE_TO_NIBBLE.length, 64);
      for (const n of FloppyDisk.DISK_BYTE_TO_NIBBLE) {
        assertTrue((n & 0x80) !== 0, 'Every disk nibble must have bit 7 set for hardware shift register');
      }
    });

    runner.test('Floppy Disk Track Formatting & Track Count (35 Tracks)', () => {
      const disk = new FloppyDisk('Test.dsk');
      assertEqual(disk.tracks.length, 35, 'Standard Apple II 5.25" floppy has 35 tracks');
      assertEqual(disk.tracks[0].length, 6656, 'Each nibblized track is 6656 bytes');
    });

    runner.test('SmartPort 32MB Hard Disk Block I/O & ProDOS Directory Header', () => {
      const hd = new SmartPortHardDrive('ProDOS-32MB.hdv', 32);
      assertEqual(hd.sizeMB, 32);
      assertEqual(hd.totalBlocks, 65536);

      // Write test block to Block 100
      const testData = new Uint8Array(512);
      testData[0] = 0xde;
      testData[1] = 0xad;
      testData[511] = 0xef;
      hd.writeBlock(100, testData);

      const readBack = hd.readBlock(100);
      assertEqual(readBack[0], 0xde);
      assertEqual(readBack[1], 0xad);
      assertEqual(readBack[511], 0xef);
    });
  });
}
