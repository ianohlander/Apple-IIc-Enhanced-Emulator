import { runner, assertEqual, assertTrue, assertFalse } from '../testRunner';
import { TypeInManager } from '../../src/emulator/typein/typeInManager';
import { Apple2cMMU } from '../../src/emulator/mmu/Apple2cMMU';
import { CPU65C02 } from '../../src/emulator/cpu65C02';
import { DiskIIController } from '../../src/emulator/storage/diskII';
import { SmartPortController } from '../../src/emulator/storage/smartport';
import { MockingboardController } from '../../src/emulator/audio';
import { UthernetController } from '../../src/emulator/network/uthernet';
import { SAMPLE_MAGAZINE_PROGRAMS } from '../../src/samples/sampleTypeIns';
import { generateDefaultApple2cRom } from '../../src/emulator/roms/defaultRoms';

export function runTypeInTests(): void {
  runner.suite('Magazine Type-In: Parser & Memory Injector', () => {
    const mmu = new Apple2cMMU(new DiskIIController(), new SmartPortController(), new MockingboardController(), new UthernetController());
    mmu.rom.set(generateDefaultApple2cRom());
    const mgr = new TypeInManager(mmu);

    runner.test('Detect Applesoft BASIC vs Monitor Hex Dump Mode', () => {
      const basicListing = '10 HOME\n20 PRINT "HELLO"';
      const monitorListing = '300: A9 00 8D 50 C0 60';
      const rawText = 'CATALOG';

      assertEqual(mgr.detectMode(basicListing), 'basic');
      assertEqual(mgr.detectMode(monitorListing), 'monitor');
      assertEqual(mgr.detectMode(rawText), 'raw');
    });

    runner.test('Parse Monitor Hex Dump Lines ($300: A9 00 8D 50 C0 60)', () => {
      const dump = '300: A9 00 8D 50 C0 60\n310: A2 FF 9A 60';
      const entries = mgr.parseMonitorHex(dump);

      assertEqual(entries.length, 2, 'Parsed 2 lines of monitor hex');
      assertEqual(entries[0].address, 0x0300);
      assertEqual(entries[0].bytes.length, 6);
      assertEqual(entries[0].bytes[0], 0xa9);
      assertEqual(entries[0].bytes[5], 0x60);

      assertEqual(entries[1].address, 0x0310);
      assertEqual(entries[1].bytes.length, 4);
    });

    runner.test('Direct Memory Injection of Machine Code', () => {
      const entries = [
        { address: 0x0800, bytes: [0x4c, 0x00, 0x08] }
      ];
      const count = mgr.injectMonitorDirectly(entries);

      assertEqual(count, 3, 'Injected 3 bytes');
      assertEqual(mmu.read(0x0800), 0x4c);
      assertEqual(mmu.read(0x0801), 0x00);
      assertEqual(mmu.read(0x0802), 0x08);
    });

    runner.test('Clean OCR Vintage Magazine Typography (Quotes & Zeroes)', () => {
      const ocrScan = '“PRINT HELLO”\n‘TEST’\nO10 HOME\nI00 END';
      const cleaned = mgr.cleanOcrText(ocrScan);

      assertTrue(cleaned.includes('"PRINT HELLO"'), 'Quotes normalized');
      assertTrue(cleaned.includes("'TEST'"), 'Single quotes normalized');
      assertTrue(cleaned.includes('010 HOME'), 'Leading letter O replaced with 0');
      assertTrue(cleaned.includes('100 END'), 'Leading letter I replaced with 1');
    });

    runner.test('Vintage BASIC: inCider DHGR Kaleidoscope (1984)', () => {
      const prog = SAMPLE_MAGAZINE_PROGRAMS.find(p => p.id === 'incider-dhgr-kaleidoscope');
      assertTrue(!!prog, 'Found inCider Kaleidoscope program');
      assertEqual(mgr.detectMode(prog!.sourceCode), 'basic', 'Detected as Applesoft BASIC');
      
      // Verify POKE DHGR softswitches ($C050=49232, $C057=49239, $C00D=49165, $C05F=49247)
      assertTrue(prog!.sourceCode.includes('POKE 49232,0'), 'Configures TXTCLR softswitch');
      assertTrue(prog!.sourceCode.includes('POKE 49247,0'), 'Configures DHIRESON softswitch');
      assertTrue(prog!.sourceCode.includes('HPLOT X1, Y1 TO X2, Y2'), 'Draws symmetric kaleidoscope vectors');
      assertTrue(prog!.sourceCode.includes('PEEK(49152)'), 'Reads keyboard strobe register ($C000)');
    });

    runner.test('Vintage BASIC: Compute! Lunar Lander (1984)', () => {
      const prog = SAMPLE_MAGAZINE_PROGRAMS.find(p => p.id === 'softalk-lunar-lander');
      assertTrue(!!prog, 'Found Lunar Lander program');
      assertEqual(mgr.detectMode(prog!.sourceCode), 'basic', 'Detected as Applesoft BASIC');

      // Verify physics loop variables and equations
      assertTrue(prog!.sourceCode.includes('ALT = 1000 : VEL = 50 : FUEL = 250'), 'Initial conditions set');
      assertTrue(prog!.sourceCode.includes('VEL = VEL + 1.6 - (T * 0.2)'), 'Applies gravity and retro-thrust physics');
      assertTrue(prog!.sourceCode.includes('ALT = ALT - VEL'), 'Calculates descent altitude');
      assertTrue(prog!.sourceCode.includes('PERFECT TOUCHDOWN'), 'Victory condition when velocity <= 5 m/s');
    });

    runner.test('Vintage BASIC: Nibble 3D Starfield Warp (1983)', () => {
      const prog = SAMPLE_MAGAZINE_PROGRAMS.find(p => p.id === 'compute-warp-drive');
      assertTrue(!!prog, 'Found 3D Starfield program');
      assertEqual(mgr.detectMode(prog!.sourceCode), 'basic', 'Detected as Applesoft BASIC');

      // Verify 3D perspective projection formula: ScreenX = 140 + (WorldX / WorldZ) * Scale
      assertTrue(prog!.sourceCode.includes('PX = 140 + (SX(I) / SZ(I)) * 50'), 'Computes 3D perspective X projection');
      assertTrue(prog!.sourceCode.includes('PY = 96 + (SY(I) / SZ(I)) * 50'), 'Computes 3D perspective Y projection');
      assertTrue(prog!.sourceCode.includes('SZ(I) = SZ(I) - 3'), 'Simulates warp velocity along Z-axis');
    });

    runner.test('Raw 65C02 Assembly Injection: $0300 Apple String Out', () => {
      const stringOutDump = `
        300: A2 00 BD 10 03 F0 06 20 ED FD E8 D0 F5 60
        310: C1 D0 D0 CC C5 A0 C9 C9 E3 A0 D5 EC F4 F2 E1 00
      `;

      assertEqual(mgr.detectMode(stringOutDump), 'monitor', 'Detected as Monitor Hex Dump');
      const entries = mgr.parseMonitorHex(stringOutDump);
      assertEqual(entries.length, 2, 'Parsed 2 lines');

      const injectedBytes = mgr.injectMonitorDirectly(entries);
      assertEqual(injectedBytes, 30, 'Injected 30 bytes at $0300-$031D');

      // Verify memory at $0300 contains routine
      assertEqual(mmu.read(0x0300), 0xa2); // LDX #$00
      assertEqual(mmu.read(0x0301), 0x00);
      assertEqual(mmu.read(0x0302), 0xbd); // LDA $0310,X
      assertEqual(mmu.read(0x0303), 0x10);
      assertEqual(mmu.read(0x0304), 0x03);
      assertEqual(mmu.read(0x0307), 0x20); // JSR $FDED
      assertEqual(mmu.read(0x0308), 0xed);
      assertEqual(mmu.read(0x0309), 0xfd);

      // Execute on CPU65C02
      const cpu = new CPU65C02(mmu);
      cpu.pc = 0x0300;
      cpu.sp = 0xff;

      let steps = 0;
      while (cpu.pc !== 0x030d && steps < 200) {
        cpu.step();
        steps++;
      }

      assertEqual(cpu.pc, 0x030d, 'CPU reached RTS at $030D');
      assertEqual(cpu.x, 15, 'Printed all 15 characters of "APPLE IIc Ultra"');
      assertEqual(cpu.flagZ, true, 'Zero flag set by null terminator');
    });

    runner.test('Clipboard Paste & Keyboard/Mouse Mapping Simulation', () => {
      // 1. Keyboard Buffer & Strobe ($C000 / $C010)
      mmu.setKey(0x41); // 'A' (ASCII 65 = 0x41)
      const strobeVal = mmu.read(0xc000);
      assertEqual(strobeVal, 0xc1, 'Bit 7 set for keyboard strobe ($C1 = A with high bit)');
      
      // Clear strobe by writing $C010
      mmu.write(0xc010, 0x00);
      assertEqual(mmu.read(0xc000) & 0x80, 0, 'Strobe bit 7 cleared after $C010 access');

      // 2. Open Apple (Alt) & Closed Apple (Ctrl) Joystick Buttons ($C061 / $C062)
      mmu.openAppleKey = true;
      assertEqual(mmu.read(0xc061) & 0x80, 0x80, 'Open Apple key pressed ($C061 bit 7 = 1)');
      mmu.openAppleKey = false;
      assertEqual(mmu.read(0xc061) & 0x80, 0x00, 'Open Apple key released ($C061 bit 7 = 0)');

      mmu.closedAppleKey = true;
      assertEqual(mmu.read(0xc062) & 0x80, 0x80, 'Closed Apple key pressed ($C062 bit 7 = 1)');
      mmu.closedAppleKey = false;
      assertEqual(mmu.read(0xc062) & 0x80, 0x00, 'Closed Apple key released ($C062 bit 7 = 0)');

      // 3. Mouse / Paddle Position ($C064 / $C065)
      mmu.setMouse(120, 80, true, false, false);
      assertEqual(mmu.ioRouter.mouseX, 120, 'Mouse X mapped to 120');
      assertEqual(mmu.ioRouter.mouseY, 80, 'Mouse Y mapped to 80');
      assertTrue(mmu.ioRouter.mouseBtn0, 'Mouse button 0 pressed');
      assertFalse(mmu.ioRouter.mouseBtn1, 'Mouse button 1 released');
    });
  });
}
