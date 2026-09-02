import { CPU65C02 } from '../CPU65C02';

export class LoadStoreOps {
  public static lda(cpu: CPU65C02, val: number): void {
    cpu.a = val & 0xff;
    cpu.setZN(cpu.a);
  }

  public static ldx(cpu: CPU65C02, val: number): void {
    cpu.x = val & 0xff;
    cpu.setZN(cpu.x);
  }

  public static ldy(cpu: CPU65C02, val: number): void {
    cpu.y = val & 0xff;
    cpu.setZN(cpu.y);
  }

  public static sta(cpu: CPU65C02, addr: number): void {
    cpu.bus.write(addr, cpu.a);
  }

  public static stx(cpu: CPU65C02, addr: number): void {
    cpu.bus.write(addr, cpu.x);
  }

  public static sty(cpu: CPU65C02, addr: number): void {
    cpu.bus.write(addr, cpu.y);
  }

  public static stz(cpu: CPU65C02, addr: number): void {
    cpu.bus.write(addr, 0x00);
  }
}
