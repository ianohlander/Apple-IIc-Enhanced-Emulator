# MMU & Memory Banking Reference

This document details the Memory Management Unit (MMU), softswitch matrix, and banked memory subsystems implemented in [`src/emulator/mmu/Apple2cMMU.ts`](file:///h:/My%20Drive/Repos/Apple-II-Emulator/src/emulator/mmu/Apple2cMMU.ts).

---

## 1. 64KB Address Space Layout

The 65C02 addresses 64KB ($0000-$FFFF) partitioned into dynamic banks:

```
$FFFF +-------------------------------------------------------+
      |  Language Card High RAM (8KB) OR Motherboard ROM       |
$E000 +-------------------------------------------------------+
      |  Language Card Bank 1 (4KB) / Bank 2 (4KB) OR ROM      |
$D000 +-------------------------------------------------------+
      |  Shared Slot Expansion ROM ($C800-$CFFF)              |
$C800 +-------------------------------------------------------+
      |  Peripheral Slot 1-7 ROM Space ($C100-$C7FF)          |
$C100 +-------------------------------------------------------+
      |  Hardware I/O & Softswitches ($C000-$C0FF)            |
$C000 +-------------------------------------------------------+
      |  Main Program RAM (48KB) OR Aux Program RAM           |
      |  (Includes Text $0400-$07FF & Hi-Res $2000-$3FFF)     |
$0200 +-------------------------------------------------------+
      |  Hardware Stack ($0100-$01FF) [Main or Aux via ALTZP]  |
$0100 +-------------------------------------------------------+
      |  Zero Page ($0000-$00FF)       [Main or Aux via ALTZP]  |
$0000 +-------------------------------------------------------+
```

---

## 2. Memory Banking Rules

### A. Zero Page & Stack (`ALTZP` - `$C008` / `$C009`)
* When `ALTZP` is **0** (default): Reads/writes to `$0000-$01FF` access **Main RAM**.
* When `ALTZP` is **1**: Reads/writes to `$0000-$01FF` redirect to **Auxiliary RAM**.
* Language card banking also tracks `ALTZP` to select Main vs Aux Language Card memory.

### B. Program Memory (`RAMRD` / `RAMWRT` & `80STORE`)
* **`RAMRD` (`$C002/$C003`)**: Controls whether reads from `$0200-$BFFF` come from Main or Aux RAM.
* **`RAMWRT` (`$C004/$C005`)**: Controls whether writes to `$0200-$BFFF` go to Main or Aux RAM.
* **`80STORE` Override (`$C000/$C001`)**:
  * When `80STORE = 1`:
    * If `PAGE2 = 0`: Accesses to video page 1 (`$0400-$07FF` or `$2000-$3FFF` if `HIRES = 1`) go to **Main RAM**.
    * If `PAGE2 = 1`: Accesses to video page 1 go to **Auxiliary RAM** (used by 80-column text & DHGR graphics).
  * When `80STORE = 0`: Standard `RAMRD`/`RAMWRT` rules apply regardless of `PAGE2`.

### C. Language Card Banking (`$C080-$C08F`)
The top 12KB (`$D000-$FFFF`) functions as either ROM or RAM (Language Card):

| Address (Hex) | Read Target | Write State | Bank for `$D000-$DFFF` |
| :--- | :--- | :--- | :--- |
| `$C080` / `$C084` | LC RAM | Disabled | Bank 2 |
| `$C081` / `$C085` | ROM | Write Enabled (2 consecutive reads) | Bank 2 |
| `$C082` / `$C086` | ROM | Disabled | Bank 2 |
| `$C083` / `$C087` | LC RAM | Write Enabled (2 consecutive reads) | Bank 2 |
| `$C088` / `$C08C` | LC RAM | Disabled | Bank 1 |
| `$C089` / `$C08D` | ROM | Write Enabled (2 consecutive reads) | Bank 1 |
| `$C08A` / `$C08E` | ROM | Disabled | Bank 1 |
| `$C08B` / `$C08F` | LC RAM | Write Enabled (2 consecutive reads) | Bank 1 |

* Write protection requires **two consecutive reads** to the write-enable register before writes become active.

---

## 3. Extended Slinky RAM ($C071–$C075)

The Apple IIc Ultra implements the Apple Slinky / RamFactor extended RAM protocol, allowing up to 16MB of expanded memory accessible via auto-incrementing data ports:

| Register | Read / Write | Function |
| :--- | :--- | :--- |
| `$C071` | Write | Set Address Register Low Byte (`A0 - A7`) |
| `$C072` | Write | Set Address Register Middle Byte (`A8 - A15`) |
| `$C073` | Write | Set Address Register High Byte (`A16 - A23`) |
| `$C074` | Read / Write | Slinky Data Port (auto-increments 24-bit address counter) |
| `$C075` | Read / Write | Slinky Data Port alias |

ProDOS recognizes this memory as `/RAM` via the standard `RAM.DRVR` driver.

---

## 4. Master Softswitch Reference Table

| Softswitch | Read / Write | Function / Effect |
| :--- | :--- | :--- |
| `$C000` | Read | Keyboard data byte (bit 7 = key strobe set) |
| `$C000` | Write | `80STORE` Off |
| `$C001` | Write | `80STORE` On |
| `$C002` / `$C003` | Write | `RAMRD` Off (Main) / On (Aux) |
| `$C004` / `$C005` | Write | `RAMWRT` Off (Main) / On (Aux) |
| `$C008` / `$C009` | Write | `ALTZP` Off (Main ZP/Stack) / On (Aux ZP/Stack) |
| `$C00C` / `$C00D` | Write | `80COL` Off (40 columns) / On (80 columns) |
| `$C00E` / `$C00F` | Write | `ALTCHAR` Off (Standard ASCII) / On (MouseText) |
| `$C010` | Read / Write | Clear keyboard strobe bit 7 |
| `$C030` | Read / Write | Speaker toggle (pulses 1-bit audio cone) |
| `$C050` / `$C051` | Write | Display Graphics / Display Text |
| `$C052` / `$C053` | Write | Display Full Screen / Display Mixed (4 lines text) |
| `$C054` / `$C055` | Write | Display Page 1 / Display Page 2 |
| `$C056` / `$C057` | Write | Display Lo-Res / Display Hi-Res |
| `$C05E` / `$C05F` | Write | Double Hi-Res (DHGR) Off / On |
| `$C061` | Read | Pushbutton 0:  Open Apple Key (bit 7 = 1 if pressed) |
| `$C062` | Read | Pushbutton 1:  Closed Apple Key (bit 7 = 1 if pressed) |

---

## 5. Related Files

* MMU Coordinator: [`src/emulator/mmu/Apple2cMMU.ts`](file:///h:/My%20Drive/Repos/Apple-II-Emulator/src/emulator/mmu/Apple2cMMU.ts)
* Softswitch Router: [`src/emulator/mmu/IoSoftswitchRouter.ts`](file:///h:/My%20Drive/Repos/Apple-II-Emulator/src/emulator/mmu/IoSoftswitchRouter.ts)
* Memory Banks: [`src/emulator/mmu/banks/`](file:///h:/My%20Drive/Repos/Apple-II-Emulator/src/emulator/mmu/banks)

