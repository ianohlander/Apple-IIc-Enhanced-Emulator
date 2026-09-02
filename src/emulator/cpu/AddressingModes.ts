import { CPU65C02 } from './CPU65C02';

export class AddressingModes {
  public static fetchByte(cpu: CPU65C02): number {
    const val = cpu.bus.read(cpu.pc);
    cpu.pc = (cpu.pc + 1) & 0xffff;
    return val;
  }

  public static fetchWord(cpu: CPU65C02): number {
    const low = AddressingModes.fetchByte(cpu);
    const high = AddressingModes.fetchByte(cpu);
    return (high << 8) | low;
  }

  public static getZeroPage(cpu: CPU65C02): number {
    return AddressingModes.fetchByte(cpu);
  }

  public static getZeroPageX(cpu: CPU65C02): number {
    return (AddressingModes.fetchByte(cpu) + cpu.x) & 0xff;
  }

  public static getZeroPageY(cpu: CPU65C02): number {
    return (AddressingModes.fetchByte(cpu) + cpu.y) & 0xff;
  }

  public static getAbsolute(cpu: CPU65C02): number {
    return AddressingModes.fetchWord(cpu);
  }

  public static getAbsoluteX(cpu: CPU65C02): { addr: number; pageCrossed: boolean } {
    const base = AddressingModes.fetchWord(cpu);
    const addr = (base + cpu.x) & 0xffff;
    const pageCrossed = (base & 0xff00) !== (addr & 0xff00);
    return { addr, pageCrossed };
  }

  public static getAbsoluteY(cpu: CPU65C02): { addr: number; pageCrossed: boolean } {
    const base = AddressingModes.fetchWord(cpu);
    const addr = (base + cpu.y) & 0xffff;
    const pageCrossed = (base & 0xff00) !== (addr & 0xff00);
    return { addr, pageCrossed };
  }

  public static getIndirectX(cpu: CPU65C02): number {
    const zp = (AddressingModes.fetchByte(cpu) + cpu.x) & 0xff;
    const low = cpu.bus.read(zp);
    const high = cpu.bus.read((zp + 1) & 0xff);
    return (high << 8) | low;
  }

  public static getIndirectY(cpu: CPU65C02): { addr: number; pageCrossed: boolean } {
    const zp = AddressingModes.fetchByte(cpu);
    const low = cpu.bus.read(zp);
    const high = cpu.bus.read((zp + 1) & 0xff);
    const base = (high << 8) | low;
    const addr = (base + cpu.y) & 0xffff;
    const pageCrossed = (base & 0xff00) !== (addr & 0xff00);
    return { addr, pageCrossed };
  }

  // 65C02 Indirect Zero Page: (zp)
  public static getIndirectZeroPage(cpu: CPU65C02): number {
    const zp = AddressingModes.fetchByte(cpu);
    const low = cpu.bus.read(zp);
    const high = cpu.bus.read((zp + 1) & 0xff);
    return (high << 8) | low;
  }
}
