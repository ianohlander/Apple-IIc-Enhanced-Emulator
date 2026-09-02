import { CPU65C02 } from '../CPU65C02';
import { AddressingModes } from '../AddressingModes';

export class StackJumpOps {
  public static jmpAbsolute(cpu: CPU65C02): void {
    cpu.pc = AddressingModes.fetchWord(cpu);
  }

  public static jmpIndirect(cpu: CPU65C02): void {
    const ptr = AddressingModes.fetchWord(cpu);
    const low = cpu.bus.read(ptr);
    const high = cpu.bus.read((ptr + 1) & 0xffff);
    cpu.pc = (high << 8) | low;
  }

  public static jmpIndirectX(cpu: CPU65C02): void {
    const base = AddressingModes.fetchWord(cpu);
    const ptr = (base + cpu.x) & 0xffff;
    const low = cpu.bus.read(ptr);
    const high = cpu.bus.read((ptr + 1) & 0xffff);
    cpu.pc = (high << 8) | low;
  }

  public static jsr(cpu: CPU65C02): void {
    const dest = AddressingModes.fetchWord(cpu);
    cpu.pushWord((cpu.pc - 1) & 0xffff);
    cpu.pc = dest;
  }

  public static rts(cpu: CPU65C02): void {
    cpu.pc = (cpu.popWord() + 1) & 0xffff;
  }

  public static rti(cpu: CPU65C02): void {
    cpu.setStatusByte(cpu.pop());
    cpu.pc = cpu.popWord();
  }

  public static pha(cpu: CPU65C02): void { cpu.push(cpu.a); }
  public static pla(cpu: CPU65C02): void { cpu.a = cpu.pop(); cpu.setZN(cpu.a); }
  public static php(cpu: CPU65C02): void { cpu.push(cpu.getStatusByte() | 0x10); }
  public static plp(cpu: CPU65C02): void { cpu.setStatusByte(cpu.pop()); }
  public static phx(cpu: CPU65C02): void { cpu.push(cpu.x); }
  public static plx(cpu: CPU65C02): void { cpu.x = cpu.pop(); cpu.setZN(cpu.x); }
  public static phy(cpu: CPU65C02): void { cpu.push(cpu.y); }
  public static ply(cpu: CPU65C02): void { cpu.y = cpu.pop(); cpu.setZN(cpu.y); }
}
