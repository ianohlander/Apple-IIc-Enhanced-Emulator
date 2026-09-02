import { runner, assertEqual } from '../testRunner';
import { Apple2cMMU } from '../../src/emulator/mmu/Apple2cMMU';
import { DiskIIController } from '../../src/emulator/storage/diskII';
import { SmartPortController } from '../../src/emulator/storage/smartport';
import { MockingboardController } from '../../src/emulator/audio';
import { UthernetController } from '../../src/emulator/network/uthernet';

export function runSlinkyTests(): void {
  runner.suite('Apple IIc Slinky: 1MB-16MB Expanded RAM', () => {
    runner.test('Slinky 24-bit Address Register & Auto-Increment', () => {
      const mmu = new Apple2cMMU(new DiskIIController(), new SmartPortController(), new MockingboardController(), new UthernetController());
      mmu.reset();

      // Set Address = $040000 (256KB offset)
      mmu.write(0xc073, 0x00); // Low
      mmu.write(0xc074, 0x00); // Mid
      mmu.write(0xc075, 0x04); // High

      // Sequential writes via $C071 (Auto-increments address after each byte)
      mmu.write(0xc071, 0x10);
      mmu.write(0xc071, 0x20);
      mmu.write(0xc071, 0x30);

      // Reset address back to $040000
      mmu.write(0xc073, 0x00);
      mmu.write(0xc074, 0x00);
      mmu.write(0xc075, 0x04);

      // Sequential reads via $C071
      assertEqual(mmu.read(0xc071), 0x10, 'Byte 0 at $040000');
      assertEqual(mmu.read(0xc071), 0x20, 'Byte 1 at $040001');
      assertEqual(mmu.read(0xc071), 0x30, 'Byte 2 at $040002');
    });
  });
}
