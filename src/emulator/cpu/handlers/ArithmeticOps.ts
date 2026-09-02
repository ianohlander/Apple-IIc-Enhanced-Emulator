import { CPU65C02 } from '../CPU65C02';

export class ArithmeticOps {
  public static adc(cpu: CPU65C02, val: number): void {
    if (cpu.flagD) {
      ArithmeticOps.adcDecimal(cpu, val);
    } else {
      ArithmeticOps.adcBinary(cpu, val);
    }
  }

  private static adcBinary(cpu: CPU65C02, val: number): void {
    const sum = cpu.a + val + (cpu.flagC ? 1 : 0);
    cpu.flagV = (!((cpu.a ^ val) & 0x80) && ((cpu.a ^ sum) & 0x80)) !== 0;
    cpu.flagC = sum > 0xff;
    cpu.a = sum & 0xff;
    cpu.setZN(cpu.a);
  }

  private static adcDecimal(cpu: CPU65C02, val: number): void {
    let al = (cpu.a & 0x0f) + (val & 0x0f) + (cpu.flagC ? 1 : 0);
    let ah = (cpu.a >> 4) + (val >> 4);
    if (al > 9) {
      al = (al + 6) & 0x0f;
      ah++;
    }
    const sum = (cpu.a + val + (cpu.flagC ? 1 : 0)) & 0x1ff;
    cpu.flagV = (!((cpu.a ^ val) & 0x80) && ((cpu.a ^ (ah << 4)) & 0x80)) !== 0;
    if (ah > 9) {
      ah = (ah + 6) & 0x0f;
    }
    cpu.flagC = sum > 99 || ah > 9;
    cpu.a = ((ah << 4) | (al & 0x0f)) & 0xff;
    cpu.setZN(cpu.a);
  }

  public static sbc(cpu: CPU65C02, val: number): void {
    if (cpu.flagD) {
      ArithmeticOps.sbcDecimal(cpu, val);
    } else {
      ArithmeticOps.sbcBinary(cpu, val);
    }
  }

  private static sbcBinary(cpu: CPU65C02, val: number): void {
    const diff = cpu.a - val - (cpu.flagC ? 0 : 1);
    cpu.flagV = (((cpu.a ^ diff) & 0x80) && ((cpu.a ^ val) & 0x80)) !== 0;
    cpu.flagC = diff >= 0;
    cpu.a = diff & 0xff;
    cpu.setZN(cpu.a);
  }

  private static sbcDecimal(cpu: CPU65C02, val: number): void {
    let al = (cpu.a & 0x0f) - (val & 0x0f) - (cpu.flagC ? 0 : 1);
    let ah = (cpu.a >> 4) - (val >> 4);
    if (al < 0) {
      al = (al - 6) & 0x0f;
      ah--;
    }
    if (ah < 0) {
      ah = (ah - 6) & 0x0f;
    }
    const diff = cpu.a - val - (cpu.flagC ? 0 : 1);
    cpu.flagV = (((cpu.a ^ diff) & 0x80) && ((cpu.a ^ val) & 0x80)) !== 0;
    cpu.flagC = diff >= 0;
    cpu.a = ((ah << 4) | (al & 0x0f)) & 0xff;
    cpu.setZN(cpu.a);
  }

  public static compare(cpu: CPU65C02, reg: number, val: number): void {
    const diff = reg - val;
    cpu.flagC = reg >= val;
    cpu.setZN(diff & 0xff);
  }
}
