#  The Apple //c Ultra Reference Manual & User's Guide
*A Homebrew Loving Homage to the Greatest Personal Computer of 1984 — Enhanced for the Modern Era.*

```
       .________________________.
      / .----------------------. \
     | |   Apple //c Ultra    | |
     | |  50 MHz CMOS 65C02    | |
     | |  1,024 KB Banked RAM  | |
     | |  32 MB Hard Drive     | |
     | |  Double Hi-Res Color  | |
     | |  Mockingboard Sound   | |
     | |  Java & C# AOT CLR    | |
     | |  ]                    | |
     | `----------------------' |
      \_________[====]__________/
        ||||||||||||||||||||||
```

---

## 📖 Table of Contents
1. [Chapter 1: Welcome to the Future of 1984](#chapter-1-welcome-to-the-future-of-1984)
2. [Chapter 2: Architecture & Capabilities — Vintage Meets Ultra](#chapter-2-architecture--capabilities--vintage-meets-ultra)
3. [Chapter 3: First Boot-Up & Operating Essentials](#chapter-3-first-boot-up--operating-essentials)
4. [Chapter 4: Storage & Virtual Media Management](#chapter-4-storage--virtual-media-management)
5. [Chapter 5: The Custom ROM Builder Studio](#chapter-5-the-custom-rom-builder-studio)
6. [Chapter 6: The Magazine Type-In Studio (*Compute!*, *inCider* & *Nibble*)](#chapter-6-the-magazine-type-in-studio)
7. [Chapter 7: Writing & Deploying Java and C# on the 65C02](#chapter-7-writing--deploying-java-and-c-on-the-65c02)
8. [Chapter 8: Sound & Graphics System (DHGR & Mockingboard)](#chapter-8-sound--graphics-system)
9. [Chapter 9: Under the Hood — The Vintage Hacker Workbench](#chapter-9-under-the-hood--the-vintage-hacker-workbench)
10. [Chapter 10: Hardware Memory Maps & Softswitch Tables](#chapter-10-hardware-memory-maps--softswitch-tables)

---

## Chapter 1: Welcome to the Future of 1984

Congratulations on acquiring the **Apple //c Ultra**!

In April 1984, Apple Computer unveiled the Apple //c — a sleek, snow-white portable workstation that captured the imagination of hackers, educators, and hobbyists worldwide. 

The **Apple //c Ultra** is our loving homebrew reimagining of that legendary machine. Imagine if a 1984 enthusiast were handed a magic soldering iron with technology from the distant future: a 65C02 CPU that can accelerate from the authentic **1.023 MHz** vintage clock up to a blazing **50.0 MHz Turbo**, expanded addressable memory exceeding **1 Megabyte**, a silent **32 Megabyte SmartPort Hard Disk**, rich **6-channel Mockingboard AY-3-8910 synthesis**, and an Ahead-Of-Time compiler that translates modern object-oriented **Java** and **C#** directly into raw 65C02 machine code.

Whether you are loading a floppy disk image of *The Oregon Trail*, typing in a classic listing from *inCider* magazine, or writing an object-oriented Java graphics demo for the Double Hi-Res screen, this guide will accompany your journey.

---

## Chapter 2: Architecture & Capabilities — Vintage Meets Ultra

To master the Apple //c Ultra, it helps to understand where the original 1984 hardware ends and where our modern Ultra enhancements begin.

| Subsystem | Original 1984 Apple //c | Apple //c Ultra Enhancement |
| :--- | :--- | :--- |
| **Processor** | 65C02 @ 1.023 MHz | **65C02 CMOS with dynamic clock: 1.02, 2.8, 4.0, 8.0, 16.0 & 50.0 MHz Turbo** |
| **Main Memory** | 128 KB (64K Main + 64K Aux) | **1,024 KB to 16 MB Slinky & RamWorks banked RAM** ($C071–$C075) |
| **Hard Storage** | None (Floppy only) | **32 MB SmartPort Virtual Hard Drive** (IndexedDB persistent volume) |
| **Floppy Drives** | Single internal 140 KB 5.25" | **Dual 5.25" IWM Floppy Drives** (`.DSK`, `.PO`, `.DO`, `.NIB`, flux `.WOZ`) |
| **Graphics** | Text 40/80, LGR, HGR, DHGR | **Double Hi-Res (560×192 16-color) + CRT NTSC, P1 Green, P3 Amber, P4 White** |
| **Sound** | 1-bit speaker pulse (`$C030`) | **1-bit speaker + Dual AY-3-8910 Mockingboard (6 voices) + 8-bit DAC** |
| **ROM System** | Fixed 32KB masked ROM | **Integrated ROM Builder Studio** (Bake ProDOS 2.4 / DOS 3.3 into motherboard) |
| **Modern Runtimes** | Applesoft BASIC & Assembly | **AOT Java VM & C# .NET CLR Compilers emitting native 65C02 code** |
| **Networking** | RS-232 Serial port | **Slot 3 CS8900A Uthernet Ethernet controller with WebSocket BBS bridge** |

---

## Chapter 3: First Boot-Up & Operating Essentials

### 3.1 The Front Panel & Case Controls
Look at the platinum Snow White case beneath your CRT monitor:
1. **Power Rocker Switch**: Located on the right side. Toggling turns the computer on or off.
2. **Speed Selector Switch**: Select your clock frequency on the fly:
   - **1.02 MHz**: Exact vintage Apple //c speed. Cycle-accurate for games like *Karateka* and *Lode Runner*.
   - **2.8 MHz**: Laser 128 / Apple IIGS standard speed.
   - **4.0 MHz / 8.0 MHz**: Vintage accelerator speed (TransWarp / Zip Chip).
   - **50.0 MHz Turbo**: Modern hyper-speed! Ideal for instant Java/C# compilation, Mandelbrot fractals, and 3D raycasting.
3. **Volume Slider & Mute Toggle**: Adjusts output of the 1-bit speaker cone and Mockingboard synthesizer.
4. **Drive LEDs**:
   - **DRIVE 1 (Green)**: Lights when reading/writing Floppy 1.
   - **DRIVE 2 (Amber)**: Lights when reading/writing Floppy 2.
   - **32MB HD (Red)**: Blinks when reading/writing SmartPort Hard Disk sectors.

### 3.2 CRT Phosphor & Monitor Styling
Above the chassis sits your authentic 12" CRT monitor. You can toggle between 4 phosphor styles at any time:
- **Color NTSC**: Authentic composite color artifacting.
- **P1 Green Phosphor**: The classic warm green glow of the Apple Monitor //c.
- **P3 Amber Phosphor**: Crisp high-contrast amber display.
- **P4 White Phosphor**: Monochrome paper-white monitor.
- **Scanlines & Curved Glass**: Toggle subtle phosphor raster lines and glass curvature for complete retro immersion.

---

## Chapter 4: Storage & Virtual Media Management

The Apple //c Ultra features a dual storage subsystem: authentic 5.25" floppy disk drives and an expansive 32MB SmartPort hard drive volume.

### 4.1 Mounting 5.25" Floppy Disks
1. Open the **"Floppy & 32MB HD"** tab under the hood, or click the **Disk Library** button on the chassis.
2. Choose **Drive 1** or **Drive 2**.
3. You can:
   - Mount a built-in public domain disk (e.g. *ProDOS 2.4.2*, *Apple DOS 3.3*, *Double Hi-Res Art Studio*).
   - Click **"Upload .DSK / .WOZ"** to load your own disk image files.
   - Click **"Create Blank Disk"** to create a fresh unformatted 140KB disk image.
4. The virtual stepper motor will click and hum through procedural Web Audio audio synthesis as tracks step from 0 to 34!

### 4.2 The 32 Megabyte SmartPort Hard Drive
In 1984, a 20MB hard disk cost thousands of dollars and required external power bricks. The Apple //c Ultra incorporates a **32 Megabyte ProDOS Hard Disk Volume** mapped to Slot 7.
- **Capacity**: 65,536 blocks of 512 bytes (33,554,432 bytes).
- **Persistence**: All files saved to the hard disk in ProDOS (e.g. `SAVE /HD/MYPROGRAM`) are automatically saved to your browser's IndexedDB database.
- **Exporting**: Click **"Download HDV Image"** to save your entire 32MB virtual drive to your computer.

---

## Chapter 5: The Custom ROM Builder Studio

Why wait for a floppy disk to boot when you can bake your operating system directly into the motherboard ROM?

1. Navigate to the **"Custom ROM Studio"** tab under the hood.
2. Select your desired ROM configuration:
   - **Bundle ProDOS 2.4.x**: Bakes the ProDOS kernel into the $D000–$FFFF ROM bank.
   - **Bundle Apple DOS 3.3**: Includes classic DOS 3.3 file manager routines.
   - **Custom Boot Banner**: Type your own message (e.g., `APPLE //c ULTRA - HOMEBREW SPECIAL EDITION`).
   - **Autoboot Vector**: Enables instant power-on boot without looking for a disk.
3. Click **"⚡ Hot-Load into Motherboard"**: The emulator immediately flashes the custom ROM into system memory and performs a cold reset.

---

## Chapter 6: The Magazine Type-In Studio

In the 1980s, computer magazines like *Compute!*, *inCider*, *Nibble*, and *Softalk* published dozens of pages of source code every month. Users spent hours typing them in line-by-line.

The **Magazine Type-In Studio** gives you three seamless modern ways to bring those historical treasures back to life:

```
+-----------------------------------------------------------------------+
|  [Vintage Library]   [Text Typer]   [Magazine Scan OCR]   [URL Fetch] |
+-----------------------------------------------------------------------+
|  Select Type-In Speed:  (•) Fast (15ms)   ( ) Human (50ms)  ( ) Turbo |
|                                                                       |
|  10 REM *** INCIDER MAGAZINE DHGR KALEIDOSCOPE ***                    |
|  20 POKE 49232,0 : POKE 49239,0 : POKE 49165,0 : POKE 49247,0        |
|  30 HGR : POKE 49234,0 : HCOLOR= 3                                    |
|  40 FOR R = 10 TO 90 STEP 5 ...                                       |
|                                                                       |
|  [⌨️ FEED INTO APPLE II KEYBOARD BUFFER]                              |
+-----------------------------------------------------------------------+
```

### Method 1: Pasting Text & Virtual Keyboard Auto-Typer
1. Switch to the **"Text Editor / Typer"** tab.
2. Paste any Applesoft BASIC program (with line numbers) or Monitor hex dump (e.g., `300: A9 00 8D 50 C0 60`).
3. Select your typing speed: **Human** (50ms), **Fast** (15ms), or **Instant**.
4. Click **"Feed into Apple II"**: Watch the keystrokes stream into the Apple //c screen!

### Method 2: Screenshot / Magazine Page OCR
1. Take a screenshot or photo of any page from an old *Nibble* or *Compute!* magazine PDF.
2. Upload the image in the **"Magazine Scan (OCR)"** tab.
3. The engine automatically enhances contrast, extracts BASIC lines, corrects vintage typography artifacts (`O` vs `0`, `I` vs `1`, curly quotes), and populates the text editor ready for injection.

### Method 3: Online Archive & URL Importer
1. Paste a raw GitHub Gist URL or URL to an online `.bas` listing in the **"URL / Archive"** tab.
2. Click **"Fetch & Parse"** to import the listing directly.

---

## Chapter 7: Writing & Deploying Java and C# on the 65C02

The Apple //c Ultra includes an **Ahead-Of-Time (AOT) Bytecode Compiler** allowing you to write modern, clean, Object-Oriented code in **Java** or **C#** and compile it down to native 65C02 machine instructions that execute directly on the silicon!

### 7.1 Java Development Tutorial

Here is a complete Java program utilizing the Apple //c Ultra hardware API:

```java
import apple2.hardware.AppleGraphics;
import apple2.hardware.AppleAudio;
import apple2.hardware.AppleSystem;

public class UltraSpaceDemo {
    public static void main(String[] args) {
        // Switch to Double Hi-Res 16-Color Graphics
        AppleGraphics.setVideoMode(AppleGraphics.MODE_DOUBLE_HIRES);
        AppleGraphics.clearScreen(AppleGraphics.COLOR_BLACK);
        
        // Play welcome chime on the Mockingboard
        AppleAudio.beep(880, 200);
        
        // Print message through Apple //c ROM routine
        AppleSystem.print("WELCOME TO JAVA ON THE 65C02!");
    }
}
```

### 7.2 C# .NET Development Tutorial

Here is the equivalent in modern C#:

```csharp
using Apple2.Ultra;

namespace AppleUltraDemo {
    public class Program {
        public static void Main() {
            // Enable Double Hi-Res Mode
            AppleVideo.SetDoubleHiRes(true);
            
            // Output audio through 1-bit speaker pulse
            AppleSound.Beep(440, 150);
            
            // Write text to the console
            Console.WriteLine("C# .NET CLR RUNNING ON APPLE IIC!");
        }
    }
}
```

### 7.3 How to Compile & Run:
1. Open the **"Java & .NET CLR"** tab under the hood.
2. Choose **Java** or **C#** from the language switcher.
3. Click **"⚡ Compile & Run on 65C02"**.
4. The AOT engine translates your object-oriented statements into 65C02 machine instructions, displays the assembly listing in the disassembly inspector, injects the binary into memory starting at `$2000`, and sets the CPU program counter to `$2000` to execute instantly!

---

## Chapter 8: Sound & Graphics System

### 8.1 Double Hi-Res Graphics (DHGR)
The Apple //c Ultra supports the magnificent **Double Hi-Res** graphics mode:
- **Monochrome Resolution**: 560 × 192 pixels.
- **Color Resolution**: 140 × 192 pixels with 16 distinct colors.
- **Architecture**: Interleaves memory from Main Video RAM (`$2000–$3FFF`) and Auxiliary Video RAM (`$2000–$3FFF`) using the `80COL` (`$C00D`) and `DHIRES` (`$C05F`) softswitches.

### 8.2 Audio Engines: Speaker, Mockingboard & DAC
- **1-Bit Speaker (`$C030`)**: Toggle this register to pulse the internal speaker cone.
- **Mockingboard Dual AY-3-8910 (Slot 4 `$C0C0–$C0CF`)**: Provides 6 simultaneous audio channels, programmable square-wave frequency generators, white noise generators, and hardware envelope modulators.
- **Phasor / Sound Blaster 8-Bit DAC**: High-fidelity digital sound sample playback.

---

## Chapter 9: Under the Hood — The Vintage Hacker Workbench

For developers and hardware tinkerers, the **Under the Hood Inspector** provides deep introspection into every cycle of the machine:

```
+-------------------------------------------------------------------+
|  A: $00   X: $FF   Y: $00   SP: $FF   PC: $2000   FLAGS: [N..I.Z.] |
+-------------------------------------------------------------------+
|  $2000: D8         CLD                     (2 cycles)             |
|  $2001: A2 FF      LDX #$FF                (2 cycles)             |
|  $2003: 9A         TXS                     (2 cycles)             |
|  $2004: 8D 50 C0   STA $C050 [TXTCLR]      (4 cycles)             |
|  $2007: 8D 57 C0   STA $C057 [HIRES]       (4 cycles)             |
|  $200A: 60         RTS                     (6 cycles)             |
+-------------------------------------------------------------------+
|  [ STEP (F10) ]   [ STEP OVER ]   [ RESUME ]   [ SET BREAKPOINT ] |
+-------------------------------------------------------------------+
```

1. **65C02 CPU Debugger**:
   - Inspect all registers (`A`, `X`, `Y`, `SP`, `PC`) and individual status flags (`N`, `V`, `E`, `B`, `D`, `I`, `Z`, `C`).
   - Step through execution opcode-by-opcode with exact cycle counting.
   - Set execution breakpoints at any memory address.
2. **Memory Hex Map & Live Editor**:
   - Switch between **Main RAM (64KB)**, **Auxiliary RAM (64KB)**, **Slinky Banked RAM (1MB–16MB)**, **Language Card**, and **System ROM**.
   - Edit any byte in memory in real-time.
3. **Softswitch Matrix**:
   - Live visual matrix of all hardware switches: `80STORE`, `RAMRD`, `RAMWRT`, `ALTZP`, `80COL`, `TEXT`, `HIRES`, `DHIRES`, `PAGE2`.
   - Click any switch to toggle hardware states on the fly!

---

## Chapter 10: Hardware Memory Maps & Softswitch Tables

### 10.1 Primary Memory Address Map
```
$0000 - $00FF : Zero Page (Switched by ALTZP $C008/$C009)
$0100 - $01FF : CPU Stack (Switched by ALTZP $C008/$C009)
$0200 - $03FF : System Buffers & Vectors
$0400 - $07FF : Text & Lo-Res Video Page 1 (Main / Aux via 80STORE)
$0800 - $0BFF : Text & Lo-Res Video Page 2
$2000 - $3FFF : Hi-Res Video Page 1 (Main & Aux for Double Hi-Res)
$4000 - $5FFF : Hi-Res Video Page 2
$6000 - $BFFF : User Program RAM (Main / Aux via RAMRD $C003 / RAMWRT $C005)
$C000 - $C0FF : Hardware I/O Softswitches & Peripheral Slots
$C100 - $C7FF : Peripheral Slot ROMs (Slot 3 Ethernet, Slot 4 Audio, Slot 7 HD)
$C800 - $CFFF : Peripheral Expansion ROM
$D000 - $DFFF : Language Card Bank 1 / Bank 2 RAM or System ROM
$E000 - $FFFF : Language Card High RAM or System ROM (Reset Vector at $FFFC)
```

### 10.2 Essential Softswitch Register Reference
| Register | Read / Write | Action |
| :--- | :--- | :--- |
| **$C000** | Read | Keyboard strobe / ASCII character |
| **$C010** | Read/Write | Clear keyboard strobe |
| **$C030** | Read/Write | Toggle 1-bit speaker cone |
| **$C000 / $C001** | Write | 80STORE Off / On |
| **$C002 / $C003** | Write | RAMRD Main / Aux |
| **$C004 / $C005** | Write | RAMWRT Main / Aux |
| **$C008 / $C009** | Write | ALTZP Main / Aux |
| **$C00C / $C00D** | Write | 80COL Off (40 columns) / On (80 columns) |
| **$C050 / $C051** | Read/Write | Graphics Mode / Text Mode |
| **$C052 / $C053** | Read/Write | Full Screen / Mixed Screen (4 lines text) |
| **$C054 / $C055** | Read/Write | Page 1 / Page 2 |
| **$C056 / $C057** | Read/Write | Lo-Res / Hi-Res |
| **$C05E / $C05F** | Read/Write | Double Hi-Res Off / On |
| **$C071** | Read/Write | Slinky 1MB Expanded RAM Data Port (Auto-Increment) |
| **$C073–$C075** | Write | Slinky 24-bit RAM Address Registers (Low, Mid, High) |
| **$C080–$C08F** | Read/Write | Language Card Bank 1/Bank 2 RAM/ROM Controller |

---

*Thank you for exploring the Apple //c Ultra! Happy hacking, computing, and coding.* 
