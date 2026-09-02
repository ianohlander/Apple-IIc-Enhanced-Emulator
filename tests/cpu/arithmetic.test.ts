import { runner, assertEqual, assertTrue, assertFalse } from '../testRunner';
import { CPU65C02, MemoryBus } from '../../src/emulator/cpu/CPU65C02';

class MockBus implements MemoryBus {
  public ram = new Uint8Array(65536);
  read(addr: number) { return this.ram[addr & 0xffff]; }
  write(addr: number, val: number) { this.ram[addr & 0xffff] = val & 0xff; }
  readWord(addr: number) { return this.read(addr) | (this.read(addr + 1) << 8); }
  peek(addr: number) { return this.read(addr); }
}

export function runArithmeticTests(): void {
  runner.suite('65C02 CPU: Arithmetic & Comparisons', () => {
    runner.test('ADC Immediate Binary (no carry, no overflow)', () => {
      const bus = new MockBus();
      const cpu = new CPU65C02(bus);
      cpu.reset();
      cpu.a = 0x20;
      cpu.flagC = false;
      cpu.flagD = false;

      // LDA #$20, ADC #$15 -> A should be $35
      bus.ram[0x2000] = 0x69; // ADC #imm
      bus.ram[0x2001] = 0x15;
      cpu.pc = 0x2000;
      cpu.step();

      assertEqual(cpu.a, 0x35, 'Accumulator value');
      assertFalse(cpu.flagC, 'Carry flag should be false');
      assertFalse(cpu.flagZ, 'Zero flag should be false');
      assertFalse(cpu.flagV, 'Overflow flag should be false');
    });

    runner.test('ADC Overflow Flag Detection (Signed Overflow $50 + $50 = $A0)', () => {
      const bus = new MockBus();
      const cpu = new CPU65C02(bus);
      cpu.reset();
      cpu.a = 0x50;
      cpu.flagC = false;
      cpu.flagD = false;

      bus.ram[0x2000] = 0x69;
      bus.ram[0x2001] = 0x50;
      cpu.pc = 0x2000;
      cpu.step();

      assertEqual(cpu.a, 0xa0, 'Accumulator value');
      assertTrue(cpu.flagV, 'Overflow flag should be true');
      assertTrue(cpu.flagN, 'Negative flag should be true');
    });

    runner.test('ADC Decimal Mode ($29 + $43 in BCD = $72)', () => {
      const bus = new MockBus();
      const cpu = new CPU65C02(bus);
      cpu.reset();
      cpu.a = 0x29;
      cpu.flagC = false;
      cpu.flagD = true; // Decimal mode enabled

      bus.ram[0x2000] = 0x69;
      bus.ram[0x2001] = 0x43;
      cpu.pc = 0x2000;
      cpu.step();

      assertEqual(cpu.a, 0x72, 'BCD sum should be $72');
      assertFalse(cpu.flagC, 'Carry should be false');
    });

    runner.test('SBC Immediate Binary ($80 - $30 = $50)', () => {
      const bus = new MockBus();
      const cpu = new CPU65C02(bus);
      cpu.reset();
      cpu.a = 0x80;
      cpu.flagC = true; // In 6502, C=1 means no borrow
      cpu.flagD = false;

      bus.ram[0x2000] = 0xe9; // SBC #$30
      bus.ram[0x2001] = 0x30;
      cpu.pc = 0x2000;
      cpu.step();

      assertEqual(cpu.a, 0x50, 'Result should be $50');
      assertTrue(cpu.flagC, 'No borrow occurred (C=1)');
    });
  });
}
