import { CPU65C02 } from '../CPU65C02';
import { AddressingModes } from '../AddressingModes';

export class BranchOps {
  public static branch(cpu: CPU65C02, condition: boolean): number {
    const rel = AddressingModes.fetchByte(cpu);
    if (condition) {
      const offset = rel < 0x80 ? rel : rel - 256;
      const oldPC = cpu.pc;
      cpu.pc = (cpu.pc + offset) & 0xffff;
      const pageCrossed = (oldPC & 0xff00) !== (cpu.pc & 0xff00);
      return 3 + (pageCrossed ? 1 : 0);
    }
    return 2;
  }

  public static branchBit(cpu: CPU65C02, bit: number, shouldBeSet: boolean): number {
    const zp = AddressingModes.fetchByte(cpu);
    const rel = AddressingModes.fetchByte(cpu);
    const isBitSet = (cpu.bus.read(zp) & (1 << bit)) !== 0;
    const condition = isBitSet === shouldBeSet;

    if (condition) {
      const offset = rel < 0x80 ? rel : rel - 256;
      const oldPC = cpu.pc;
      cpu.pc = (cpu.pc + offset) & 0xffff;
      const pageCrossed = (oldPC & 0xff00) !== (cpu.pc & 0xff00);
      return 6 + (pageCrossed ? 1 : 0);
    }
    return 5;
  }
}
