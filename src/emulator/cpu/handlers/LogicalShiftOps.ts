import { CPU65C02 } from '../CPU65C02';

export class LogicalShiftOps {
  public static and(cpu: CPU65C02, val: number): void {
    cpu.a &= val;
    cpu.setZN(cpu.a);
  }

  public static ora(cpu: CPU65C02, val: number): void {
    cpu.a |= val;
    cpu.setZN(cpu.a);
  }

  public static eor(cpu: CPU65C02, val: number): void {
    cpu.a ^= val;
    cpu.setZN(cpu.a);
  }

  public static bit(cpu: CPU65C02, val: number, isImmediate: boolean = false): void {
    cpu.flagZ = (cpu.a & val) === 0;
    if (!isImmediate) {
      cpu.flagN = (val & 0x80) !== 0;
      cpu.flagV = (val & 0x40) !== 0;
    }
  }

  public static trb(cpu: CPU65C02, addr: number): void {
    const val = cpu.bus.read(addr);
    cpu.flagZ = (cpu.a & val) === 0;
    cpu.bus.write(addr, val & ~cpu.a);
  }

  public static tsb(cpu: CPU65C02, addr: number): void {
    const val = cpu.bus.read(addr);
    cpu.flagZ = (cpu.a & val) === 0;
    cpu.bus.write(addr, val | cpu.a);
  }

  public static asl(cpu: CPU65C02, val: number): number {
    cpu.flagC = (val & 0x80) !== 0;
    const res = (val << 1) & 0xff;
    cpu.setZN(res);
    return res;
  }

  public static lsr(cpu: CPU65C02, val: number): number {
    cpu.flagC = (val & 0x01) !== 0;
    const res = (val >> 1) & 0xff;
    cpu.setZN(res);
    return res;
  }

  public static rol(cpu: CPU65C02, val: number): number {
    const carryIn = cpu.flagC ? 1 : 0;
    cpu.flagC = (val & 0x80) !== 0;
    const res = ((val << 1) | carryIn) & 0xff;
    cpu.setZN(res);
    return res;
  }

  public static ror(cpu: CPU65C02, val: number): number {
    const carryIn = cpu.flagC ? 0x80 : 0;
    cpu.flagC = (val & 0x01) !== 0;
    const res = ((val >> 1) | carryIn) & 0xff;
    cpu.setZN(res);
    return res;
  }
}
