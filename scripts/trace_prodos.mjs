import fs from 'fs';

// Simple 65C02 emulator test harness to trace ProDOS boot
// We can use CPU65C02 and Apple2cMMU from src/emulator!
// Let's see if we can import the CPU directly:
"use strict";

// Let's create a minimal 6502 tracer
class Simple6502 {
  constructor(ram, rom) {
    this.ram = ram;
    this.rom = rom;
    this.a = 0;
    this.x = 0x60;
    this.y = 0;
    this.sp = 0xff;
    this.pc = 0x0801;
    this.c = false;
    this.z = false;
    this.i = true;
    this.d = false;
    this.v = false;
    this.n = false;
    this.cycles = 0;
  }

  read(addr) {
    addr &= 0xffff;
    if (addr >= 0xc000 && addr <= 0xc0ff) {
      if (addr === 0xc08c || addr === 0xc0ec) {
        // Disk II read latch
        return 0x96; // return valid nibble with high bit set
      }
      return 0x00;
    }
    if (addr >= 0xc000) {
      return this.rom[addr - 0xc000] || 0xea;
    }
    return this.ram[addr];
  }

  write(addr, val) {
    addr &= 0xffff;
    val &= 0xff;
    if (addr < 0xc000) {
      this.ram[addr] = val;
    }
  }
}

// Let's inspect the exact instructions from $0801 to $09FF
const wozBuf = fs.readFileSync('disks/World Games/World Games disk 1A.woz');
// We already know sec0 and sec2
// Let's load the parsed disk from diagnose_world_games:
import { execSync } from 'child_process';
const out = execSync('node scripts/diagnose_world_games.mjs').toString();
console.log('Tested diagnose_world_games output length:', out.length);

