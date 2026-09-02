import { CPU65C02State, DisassemblyLine } from '../../types/emulator';
import { buildOpcodeTable, InstructionHandler } from './OpcodeTable';

export interface MemoryBus {
  read(address: number): number;
  write(address: number, value: number): void;
  readWord(address: number): number;
  peek(address: number): number;
}

export class CPU65C02 {
  public a: number = 0;
  public x: number = 0;
  public y: number = 0;
  public sp: number = 0xff;
  public pc: number = 0xf800;

  public flagN: boolean = false;
  public flagV: boolean = false;
  public flagE: boolean = true;
  public flagB: boolean = false;
  public flagD: boolean = false;
  public flagI: boolean = true;
  public flagZ: boolean = false;
  public flagC: boolean = false;

  public cycles: number = 0;
  public totalCycles: number = 0;
  public isHalted: boolean = false;
  public isWaiting: boolean = false;
  public bus: MemoryBus;

  private opcodeTable: InstructionHandler[];

  constructor(bus: MemoryBus) {
    this.bus = bus;
    this.opcodeTable = buildOpcodeTable();
  }

  public reset(): void {
    this.a = 0;
    this.x = 0;
    this.y = 0;
    this.sp = 0xff;
    this.flagN = false;
    this.flagV = false;
    this.flagE = true;
    this.flagB = false;
    this.flagD = false;
    this.flagI = true;
    this.flagZ = false;
    this.flagC = false;
    this.isHalted = false;
    this.isWaiting = false;
    this.cycles = 0;

    const low = this.bus.read(0xfffc);
    const high = this.bus.read(0xfffd);
    this.pc = (high << 8) | low;
    if (this.pc === 0 || this.pc === 0xffff) {
      this.pc = 0xf800;
    }
  }

  // Branchless calculation with Cyclomatic Complexity = 1
  public getStatusByte(): number {
    return (
      (Number(this.flagN) << 7) |
      (Number(this.flagV) << 6) |
      0x20 |
      (Number(this.flagB) << 4) |
      (Number(this.flagD) << 3) |
      (Number(this.flagI) << 2) |
      (Number(this.flagZ) << 1) |
      Number(this.flagC)
    );
  }

  public setStatusByte(val: number): void {
    this.flagN = (val & 0x80) !== 0;
    this.flagV = (val & 0x40) !== 0;
    this.flagB = (val & 0x10) !== 0;
    this.flagD = (val & 0x08) !== 0;
    this.flagI = (val & 0x04) !== 0;
    this.flagZ = (val & 0x02) !== 0;
    this.flagC = (val & 0x01) !== 0;
  }

  public setZN(val: number): void {
    this.flagZ = (val & 0xff) === 0;
    this.flagN = (val & 0x80) !== 0;
  }

  public getState(): CPU65C02State {
    return {
      a: this.a,
      x: this.x,
      y: this.y,
      sp: this.sp,
      pc: this.pc,
      status: {
        n: this.flagN,
        v: this.flagV,
        e: this.flagE,
        b: this.flagB,
        d: this.flagD,
        i: this.flagI,
        z: this.flagZ,
        c: this.flagC
      },
      cycles: this.cycles,
      totalCycles: this.totalCycles,
      isHalted: this.isHalted,
      waitingForInterrupt: this.isWaiting
    };
  }

  public push(val: number): void {
    this.bus.write(0x100 | this.sp, val & 0xff);
    this.sp = (this.sp - 1) & 0xff;
  }

  public pop(): number {
    this.sp = (this.sp + 1) & 0xff;
    return this.bus.read(0x100 | this.sp);
  }

  public pushWord(val: number): void {
    this.push((val >> 8) & 0xff);
    this.push(val & 0xff);
  }

  public popWord(): number {
    const low = this.pop();
    const high = this.pop();
    return (high << 8) | low;
  }

  public irq(): void {
    if (!this.flagI) {
      this.pushWord(this.pc);
      this.push(this.getStatusByte() & ~0x10);
      this.flagI = true;
      this.flagD = false;
      const low = this.bus.read(0xfffe);
      const high = this.bus.read(0xffff);
      this.pc = (high << 8) | low;
      this.isWaiting = false;
      this.cycles += 7;
      this.totalCycles += 7;
    }
  }

  public nmi(): void {
    this.pushWord(this.pc);
    this.push(this.getStatusByte() & ~0x10);
    this.flagI = true;
    this.flagD = false;
    const low = this.bus.read(0xfffa);
    const high = this.bus.read(0xfffb);
    this.pc = (high << 8) | low;
    this.isWaiting = false;
    this.cycles += 7;
    this.totalCycles += 7;
  }

  public step(): number {
    if (this.isHalted || this.isWaiting) {
      this.cycles = 1;
      this.totalCycles += 1;
      return 1;
    }

    const opcode = this.bus.read(this.pc);
    this.pc = (this.pc + 1) & 0xffff;
    const handler = this.opcodeTable[opcode];
    const cycles = handler(this);

    this.cycles = cycles;
    this.totalCycles += cycles;
    return cycles;
  }

  // Table-driven disassembly with CC = 2
  public disassemble(addr: number): DisassemblyLine {
    const op = this.bus.peek(addr);
    const b1 = this.bus.peek((addr + 1) & 0xffff);
    const b2 = this.bus.peek((addr + 2) & 0xffff);

    const h2 = (v: number) => v.toString(16).toUpperCase().padStart(2, '0');
    const h4 = (v: number) => v.toString(16).toUpperCase().padStart(4, '0');

    const formatters: Record<number, () => DisassemblyLine> = {
      0x4c: () => ({ address: addr, bytes: [op, b1, b2], opcode: 'JMP', operands: `$${h4((b2 << 8) | b1)}`, cycles: 3 }),
      0x20: () => ({ address: addr, bytes: [op, b1, b2], opcode: 'JSR', operands: `$${h4((b2 << 8) | b1)}`, cycles: 6 }),
      0x60: () => ({ address: addr, bytes: [op], opcode: 'RTS', operands: '', cycles: 6 }),
      0xa9: () => ({ address: addr, bytes: [op, b1], opcode: 'LDA', operands: `#$${h2(b1)}`, cycles: 2 }),
      0xad: () => ({ address: addr, bytes: [op, b1, b2], opcode: 'LDA', operands: `$${h4((b2 << 8) | b1)}`, cycles: 4 }),
      0x8d: () => ({ address: addr, bytes: [op, b1, b2], opcode: 'STA', operands: `$${h4((b2 << 8) | b1)}`, cycles: 4 }),
      0x85: () => ({ address: addr, bytes: [op, b1], opcode: 'STA', operands: `$${h2(b1)}`, cycles: 3 }),
      0xa2: () => ({ address: addr, bytes: [op, b1], opcode: 'LDX', operands: `#$${h2(b1)}`, cycles: 2 }),
      0xa0: () => ({ address: addr, bytes: [op, b1], opcode: 'LDY', operands: `#$${h2(b1)}`, cycles: 2 }),
    };

    const fmt = formatters[op];
    return fmt ? fmt() : { address: addr, bytes: [op], opcode: `OP_${h2(op)}`, operands: '', cycles: 2 };
  }
}
