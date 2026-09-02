import { runner, assertEqual } from '../testRunner';
import { Apple2cMMU } from '../../src/emulator/mmu/Apple2cMMU';
import { DiskIIController } from '../../src/emulator/storage/diskII';
import { SmartPortController } from '../../src/emulator/storage/smartport';
import { MockingboardController } from '../../src/emulator/audio';
import { UthernetController } from '../../src/emulator/network/uthernet';

export function runLanguageCardTests(): void {
  runner.suite('Apple IIc MMU: Language Card ($D000-$FFFF)', () => {
    runner.test('Language Card Bank 1 / Bank 2 Selection ($C083 vs $C08B)', () => {
      const mmu = new Apple2cMMU(new DiskIIController(), new SmartPortController(), new MockingboardController(), new UthernetController());
      mmu.reset();

      // Read $C083 twice to enable write + select Bank 2 ($D000-$DFFF)
      mmu.read(0xc083);
      mmu.read(0xc083);
      mmu.write(0xd000, 0x22); // Write to Bank 2

      // Read $C08B twice to enable write + select Bank 1 ($D000-$DFFF)
      mmu.read(0xc08b);
      mmu.read(0xc08b);
      mmu.write(0xd000, 0x11); // Write to Bank 1

      // Select Bank 2 read ($C083)
      mmu.read(0xc083);
      assertEqual(mmu.read(0xd000), 0x22, 'Bank 2 has $22');

      // Select Bank 1 read ($C08B)
      mmu.read(0xc08b);
      assertEqual(mmu.read(0xd000), 0x11, 'Bank 1 has $11');
    });

    runner.test('Language Card Write-Protection (2 consecutive reads required to write)', () => {
      const mmu = new Apple2cMMU(new DiskIIController(), new SmartPortController(), new MockingboardController(), new UthernetController());
      mmu.reset();

      // Access $C080 (Read RAM, Write Disabled)
      mmu.read(0xc080);
      mmu.write(0xe000, 0x99); // Should NOT write

      // Access $C081 twice (Read ROM, Write Enabled)
      mmu.read(0xc081);
      mmu.read(0xc081);
      mmu.write(0xe000, 0x77); // Should write!

      // Access $C080 (Read RAM)
      mmu.read(0xc080);
      assertEqual(mmu.read(0xe000), 0x77, 'Written value retained in High RAM');
    });
  });
}
