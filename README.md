# 🍏 Apple IIc Ultra — Enhanced 65C02 Web Computer

**Apple IIc Ultra** is a web-based emulator and modern retrocomputing workstation modeled after the iconic 1984 **Apple //c**, enhanced with modern capabilities while retaining authentic vintage hardware architecture, aesthetics, and "under-the-hood" hacker access.

---

## 🌟 Key Features

### ⚡ 1. Cycle-Accurate 65C02 CPU & Dynamic Speed Switching
* Full support for CMOS 65C02 instructions (`BRA`, `PHX/PHY`, `PLX/PLY`, `STZ`, `TRB/TSB`, `INC A/DEC A`, Rockwell `BBR/BBS`, `RMB/SMB`).
* **Variable CPU Speeds**:
  * **1.023 MHz** (Authentic NTSC Apple II speed)
  * **2.8 MHz** (Laser 128 / Apple IIGS speed)
  * **4.0 MHz / 8.0 MHz** (Applied Engineering TransWarp & Zip Chip speed)
  * **16.0 MHz** (Modern accelerated speed)
  * **50.0 MHz Turbo** (Uncapped execution for modern Java & .NET algorithms)

### 💾 2. 1MB+ Addressable Memory & 32MB Hard Drive
* **128KB Base Memory** (Main 64KB + Aux 64KB + Language Card $D000-$FFFF Banking).
* **1MB to 16MB Slinky / RamWorks Banked Memory** (`$C071-$C075` registers) recognized by ProDOS `RAM.DRVR` and extended applications.
* **32MB SmartPort Virtual Hard Drive** (`.HDV` / `.2MG` / `.PO`) in Slot 7 ($C0F0-$C0FF) with persistent browser IndexedDB / OPFS storage.
* **Dual 5.25" Floppy Drives (IWM / Disk II)** supporting `.DSK`, `.DO`, `.PO`, `.NIB`, and flux `.WOZ` images with mechanical stepping audio.

### 🎨 3. Double Hi-Res & CRT Phosphor Display
* **Video Modes**:
  * **Text 40x24** & **Text 80x24** (with Apple MouseText glyphs).
  * **Lo-Res (LGR)** & **Double Lo-Res (DLGR)** (16 colors).
  * **Hi-Res (HGR)** 280x192 (6 colors with NTSC phase artifacting).
  * **Double Hi-Res (DHGR)**: 560x192 monochrome / 140x192 16-color interleaved auxiliary memory graphics.
* **Retro CRT Shader Pipeline**:
  * NTSC Composite Color decoding.
  * Monochrome Phosphor selector: **P1 Green**, **P3 Amber**, **P4 White**, and **Color CRT**.
  * CRT glass curvature & scanline filters.

### 🔊 4. Audio Subsystem
* 1-bit cycle-counted speaker cone pulse toggle (`$C030`) with zero-latency Web Audio output.
* Dual **AY-3-8910 (Mockingboard)** 6-channel programmable sound generator with 6522 VIAs in Slot 4/5.
* Sound Blaster 8-bit DAC playback.

### 🛠️ 5. "Under the Hood" Vintage Hacker Suite
* **65C02 CPU Debugger**: Real-time instruction disassembler, register viewer (`A`, `X`, `Y`, `SP`, `PC`, Flags), single-step, step-over, and breakpoints.
* **Live Memory Hex Viewer & Editor**: Switch banks (Main RAM, Aux RAM, Slinky 1MB RAM, Language Card, System ROM) with live in-place byte editing.
* **Softswitch Matrix**: Interactive state indicator & toggles for `80STORE`, `RAMRD`, `RAMWRT`, `ALTZP`, `80COL`, `TEXT`, `HIRES`, `DHIRES`, `PAGE2`.
* **Custom ROM Builder Studio**: Construct custom 32KB/64KB Apple IIc ROMs with baked-in **ProDOS 2.4.x**, **BASIC.SYSTEM**, and Apple DOS 3.3 for zero-disk instant autobooting.
* **Modern Code Studio**: Write **Java** or **C# (.NET)**, compile to 65C02 machine code using the built-in AOT compiler, and execute natively on the Apple IIc with full Double Hi-Res & sound bindings.

---

## 🚀 Getting Started

### Method 1: Instant Standalone Launch (Zero Dependencies)
Open `index-standalone.html` in any modern web browser (Chrome, Edge, Firefox, Safari):
```bash
# Example with Python simple server:
python -m http.server 3000
# Then navigate to http://localhost:3000/index-standalone.html
```

### Method 2: Node.js Development Server
```bash
npm install
npm run dev
```

---

## ⌨️ Keyboard Shortcuts & Controls

| Key | Apple II Function |
| :--- | :--- |
| **Alt** |  Open Apple Button ($C061) |
| **Ctrl / Cmd** |  Closed / Solid Apple Button ($C062) |
| **Return** | Return / Enter ($0D) |
| **Delete / Backspace** | Left Arrow / Rubout ($08) |
| **Tab** | Tab ($09) |
| **Escape** | Escape ($1B) |
| **Arrow Keys** | Navigation (Left $08, Right $15, Up $0B, Down $0A) |

---

## 📁 Repository Structure

```
├── index.html                   # Standard Vite HTML entry
├── index-standalone.html        # Zero-dependency browser runner
├── package.json                 # Project configuration
├── tsconfig.json                # TypeScript compiler configuration
├── vite.config.ts               # Vite bundler configuration
├── src/
│   ├── types/
│   │   └── emulator.ts          # State definitions, softswitches, disassembler types
│   ├── emulator/
│   │   ├── cpu65C02.ts          # 65C02 cycle-accurate CPU & disassembler
│   │   ├── mmu.ts               # Memory Management Unit, Softswitches, Slinky 1MB RAM
│   │   ├── video.ts             # Video renderer: DHGR, HGR, LGR, Text 40/80, CRT Shaders
│   │   ├── audio.ts             # 1-Bit Speaker, Mockingboard AY-3-8910, Sound Blaster DAC
│   │   ├── apple2c.ts           # Master System Orchestrator & clock frequency scheduler
│   │   ├── storage/
│   │   │   ├── diskII.ts        # IWM / Floppy controller (.DSK, .PO, .NIB, .WOZ)
│   │   │   ├── smartport.ts     # 32MB SmartPort Hard Disk Controller
│   │   │   └── diskSounds.ts    # Procedural mechanical drive sounds
│   │   ├── roms/
│   │   │   ├── defaultRoms.ts   # System ROM 255/0/3/4X & MouseText Character ROM
│   │   │   └── romBuilder.ts    # Custom ROM generator (ProDOS/DOS 3.3 autoboot)
│   │   ├── network/
│   │   │   └── uthernet.ts      # CS8900A Ethernet & WebSocket bridge
│   │   └── runtimes/
│   │       ├── apple2Api.ts     # Java and C# Hardware API Definitions
│   │       ├── javaVm.ts        # Java Bytecode AOT Compiler to 65C02
│   │       └── clrRunner.ts     # C# .NET CLR AOT Compiler to 65C02
│   ├── components/
│   │   ├── CRTDisplay.tsx       # Phosphor CRT Monitor component
│   │   ├── Apple2cCase.tsx      # Platinum Snow White chassis & Drive LEDs
│   │   ├── Keyboard.tsx         # Mechanical Keyboard layout & event hook
│   │   ├── DiskLibraryModal.tsx # Built-in disk library selector
│   │   └── UnderTheHood/        # Hacker Suite: Debugger, Memory, Softswitches, Code Studio
│   └── samples/
│       ├── sampleDisks.ts       # ProDOS 2.4.2, DOS 3.3, and DHGR demo disks
│       └── sampleCode.ts        # Sample Java and C# Double Hi-Res demo programs
```
