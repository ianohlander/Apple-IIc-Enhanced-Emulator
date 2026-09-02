import { CPU65C02 } from '../CPU65C02';
import { AddressingModes } from '../AddressingModes';

export class TransferFlagOps {
  public static tax(cpu: CPU65C02): void { cpu.x = cpu.a; cpu.setZN(cpu.x); }
  public static tay(cpu: CPU65C02): void { cpu.y = cpu.a; cpu.setZN(cpu.y); }
  public static txa(cpu: CPU65C02): void { cpu.a = cpu.x; cpu.setZN(cpu.a); }
  public static tya(cpu: CPU65C02): void { cpu.a = cpu.y; cpu.setZN(cpu.a); }
  public static tsx(cpu: CPU65C02): void { cpu.x = cpu.sp; cpu.setZN(cpu.x); }
  public static txs(cpu: CPU65C02): void { cpu.sp = cpu.x; }

  public static inx(cpu: CPU65C02): void { cpu.x = (cpu.x + 1) & 0xff; cpu.setZN(cpu.x); }
  public static iny(cpu: CPU65C02): void { cpu.y = (cpu.y + 1) & 0xff; cpu.setZN(cpu.y); }
  public static dex(cpu: CPU65C02): void { cpu.x = (cpu.x - 1) & 0xff; cpu.setZN(cpu.x); }
  public static dey(cpu: CPU65C02): void { cpu.y = (cpu.y - 1) & 0xff; cpu.setZN(cpu.y); }

  public static incAcc(cpu: CPU65C02): void { cpu.a = (cpu.a + 1) & 0xff; cpu.setZN(cpu.a); }
  public static decAcc(cpu: CPU65C02): void { cpu.a = (cpu.a - 1) & 0xff; cpu.setZN(cpu.a); }

  public static incMem(cpu: CPU65C02, addr: number): void {
    const val = (cpu.bus.read(addr) + 1) & 0xff;
    cpu.bus.write(addr, val);
    cpu.setZN(val);
  }

  public static decMem(cpu: CPU65C02, addr: number): void {
    const val = (cpu.bus.read(addr) - 1) & 0xff;
    cpu.bus.write(addr, val);
    cpu.setZN(val);
  }

  public static rmb(cpu: CPU65C02, bit: number): void {
    const zp = AddressingModes.fetchByte(cpu);
    cpu.bus.write(zp, cpu.bus.read(zp) & ~(1 << bit));
  }

  public static smb(cpu: CPU65C02, bit: number): void {
    const zp = AddressingModes.fetchByte(cpu);
    cpu.bus.write(zp, cpu.bus.read(zp) | (1 << bit));
  }

  public static clc(cpu: CPU65C02): void { cpu.flagC = false; }
  public static sec(cpu: CPU65C02): void { cpu.flagC = true; }
  public static cli(cpu: CPU65C02): void { cpu.flagI = false; }
  public static sei(cpu: CPU65C02): void { cpu.flagI = true; }
  public static clv(cpu: CPU65C02): void { cpu.flagV = false; }
  public static cld(cpu: CPU65C02): void { cpu.flagD = false; }
  public static sed(cpu: CPU65C02): void { cpu.flagD = true; }
}
