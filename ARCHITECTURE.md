# 🍏 Apple IIc Ultra — Architecture & Engineering Guide

This document provides a concise architectural map of the Apple IIc Ultra emulator. It is optimized for both human engineers and AI coding agents to understand subsystem boundaries, memory layout, and operational flows without loading excessive context tokens.

---

## 1. System Architecture

```
                         +-----------------------------------+
                         |     React 18 / Tailwind Canvas    |
                         |   (CRT Display, Case, Key Hooks)  |
                         +-----------------+-----------------+
                                           |
                                 requestAnimationFrame (60Hz)
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                            Apple2cUltra (Master Orchestrator)                     |
|                               src/emulator/apple2c.ts                             |
+------------------------------------------+----------------------------------------+
                                           |
                     +---------------------+---------------------+
                     |                                           |
                     v                                           v
       +----------------------------+             +-------------------------------+
       |       CPU65C02 Core        |             |       Apple2cVideo Core       |
       |  src/emulator/cpu65C02.ts  |             |     src/emulator/video.ts     |
       | (Cycle Budget: 1MHz - 50MHz|             | (DHGR, HGR, LGR, Text 40/80,  |
       +--------------+-------------+             |  NTSC Phase & CRT Phosphors)  |
                      |                           +---------------+---------------+
                      | Read / Write Bus                          | Reads VRAM
                      v                                           v
+-----------------------------------------------------------------------------------+
|                           Apple2cMMU (Memory Management Unit)                     |
|                                  src/emulator/mmu.ts                              |
|  - Main 64KB RAM + Aux 64KB RAM             - Softswitch Matrix ($C000-$C08F)     |
|  - Zero Page / Stack Banking (ALTZP)        - Language Card $D000-$FFFF Banking   |
|  - Slinky 1MB-16MB RAM ($C071-$C075)        - Slot I/O & ROM Bank Routing         |
+------------------------------------------+----------------------------------------+
                                           |
           +-------------------------------+-------------------------------+
           |                               |                               |
           v                               v                               v
+--------------------+           +-------------------+           +--------------------+
|  DiskIIController  |           | SmartPort (32MB)  |           |   Apple2cAudio     |
|  src/storage/      |           | src/storage/      |           |   src/audio.ts     |
|  diskII.ts (5.25") |           | smartport.ts (HD) |           | 1-bit + Mockingbd  |
+--------------------+           +-------------------+           +--------------------+
           |                               |                               |
           v                               v                               v
+--------------------+           +-------------------+           +--------------------+
| SlotManager (Cards)|           |  Uthernet (CS8900)|           | Modern Runtimes    |
| src/slots/         |           |  src/network/     |           | Java & C# AOT      |
| SlotManager.ts     |           |  uthernet.ts      |           | src/runtimes/      |
+--------------------+           +-------------------+           +--------------------+
```

---

## 2. Directory & Subsystem Map

| Subsystem | Key Files | Purpose |
| :--- | :--- | :--- |
| **Master Orchestrator** | [`src/emulator/apple2c.ts`](file:///h:/My%20Drive/Repos/Apple-II-Emulator/src/emulator/apple2c.ts) | Coordinates CPU cycle budget per 60Hz frame, pause/resume, binary injection, and peripheral lifecycle. |
| **CPU Core** | [`src/emulator/cpu65C02.ts`](file:///h:/My%20Drive/Repos/Apple-II-Emulator/src/emulator/cpu65C02.ts) | Cycle-accurate CMOS 65C02 instruction execution, register set, branching logic, disassembler, and interrupts. |
| **MMU & Banking** | [`src/emulator/mmu.ts`](file:///h:/My%20Drive/Repos/Apple-II-Emulator/src/emulator/mmu.ts) | 128KB base RAM banking, Zero Page/Stack switching (`ALTZP`), 80STORE video banking, Language Card banking, and Slinky 1MB-16MB expanded RAM. |
| **Video Engine** | [`src/emulator/video.ts`](file:///h:/My%20Drive/Repos/Apple-II-Emulator/src/emulator/video.ts) | Renders Text 40/80 (with MouseText), Lo-Res, Double Lo-Res, Hi-Res, and Double Hi-Res (DHGR 560x192) to HTML5 Canvas with CRT phosphor filters. |
| **Audio Subsystem** | [`src/emulator/audio.ts`](file:///h:/My%20Drive/Repos/Apple-II-Emulator/src/emulator/audio.ts) | 1-bit speaker cone toggles (`$C030`), dual AY-3-8910 Mockingboard (Slot 4/5) PSG synthesis, and Sound Blaster DAC via Web Audio API. |
| **Storage (Floppy)** | [`src/emulator/storage/diskII.ts`](file:///h:/My%20Drive/Repos/Apple-II-Emulator/src/emulator/storage/diskII.ts) | IWM floppy controller, 6-and-2 GCR nibblizing, track stepper simulation, and `.DSK`, `.PO`, `.DO`, `.NIB`, `.WOZ` loaders. |
| **Storage (Hard Disk)** | [`src/emulator/storage/smartport.ts`](file:///h:/My%20Drive/Repos/Apple-II-Emulator/src/emulator/storage/smartport.ts) | 32MB SmartPort virtual block device in Slot 7 (`$C0F0-$C0FF`) backed by browser IndexedDB / OPFS. |
| **Drive Mechanics** | [`src/emulator/storage/diskSounds.ts`](file:///h:/My%20Drive/Repos/Apple-II-Emulator/src/emulator/storage/diskSounds.ts) | Procedural Web Audio motor hum and head track stepping click sounds. |
| **Slot Bus** | [`src/emulator/slots/SlotManager.ts`](file:///h:/My%20Drive/Repos/Apple-II-Emulator/src/emulator/slots/SlotManager.ts) | 7-slot peripheral management dispatching I/O ranges `$C100-$C7FF` and `$C090-$C0FF`. |
| **ROM Management** | [`src/emulator/roms/`](file:///h:/My%20Drive/Repos/Apple-II-Emulator/src/emulator/roms) | Factory Apple IIc ROM images and custom ROM Studio builder (baking ProDOS/DOS 3.3). |
| **Modern Runtimes** | [`src/emulator/runtimes/`](file:///h:/My%20Drive/Repos/Apple-II-Emulator/src/emulator/runtimes) | Ahead-of-time bytecode compilers translating Java and C# into raw 65C02 machine code with DHGR hardware bindings. |
| **Type Definitions** | [`src/types/emulator.ts`](file:///h:/My%20Drive/Repos/Apple-II-Emulator/src/types/emulator.ts) | Central contracts: `CPU65C02State`, `SoftswitchesState`, `VideoMode`, `ClockSpeed`, `DiskDriveStatus`. |
| **UI Components** | [`src/components/`](file:///h:/My%20Drive/Repos/Apple-II-Emulator/src/components) | React frontend: CRT monitor canvas, vintage case enclosure, mechanical keyboard input, and "Under the Hood" debugger suite. |

---

## 3. Core Architectural Concepts

### Execution Loop & Cycle Budget
* The emulator runs decoupled from real time using `requestAnimationFrame` at 60Hz.
* On each frame, `Apple2cUltra.loop()` calculates a cycle budget:
  $$\text{targetCycles} = \text{clockSpeed (MHz)} \times 1,000,000 \times \text{elapsedSec}$$
* At 1.023 MHz, this equals $\sim 17,050$ cycles per frame. At 50 MHz Turbo, this scales up to $\sim 833,333$ cycles per frame.
* The CPU steps instructions until the budget is spent, updating audio and storage hooks inline, followed by a single canvas frame render.

### Memory & Softswitch Multiplexing
* The 65C02 address bus ($0000-$FFFF) is dynamically dispatched through `Apple2cMMU.read()` and `Apple2cMMU.write()`.
* Reading or writing addresses in the `$C000-$C08F` range triggers internal latch changes rather than memory access.
* The video generator directly reads Main RAM or Aux RAM depending on `80STORE` and `PAGE2` switches, bypassing CPU addressing.

---

## 4. Progressive Disclosure Reference Docs

When diving deep into a specific subsystem, refer directly to these modular markdown subdocs to avoid loading unnecessary context:

* 📄 **CPU Subsystem**: [`docs/references/cpu-65c02.md`](file:///h:/My%20Drive/Repos/Apple-II-Emulator/docs/references/cpu-65c02.md) — Register set, CMOS opcodes, cycle counts, disassembler format.
* 📄 **MMU & Banking**: [`docs/references/mmu-memory-banking.md`](file:///h:/My%20Drive/Repos/Apple-II-Emulator/docs/references/mmu-memory-banking.md) — Complete memory map, softswitches, Language Card, Slinky 1MB RAM.
* 📄 **Video Pipeline**: [`docs/references/video-graphics.md`](file:///h:/My%20Drive/Repos/Apple-II-Emulator/docs/references/video-graphics.md) — Text, LGR, HGR, DHGR scanline layouts, NTSC artifacting, phosphor shader.
* 📄 **Storage & SmartPort**: [`docs/references/storage-smartport.md`](file:///h:/My%20Drive/Repos/Apple-II-Emulator/docs/references/storage-smartport.md) — 5.25" IWM Floppy (GCR), 32MB SmartPort HD protocol, IndexedDB storage.
* 📄 **Audio & Sound**: [`docs/references/audio-mockingboard.md`](file:///h:/My%20Drive/Repos/Apple-II-Emulator/docs/references/audio-mockingboard.md) — $C030 speaker pulse, AY-3-8910 dual PSG, 6522 VIAs.
* 📄 **Testing & QA**: [`docs/references/testing-qa.md`](file:///h:/My%20Drive/Repos/Apple-II-Emulator/docs/references/testing-qa.md) — Targeted test suite commands and token-saving validation workflows.

---

## 5. Developer & Testing Cheat Sheet

To keep terminal output concise and minimize token overhead, avoid full test dumps and run focused commands:

```powershell
# 1. Type check without emitting files (very fast)
npx tsc --noEmit

# 2. Run master test suite
npm test

# 3. Targeted test suites
npm run test:typein       # Test magazine type-in programs & BASIC parser
npm run test:surface      # Test canvas rendering, keyboard, and UI surfaces
npm run test:labs         # Test educational guided practicum labs

# 4. Local Vite Dev Server
npm run dev
```

