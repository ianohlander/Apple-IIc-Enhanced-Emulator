import { runner, assertEqual, assertTrue, assertFalse } from '../testRunner';
import { CPU65C02, MemoryBus } from '../../src/emulator/cpu/CPU65C02';

class MockBus implements MemoryBus {
  public ram = new Uint8Array(65536);
  read(addr: number) { return this.ram[addr & 0xffff]; }
  write(addr: number, val: number) { this.ram[addr & 0xffff] = val & 0xff; }
  readWord(addr: number) { return this.read(addr) | (this.read(addr + 1) << 8); }
  peek(addr: number) { return this.read(addr); }
}

export function runCmosOpcodeTests(): void {
  runner.suite('65C02 CPU: CMOS Opcode Extensions', () => {
    runner.test('BRA Branch Always ($80)', () => {
      const bus = new MockBus();
      const cpu = new CPU65C02(bus);
      cpu.reset();

      // BRA +$06 -> $2000 + 2 + 6 = $2008
      bus.ram[0x2000] = 0x80;
      bus.ram[0x2001] = 0x06;
      cpu.pc = 0x2000;
      cpu.step();

      assertEqual(cpu.pc, 0x2008, 'PC after BRA');
    });

    runner.test('STZ Store Zero ($64 Zero Page & $9C Absolute)', () => {
      const bus = new MockBus();
      const cpu = new CPU65C02(bus);
      cpu.reset();
      bus.ram[0x50] = 0xff;
      bus.ram[0x3000] = 0xaa;

      // STZ $50
      bus.ram[0x2000] = 0x64;
      bus.ram[0x2001] = 0x50;
      cpu.pc = 0x2000;
      cpu.step();

      assertEqual(bus.ram[0x50], 0x00, 'Zero page memory cleared by STZ');

      // STZ $3000
      bus.ram[0x2002] = 0x9c;
      bus.ram[0x2003] = 0x00;
      bus.ram[0x2004] = 0x30;
      cpu.step();

      assertEqual(bus.ram[0x3000], 0x00, 'Absolute memory cleared by STZ');
    });

    runner.test('PHX/PLX and PHY/PLY Stack Extensions ($DA, $FA, $5A, $7A)', () => {
      const bus = new MockBus();
      const cpu = new CPU65C02(bus);
      cpu.reset();
      cpu.x = 0x42;
      cpu.y = 0x84;

      // PHX ($DA), PHY ($5A)
      bus.ram[0x2000] = 0xda;
      bus.ram[0x2001] = 0x5a;
      cpu.pc = 0x2000;
      cpu.step(); // Push X ($42)
      cpu.step(); // Push Y ($84)

      cpu.x = 0x00;
      cpu.y = 0x00;

      // PLY ($7A), PLX ($FA)
      bus.ram[0x2002] = 0x7a;
      bus.ram[0x2003] = 0xfa;
      cpu.step(); // Pop Y
      cpu.step(); // Pop X

      assertEqual(cpu.y, 0x84, 'Restored Y from stack');
      assertEqual(cpu.x, 0x42, 'Restored X from stack');
    });

    runner.test('TRB & TSB Bit Manipulation ($14, $04)', () => {
      const bus = new MockBus();
      const cpu = new CPU65C02(bus);
      cpu.reset();
      bus.ram[0x40] = 0b11110000;
      cpu.a = 0b00110000;

      // TRB $40 (Test & Reset Bits: clears bits 4, 5)
      bus.ram[0x2000] = 0x14;
      bus.ram[0x2001] = 0x40;
      cpu.pc = 0x2000;
      cpu.step();

      assertEqual(bus.ram[0x40], 0b11000000, 'Bits 4 and 5 reset by TRB');

      // TSB $40 (Test & Set Bits: sets bit 0, 1)
      cpu.a = 0b00000011;
      bus.ram[0x2002] = 0x04;
      bus.ram[0x2003] = 0x40;
      cpu.step();

      assertEqual(bus.ram[0x40], 0b11000011, 'Bits 0 and 1 set by TSB');
    });
  });
}
