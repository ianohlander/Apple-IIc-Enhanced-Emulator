import { CPU65C02 } from './CPU65C02';
import { AddressingModes } from './AddressingModes';
import { ArithmeticOps } from './handlers/ArithmeticOps';
import { BranchOps } from './handlers/BranchOps';
import { LoadStoreOps } from './handlers/LoadStoreOps';
import { LogicalShiftOps } from './handlers/LogicalShiftOps';
import { StackJumpOps } from './handlers/StackJumpOps';
import { TransferFlagOps } from './handlers/TransferFlagOps';

export type InstructionHandler = (cpu: CPU65C02) => number;

export function buildOpcodeTable(): InstructionHandler[] {
  const table: InstructionHandler[] = new Array(256).fill((_cpu: CPU65C02) => 2);

  setupControlOps(table);
  setupLoadOps(table);
  setupStoreOps(table);
  setupAdcOps(table);
  setupSbcOps(table);
  setupCompareOps(table);
  setupBranchOps(table);
  setupStackJumpOps(table);
  setupTransferFlagOps(table);
  setupLogicalShiftOps(table);

  return table;
}

function setupControlOps(table: InstructionHandler[]): void {
  table[0xea] = (_cpu) => 2;
  table[0xdb] = (cpu) => { cpu.isHalted = true; return 3; };
  table[0xcb] = (cpu) => { cpu.isWaiting = true; return 3; };
  table[0x00] = (cpu) => {
    cpu.pc = (cpu.pc + 1) & 0xffff;
    cpu.pushWord(cpu.pc);
    cpu.push(cpu.getStatusByte() | 0x10);
    cpu.flagI = true;
    cpu.flagD = false;
    cpu.pc = (cpu.bus.read(0xffff) << 8) | cpu.bus.read(0xfffe);
    return 7;
  };
}

function setupLoadOps(table: InstructionHandler[]): void {
  table[0xa9] = (cpu) => { LoadStoreOps.lda(cpu, AddressingModes.fetchByte(cpu)); return 2; };
  table[0xa5] = (cpu) => { LoadStoreOps.lda(cpu, cpu.bus.read(AddressingModes.getZeroPage(cpu))); return 3; };
  table[0xb5] = (cpu) => { LoadStoreOps.lda(cpu, cpu.bus.read(AddressingModes.getZeroPageX(cpu))); return 4; };
  table[0xad] = (cpu) => { LoadStoreOps.lda(cpu, cpu.bus.read(AddressingModes.getAbsolute(cpu))); return 4; };
  table[0xbd] = (cpu) => {
    const { addr, pageCrossed } = AddressingModes.getAbsoluteX(cpu);
    LoadStoreOps.lda(cpu, cpu.bus.read(addr));
    return 4 + (pageCrossed ? 1 : 0);
  };
  table[0xb9] = (cpu) => {
    const { addr, pageCrossed } = AddressingModes.getAbsoluteY(cpu);
    LoadStoreOps.lda(cpu, cpu.bus.read(addr));
    return 4 + (pageCrossed ? 1 : 0);
  };
  table[0xa1] = (cpu) => { LoadStoreOps.lda(cpu, cpu.bus.read(AddressingModes.getIndirectX(cpu))); return 6; };
  table[0xb1] = (cpu) => {
    const { addr, pageCrossed } = AddressingModes.getIndirectY(cpu);
    LoadStoreOps.lda(cpu, cpu.bus.read(addr));
    return 5 + (pageCrossed ? 1 : 0);
  };
  table[0xb2] = (cpu) => { LoadStoreOps.lda(cpu, cpu.bus.read(AddressingModes.getIndirectZeroPage(cpu))); return 5; };

  table[0xa2] = (cpu) => { LoadStoreOps.ldx(cpu, AddressingModes.fetchByte(cpu)); return 2; };
  table[0xa6] = (cpu) => { LoadStoreOps.ldx(cpu, cpu.bus.read(AddressingModes.getZeroPage(cpu))); return 3; };
  table[0xb6] = (cpu) => { LoadStoreOps.ldx(cpu, cpu.bus.read(AddressingModes.getZeroPageY(cpu))); return 4; };
  table[0xae] = (cpu) => { LoadStoreOps.ldx(cpu, cpu.bus.read(AddressingModes.getAbsolute(cpu))); return 4; };
  table[0xbe] = (cpu) => {
    const { addr, pageCrossed } = AddressingModes.getAbsoluteY(cpu);
    LoadStoreOps.ldx(cpu, cpu.bus.read(addr));
    return 4 + (pageCrossed ? 1 : 0);
  };

  table[0xa0] = (cpu) => { LoadStoreOps.ldy(cpu, AddressingModes.fetchByte(cpu)); return 2; };
  table[0xa4] = (cpu) => { LoadStoreOps.ldy(cpu, cpu.bus.read(AddressingModes.getZeroPage(cpu))); return 3; };
  table[0xb4] = (cpu) => { LoadStoreOps.ldy(cpu, cpu.bus.read(AddressingModes.getZeroPageX(cpu))); return 4; };
  table[0xac] = (cpu) => { LoadStoreOps.ldy(cpu, cpu.bus.read(AddressingModes.getAbsolute(cpu))); return 4; };
  table[0xbc] = (cpu) => {
    const { addr, pageCrossed } = AddressingModes.getAbsoluteX(cpu);
    LoadStoreOps.ldy(cpu, cpu.bus.read(addr));
    return 4 + (pageCrossed ? 1 : 0);
  };
}

function setupStoreOps(table: InstructionHandler[]): void {
  table[0x85] = (cpu) => { LoadStoreOps.sta(cpu, AddressingModes.getZeroPage(cpu)); return 3; };
  table[0x95] = (cpu) => { LoadStoreOps.sta(cpu, AddressingModes.getZeroPageX(cpu)); return 4; };
  table[0x8d] = (cpu) => { LoadStoreOps.sta(cpu, AddressingModes.getAbsolute(cpu)); return 4; };
  table[0x9d] = (cpu) => { LoadStoreOps.sta(cpu, AddressingModes.getAbsoluteX(cpu).addr); return 5; };
  table[0x99] = (cpu) => { LoadStoreOps.sta(cpu, AddressingModes.getAbsoluteY(cpu).addr); return 5; };
  table[0x81] = (cpu) => { LoadStoreOps.sta(cpu, AddressingModes.getIndirectX(cpu)); return 6; };
  table[0x91] = (cpu) => { LoadStoreOps.sta(cpu, AddressingModes.getIndirectY(cpu).addr); return 6; };
  table[0x92] = (cpu) => { LoadStoreOps.sta(cpu, AddressingModes.getIndirectZeroPage(cpu)); return 5; };

  table[0x86] = (cpu) => { LoadStoreOps.stx(cpu, AddressingModes.getZeroPage(cpu)); return 3; };
  table[0x96] = (cpu) => { LoadStoreOps.stx(cpu, AddressingModes.getZeroPageY(cpu)); return 4; };
  table[0x8e] = (cpu) => { LoadStoreOps.stx(cpu, AddressingModes.getAbsolute(cpu)); return 4; };
  table[0x84] = (cpu) => { LoadStoreOps.sty(cpu, AddressingModes.getZeroPage(cpu)); return 3; };
  table[0x94] = (cpu) => { LoadStoreOps.sty(cpu, AddressingModes.getZeroPageX(cpu)); return 4; };
  table[0x8c] = (cpu) => { LoadStoreOps.sty(cpu, AddressingModes.getAbsolute(cpu)); return 4; };
  table[0x64] = (cpu) => { LoadStoreOps.stz(cpu, AddressingModes.getZeroPage(cpu)); return 3; };
  table[0x74] = (cpu) => { LoadStoreOps.stz(cpu, AddressingModes.getZeroPageX(cpu)); return 4; };
  table[0x9c] = (cpu) => { LoadStoreOps.stz(cpu, AddressingModes.getAbsolute(cpu)); return 4; };
  table[0x9e] = (cpu) => { LoadStoreOps.stz(cpu, AddressingModes.getAbsoluteX(cpu).addr); return 5; };
}

function setupAdcOps(table: InstructionHandler[]): void {
  table[0x69] = (cpu) => { ArithmeticOps.adc(cpu, AddressingModes.fetchByte(cpu)); return 2; };
  table[0x65] = (cpu) => { ArithmeticOps.adc(cpu, cpu.bus.read(AddressingModes.getZeroPage(cpu))); return 3; };
  table[0x75] = (cpu) => { ArithmeticOps.adc(cpu, cpu.bus.read(AddressingModes.getZeroPageX(cpu))); return 4; };
  table[0x6d] = (cpu) => { ArithmeticOps.adc(cpu, cpu.bus.read(AddressingModes.getAbsolute(cpu))); return 4; };
  table[0x7d] = (cpu) => {
    const { addr, pageCrossed } = AddressingModes.getAbsoluteX(cpu);
    ArithmeticOps.adc(cpu, cpu.bus.read(addr));
    return 4 + (pageCrossed ? 1 : 0);
  };
  table[0x79] = (cpu) => {
    const { addr, pageCrossed } = AddressingModes.getAbsoluteY(cpu);
    ArithmeticOps.adc(cpu, cpu.bus.read(addr));
    return 4 + (pageCrossed ? 1 : 0);
  };
  table[0x61] = (cpu) => { ArithmeticOps.adc(cpu, cpu.bus.read(AddressingModes.getIndirectX(cpu))); return 6; };
  table[0x71] = (cpu) => {
    const { addr, pageCrossed } = AddressingModes.getIndirectY(cpu);
    ArithmeticOps.adc(cpu, cpu.bus.read(addr));
    return 5 + (pageCrossed ? 1 : 0);
  };
  table[0x72] = (cpu) => { ArithmeticOps.adc(cpu, cpu.bus.read(AddressingModes.getIndirectZeroPage(cpu))); return 5; };
}

function setupSbcOps(table: InstructionHandler[]): void {
  table[0xe9] = (cpu) => { ArithmeticOps.sbc(cpu, AddressingModes.fetchByte(cpu)); return 2; };
  table[0xe5] = (cpu) => { ArithmeticOps.sbc(cpu, cpu.bus.read(AddressingModes.getZeroPage(cpu))); return 3; };
  table[0xf5] = (cpu) => { ArithmeticOps.sbc(cpu, cpu.bus.read(AddressingModes.getZeroPageX(cpu))); return 4; };
  table[0xed] = (cpu) => { ArithmeticOps.sbc(cpu, cpu.bus.read(AddressingModes.getAbsolute(cpu))); return 4; };
  table[0xfd] = (cpu) => {
    const { addr, pageCrossed } = AddressingModes.getAbsoluteX(cpu);
    ArithmeticOps.sbc(cpu, cpu.bus.read(addr));
    return 4 + (pageCrossed ? 1 : 0);
  };
  table[0xf9] = (cpu) => {
    const { addr, pageCrossed } = AddressingModes.getAbsoluteY(cpu);
    ArithmeticOps.sbc(cpu, cpu.bus.read(addr));
    return 4 + (pageCrossed ? 1 : 0);
  };
  table[0xe1] = (cpu) => { ArithmeticOps.sbc(cpu, cpu.bus.read(AddressingModes.getIndirectX(cpu))); return 6; };
  table[0xf1] = (cpu) => {
    const { addr, pageCrossed } = AddressingModes.getIndirectY(cpu);
    ArithmeticOps.sbc(cpu, cpu.bus.read(addr));
    return 5 + (pageCrossed ? 1 : 0);
  };
  table[0xf2] = (cpu) => { ArithmeticOps.sbc(cpu, cpu.bus.read(AddressingModes.getIndirectZeroPage(cpu))); return 5; };
}

function setupCompareOps(table: InstructionHandler[]): void {
  table[0xc9] = (cpu) => { ArithmeticOps.compare(cpu, cpu.a, AddressingModes.fetchByte(cpu)); return 2; };
  table[0xc5] = (cpu) => { ArithmeticOps.compare(cpu, cpu.a, cpu.bus.read(AddressingModes.getZeroPage(cpu))); return 3; };
  table[0xd5] = (cpu) => { ArithmeticOps.compare(cpu, cpu.a, cpu.bus.read(AddressingModes.getZeroPageX(cpu))); return 4; };
  table[0xcd] = (cpu) => { ArithmeticOps.compare(cpu, cpu.a, cpu.bus.read(AddressingModes.getAbsolute(cpu))); return 4; };
  table[0xdd] = (cpu) => {
    const { addr, pageCrossed } = AddressingModes.getAbsoluteX(cpu);
    ArithmeticOps.compare(cpu, cpu.a, cpu.bus.read(addr));
    return 4 + (pageCrossed ? 1 : 0);
  };
  table[0xd9] = (cpu) => {
    const { addr, pageCrossed } = AddressingModes.getAbsoluteY(cpu);
    ArithmeticOps.compare(cpu, cpu.a, cpu.bus.read(addr));
    return 4 + (pageCrossed ? 1 : 0);
  };
  table[0xc1] = (cpu) => { ArithmeticOps.compare(cpu, cpu.a, cpu.bus.read(AddressingModes.getIndirectX(cpu))); return 6; };
  table[0xd1] = (cpu) => {
    const { addr, pageCrossed } = AddressingModes.getIndirectY(cpu);
    ArithmeticOps.compare(cpu, cpu.a, cpu.bus.read(addr));
    return 5 + (pageCrossed ? 1 : 0);
  };
  table[0xd2] = (cpu) => { ArithmeticOps.compare(cpu, cpu.a, cpu.bus.read(AddressingModes.getIndirectZeroPage(cpu))); return 5; };
  table[0xe0] = (cpu) => { ArithmeticOps.compare(cpu, cpu.x, AddressingModes.fetchByte(cpu)); return 2; };
  table[0xe4] = (cpu) => { ArithmeticOps.compare(cpu, cpu.x, cpu.bus.read(AddressingModes.getZeroPage(cpu))); return 3; };
  table[0xec] = (cpu) => { ArithmeticOps.compare(cpu, cpu.x, cpu.bus.read(AddressingModes.getAbsolute(cpu))); return 4; };
  table[0xc0] = (cpu) => { ArithmeticOps.compare(cpu, cpu.y, AddressingModes.fetchByte(cpu)); return 2; };
  table[0xc4] = (cpu) => { ArithmeticOps.compare(cpu, cpu.y, cpu.bus.read(AddressingModes.getZeroPage(cpu))); return 3; };
  table[0xcc] = (cpu) => { ArithmeticOps.compare(cpu, cpu.y, cpu.bus.read(AddressingModes.getAbsolute(cpu))); return 4; };
}

function setupBranchOps(table: InstructionHandler[]): void {
  table[0x10] = (cpu) => BranchOps.branch(cpu, !cpu.flagN);
  table[0x30] = (cpu) => BranchOps.branch(cpu, cpu.flagN);
  table[0x50] = (cpu) => BranchOps.branch(cpu, !cpu.flagV);
  table[0x70] = (cpu) => BranchOps.branch(cpu, cpu.flagV);
  table[0x90] = (cpu) => BranchOps.branch(cpu, !cpu.flagC);
  table[0xb0] = (cpu) => BranchOps.branch(cpu, cpu.flagC);
  table[0xd0] = (cpu) => BranchOps.branch(cpu, !cpu.flagZ);
  table[0xf0] = (cpu) => BranchOps.branch(cpu, cpu.flagZ);
  table[0x80] = (cpu) => BranchOps.branch(cpu, true);

  for (let bit = 0; bit < 8; bit++) {
    table[0x0f | (bit << 4)] = (cpu) => BranchOps.branchBit(cpu, bit, false);
    table[0x8f | (bit << 4)] = (cpu) => BranchOps.branchBit(cpu, bit, true);
    table[0x07 | (bit << 4)] = (cpu) => { TransferFlagOps.rmb(cpu, bit); return 5; };
    table[0x87 | (bit << 4)] = (cpu) => { TransferFlagOps.smb(cpu, bit); return 5; };
  }
}

function setupStackJumpOps(table: InstructionHandler[]): void {
  table[0x4c] = (cpu) => { StackJumpOps.jmpAbsolute(cpu); return 3; };
  table[0x6c] = (cpu) => { StackJumpOps.jmpIndirect(cpu); return 6; };
  table[0x7c] = (cpu) => { StackJumpOps.jmpIndirectX(cpu); return 6; };
  table[0x20] = (cpu) => { StackJumpOps.jsr(cpu); return 6; };
  table[0x60] = (cpu) => { StackJumpOps.rts(cpu); return 6; };
  table[0x40] = (cpu) => { StackJumpOps.rti(cpu); return 6; };
  table[0x48] = (cpu) => { StackJumpOps.pha(cpu); return 3; };
  table[0x68] = (cpu) => { StackJumpOps.pla(cpu); return 4; };
  table[0x08] = (cpu) => { StackJumpOps.php(cpu); return 3; };
  table[0x28] = (cpu) => { StackJumpOps.plp(cpu); return 4; };
  table[0xda] = (cpu) => { StackJumpOps.phx(cpu); return 3; };
  table[0xfa] = (cpu) => { StackJumpOps.plx(cpu); return 4; };
  table[0x5a] = (cpu) => { StackJumpOps.phy(cpu); return 3; };
  table[0x7a] = (cpu) => { StackJumpOps.ply(cpu); return 4; };
}

function setupTransferFlagOps(table: InstructionHandler[]): void {
  table[0xaa] = (cpu) => { TransferFlagOps.tax(cpu); return 2; };
  table[0xa8] = (cpu) => { TransferFlagOps.tay(cpu); return 2; };
  table[0x8a] = (cpu) => { TransferFlagOps.txa(cpu); return 2; };
  table[0x98] = (cpu) => { TransferFlagOps.tya(cpu); return 2; };
  table[0xba] = (cpu) => { TransferFlagOps.tsx(cpu); return 2; };
  table[0x9a] = (cpu) => { TransferFlagOps.txs(cpu); return 2; };
  table[0xe8] = (cpu) => { TransferFlagOps.inx(cpu); return 2; };
  table[0xc8] = (cpu) => { TransferFlagOps.iny(cpu); return 2; };
  table[0xca] = (cpu) => { TransferFlagOps.dex(cpu); return 2; };
  table[0x88] = (cpu) => { TransferFlagOps.dey(cpu); return 2; };
  table[0x1a] = (cpu) => { TransferFlagOps.incAcc(cpu); return 2; };
  table[0x3a] = (cpu) => { TransferFlagOps.decAcc(cpu); return 2; };
  table[0x18] = (cpu) => { TransferFlagOps.clc(cpu); return 2; };
  table[0x38] = (cpu) => { TransferFlagOps.sec(cpu); return 2; };
  table[0x58] = (cpu) => { TransferFlagOps.cli(cpu); return 2; };
  table[0x78] = (cpu) => { TransferFlagOps.sei(cpu); return 2; };
  table[0xb8] = (cpu) => { TransferFlagOps.clv(cpu); return 2; };
  table[0xd8] = (cpu) => { TransferFlagOps.cld(cpu); return 2; };
  table[0xf8] = (cpu) => { TransferFlagOps.sed(cpu); return 2; };
}

function setupLogicalShiftOps(table: InstructionHandler[]): void {
  table[0x29] = (cpu) => { LogicalShiftOps.and(cpu, AddressingModes.fetchByte(cpu)); return 2; };
  table[0x25] = (cpu) => { LogicalShiftOps.and(cpu, cpu.bus.read(AddressingModes.getZeroPage(cpu))); return 3; };
  table[0x2d] = (cpu) => { LogicalShiftOps.and(cpu, cpu.bus.read(AddressingModes.getAbsolute(cpu))); return 4; };
  table[0x09] = (cpu) => { LogicalShiftOps.ora(cpu, AddressingModes.fetchByte(cpu)); return 2; };
  table[0x05] = (cpu) => { LogicalShiftOps.ora(cpu, cpu.bus.read(AddressingModes.getZeroPage(cpu))); return 3; };
  table[0x0d] = (cpu) => { LogicalShiftOps.ora(cpu, cpu.bus.read(AddressingModes.getAbsolute(cpu))); return 4; };
  table[0x49] = (cpu) => { LogicalShiftOps.eor(cpu, AddressingModes.fetchByte(cpu)); return 2; };
  table[0x45] = (cpu) => { LogicalShiftOps.eor(cpu, cpu.bus.read(AddressingModes.getZeroPage(cpu))); return 3; };
  table[0x4d] = (cpu) => { LogicalShiftOps.eor(cpu, cpu.bus.read(AddressingModes.getAbsolute(cpu))); return 4; };
  table[0x24] = (cpu) => { LogicalShiftOps.bit(cpu, cpu.bus.read(AddressingModes.getZeroPage(cpu))); return 3; };
  table[0x2c] = (cpu) => { LogicalShiftOps.bit(cpu, cpu.bus.read(AddressingModes.getAbsolute(cpu))); return 4; };
  table[0x89] = (cpu) => { LogicalShiftOps.bit(cpu, AddressingModes.fetchByte(cpu), true); return 2; };
  table[0x04] = (cpu) => { LogicalShiftOps.tsb(cpu, AddressingModes.getZeroPage(cpu)); return 5; };
  table[0x0c] = (cpu) => { LogicalShiftOps.tsb(cpu, AddressingModes.getAbsolute(cpu)); return 6; };
  table[0x14] = (cpu) => { LogicalShiftOps.trb(cpu, AddressingModes.getZeroPage(cpu)); return 5; };
  table[0x1c] = (cpu) => { LogicalShiftOps.trb(cpu, AddressingModes.getAbsolute(cpu)); return 6; };

  table[0x0a] = (cpu) => { cpu.a = LogicalShiftOps.asl(cpu, cpu.a); return 2; };
  table[0x06] = (cpu) => {
    const a = AddressingModes.getZeroPage(cpu);
    cpu.bus.write(a, LogicalShiftOps.asl(cpu, cpu.bus.read(a)));
    return 5;
  };
  table[0x4a] = (cpu) => { cpu.a = LogicalShiftOps.lsr(cpu, cpu.a); return 2; };
  table[0x46] = (cpu) => {
    const a = AddressingModes.getZeroPage(cpu);
    cpu.bus.write(a, LogicalShiftOps.lsr(cpu, cpu.bus.read(a)));
    return 5;
  };
  table[0x2a] = (cpu) => { cpu.a = LogicalShiftOps.rol(cpu, cpu.a); return 2; };
  table[0x26] = (cpu) => {
    const a = AddressingModes.getZeroPage(cpu);
    cpu.bus.write(a, LogicalShiftOps.rol(cpu, cpu.bus.read(a)));
    return 5;
  };
  table[0x6a] = (cpu) => { cpu.a = LogicalShiftOps.ror(cpu, cpu.a); return 2; };
  table[0x66] = (cpu) => {
    const a = AddressingModes.getZeroPage(cpu);
    cpu.bus.write(a, LogicalShiftOps.ror(cpu, cpu.bus.read(a)));
    return 5;
  };
}
