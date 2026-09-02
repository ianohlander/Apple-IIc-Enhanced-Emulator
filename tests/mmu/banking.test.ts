import { runner, assertEqual } from '../testRunner';
import { Apple2cMMU } from '../../src/emulator/mmu/Apple2cMMU';
import { DiskIIController } from '../../src/emulator/storage/diskII';
import { SmartPortController } from '../../src/emulator/storage/smartport';
import { MockingboardController } from '../../src/emulator/audio';
import { UthernetController } from '../../src/emulator/network/uthernet';

export function runMmuBankingTests(): void {
  runner.suite('Apple IIc MMU: Memory Banking & 80STORE', () => {
    runner.test('Main vs Aux Zero Page ($0000-$00FF) via ALTZP ($C008/$C009)', () => {
      const mmu = new Apple2cMMU(new DiskIIController(), new SmartPortController(), new MockingboardController(), new UthernetController());
      mmu.reset();

      // Write $11 to Main Zero Page $50
      mmu.write(0x50, 0x11);
      assertEqual(mmu.read(0x50), 0x11, 'Read from Main Zero Page');

      // Switch to Aux Zero Page via ALTZP ON ($C009)
      mmu.write(0xc009, 0);
      assertEqual(mmu.read(0x50), 0x00, 'Aux Zero Page initially 0');

      // Write $22 to Aux Zero Page $50
      mmu.write(0x50, 0x22);
      assertEqual(mmu.read(0x50), 0x22, 'Read from Aux Zero Page');

      // Switch back to Main Zero Page via ALTZP OFF ($C008)
      mmu.write(0xc008, 0);
      assertEqual(mmu.read(0x50), 0x11, 'Main Zero Page retained value $11');
    });

    runner.test('RAMRD and RAMWRT Bank Switching ($0200-$BFFF)', () => {
      const mmu = new Apple2cMMU(new DiskIIController(), new SmartPortController(), new MockingboardController(), new UthernetController());
      mmu.reset();

      // Write to Main RAM $6000
      mmu.write(0x6000, 0xAA);
      assertEqual(mmu.read(0x6000), 0xAA, 'Main RAM read');

      // Enable RAMWRT ($C005) -> Writes go to Aux RAM, reads from Main
      mmu.write(0xc005, 0);
      mmu.write(0x6000, 0xBB);
      assertEqual(mmu.read(0x6000), 0xAA, 'Read still from Main RAM');

      // Enable RAMRD ($C003) -> Reads come from Aux RAM
      mmu.write(0xc003, 0);
      assertEqual(mmu.read(0x6000), 0xBB, 'Read from Aux RAM');
    });

    runner.test('80STORE Video Page Mapping ($0400-$07FF & $2000-$3FFF)', () => {
      const mmu = new Apple2cMMU(new DiskIIController(), new SmartPortController(), new MockingboardController(), new UthernetController());
      mmu.reset();

      // Enable 80STORE ($C001)
      mmu.write(0xc001, 0);
      mmu.write(0xc054, 0); // PAGE1 selected

      mmu.write(0x0400, 0x41); // 'A' in Main text page
      assertEqual(mmu.read(0x0400), 0x41);

      // PAGE2 ($C055) with 80STORE on maps video page to Aux memory!
      mmu.write(0xc055, 0);
      mmu.write(0x0400, 0x42); // 'B' in Aux text page
      assertEqual(mmu.read(0x0400), 0x42);

      // Back to PAGE1
      mmu.write(0xc054, 0);
      assertEqual(mmu.read(0x0400), 0x41, 'Main text page unchanged');
    });
  });
}
