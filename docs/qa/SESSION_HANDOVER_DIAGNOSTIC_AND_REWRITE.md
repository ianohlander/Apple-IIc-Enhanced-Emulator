# Engineering Session Handover & Diagnostic Summary

## Overview & Context
This document serves as the official handover brief for the incoming AI agent and user session continuing the clean-room architecture and emulator fixes for the **Apple //c Ultra Workstation** project.

---

## 1. Answers to User's Architectural Questions

| Question | Answer | Details |
| :--- | :---: | :--- |
| **Is it the emulator?** | **YES** | Critical core logic bugs were proven: `bootFloppy()` fails to reset Language Card bank softswitches and zero-page memory on reboot; `writeString()` bakes byte `0x60` into VRAM; `drawShape()` double-renders XOR vector shapes. |
| **Residue of old HLI application?** | **YES, EXTENSIVELY** | `index-standalone.html` still contains 1,500+ lines of a synthetic JavaScript BASIC interpreter (`executeBasicLoop`, `evalBasicExpr`, `basicVars`, etc.) and fake hardcoded string injection stubs for DOS 3.3 and ProDOS. |
| **Are the ROMs completely replicated?** | **NO** | `defaultRoms.ts` (and standalone HTML) contains only ~500 bytes of hand-assembled stubs. Applesoft BASIC ($E000–$F7FF) and Monitor ($F800–$FFFF) are 95% unpopulated NOP (`0xEA`) filler bytes rather than authentic 32 KB binaries. |

---

## 2. Root Cause Analysis of 5 User-Reported Anomalies

### Issue 1: Cursor Blinking Accent / Backtick (`) Artifact
- **Symptom**: A backtick (`` ` ``) appears where the cursor blinks when the cursor toggles from solid block to off/black.
- **Visual Evidence**: `qa/screenshots/diag_cursor_frame_0.png` (ON: `] █`) vs `diag_cursor_frame_1.png` (OFF: `] ` `).
- **Code Trace**:
  - `index-standalone.html:4619`: `writeString()` writes `0x60` into VRAM when it encounters `'█'`.
  - Lines 503, 2263, 2275, 5546, 5552, 5579 initialize prompts with `"] █"`, placing `0x60` at column 2.
  - Line 7063: When `cursorBlinkOn === false`, `renderScreen()` falls back to `decodeApple2Char(ram[base+col])`.
  - Line 7088-7091: `if (raw >= 0x60 && raw <= 0x7f) return String.fromCharCode(raw);`. For `0x60`, this returns ASCII 96 (the backtick `` ` ``).
- **Targeted Fix**:
  - Prompts must NOT write `0x60` into VRAM. Blank space is `0xA0` (Apple II screen code for space).
  - Cursors should be rendered purely in canvas rasterization as an overlay on top of the underlying VRAM character.

### Issue 2: DOS 3.3 Disk Boot Prints Hardcoded Text
- **Symptom**: Clicking Boot on Drive 1 prints `"APPLESOFT BASIC READY"`.
- **Visual Evidence**: `qa/screenshots/diag_dos33_boot.png`.
- **Code Trace**:
  - `index-standalone.html:2271–2277`:
    ```javascript
    // Default DOS 3.3 Master
    window.emulator.writeString(0, 8, "APPLE //c ULTRA (50 MHz)");
    window.emulator.writeString(1, 2, "DOS 3.3 SYSTEM MASTER (1980)");
    window.emulator.writeString(2, 2, "APPLESOFT BASIC READY");
    window.emulator.writeString(4, 0, "] █");
    ```
- **Targeted Fix**:
  - Connect preset to an authentic DOS 3.3 disk image (or mount genuine 140KB DSK), and let Slot 6 bootstrap firmware ($C600) boot it through the 65C02 CPU.

### Issue 3: World Games Disk 1 Boots to Nothing / Stalls
- **Symptom**: Selecting World Games and clicking Boot does nothing.
- **Visual Evidence**: `qa/screenshots/diag_worldgames_boot.png`. State dump: `{ mountedDisk: null, running: true, pc: "fd28", diskDrive: null }`.
- **Code Trace**:
  - Lines 1836–1840: `selectDiskPreset('worldgames')` sets `window.mountedDisks[1] = null`.
  - Lines 5307–5316: `launchWorldGames()` checks `let parsed = window.mountedDisks[1]; if (parsed) { this.bootFloppy(parsed); }`.
  - Because `parsed` is `null`, `bootFloppy()` is never called!
- **Targeted Fix**:
  - Implement `mountWorldGamesPresetDisk()` (analogous to `mountAcsPresetDisk()`) embedding/loading `World Games disk 1A.woz`.

### Issue 4: Adventure Construction Set (ACS) Reboot Stuck at EA Splash
- **Symptom**: Boot ACS, navigate to Main Menu, press 'M' (Make Adventure). When rebooted from disk, hangs permanently at the EA splash screen.
- **Visual Evidence**: `qa/screenshots/diag_acs_after_reboot.png`. State dump: `{ pc: "0", lcBank2: true, lcReadRam: true, lcWriteRam: true, isGraphicsMode: true, isHires: true }`.
- **Code Trace**:
  - When ACS runs, Forth enables Language Card RAM banking (`lcReadRam = true`, `lcWriteRam = true`).
  - On reboot, `bootFloppy()` (lines 5241–5291) sets `PC = $0801`, but **FAILS TO RESET MMU SOFTSWITCHES** and fails to clear zero page ($0000–$00FF).
  - The 65C02 restarts with `lcReadRam = true`, causing ROM reads at `$D000–$FFFF` to read dirty LC RAM, leading to an immediate crash to `PC = $0000`.
- **Targeted Fix**:
  - In `bootFloppy()`, perform a clean hardware reset: `lcReadRam = false`, `lcWriteRam = false`, `altzp = false`, `store80 = false`, zero memory `$0000–$00FF`, reset stack pointer to `$FF`, and clear graphics mode flags.

### Issue 5: Bird Brain Wave Flickering at High Rate (1.02 MHz)
- **Symptom**: Hi-Res waves flicker violently even at 1.02 MHz speed.
- **Visual Evidence**: `qa/screenshots/diag_birdbrain_wave_frame_0.png` through `4.png`.
- **Code Trace**:
  - **Double-Draw**: In `drawShape()` (lines 6349–6388), it calls `executeSubroutine(isXdraw ? 0xF65D : 0xF601, 100)` AND ALSO runs a JS loop calling `xorHiresPixel()`. XORing twice toggles the shape on and immediately off.
  - **Timing Desync**: `executeBasicLoop()` runs via `setTimeout(..., 20)` in bursts of 15–25 statements. Rapid draw/erase cycles (`XDRAW 9`) happen asynchronously to the 60 Hz `requestAnimationFrame` canvas refresh, causing the renderer to display partially or fully erased frames.
- **Targeted Fix**:
  - Remove redundant `executeSubroutine(0xF65D)` call in `drawShape()`.
  - Lock statement execution pacing to the 60 Hz VBL frame cycle.

---

## 3. Git Status & Remote Alignment
- **Branch**: `main`
- **Fallback Stable Branch**: `backup/pre-rewrite-stable`
- **Remote**: `https://github.com/ianohlander/Apple-IIc-Enhanced-Emulator.git`
- **Latest Commit**: `e15d2a8` (`docs(qa): add forensic diagnostic and root cause report for 5 user issues and architectural audit`)
- **Published Artifacts**:
  - `qa/emulator-diagnostic-and-root-cause-report.html` (Accessible via QA portal)
  - `docs/qa/emulator-diagnostic-and-root-cause-report.html`
  - 19 high-resolution diagnostic screenshots in `qa/screenshots/` and `docs/qa/screenshots/`

---

## 4. Comprehensive Remediation Tasks & Execution Guide

### Task 1: Cursor Accent Artifact Remediation
- **Target File**: `index-standalone.html` (Lines 4619, 503, 2263, 2268, 2275, 5546, 5552, 5579, 7063)
- **Concrete Code Edits**:
  1. In `writeString(row, col, text)` (line 4619):
     - Remove `if (ch === '█') this.ram[base + col + i] = 0x60;`.
     - Standardize all characters so that any space or padding writes `$A0` (standard Apple II normal space).
  2. Replace all hardcoded prompt string calls from `"] █"` to standard Apple II prompt `"] "`:
     - Line 503 (Power button): Change `writeString(4, 0, "] █")` to `writeString(4, 0, "] ")`.
     - Lines 2263, 2268, 2275 (Preset loaders): Change to `"] "`.
     - Lines 5546, 5552, 5579 (BASIC line exit): Change to `"] "`.
  3. In `renderScreen()` (line 7063):
     - Ensure the blinking block cursor `█` is rendered on top of the underlying VRAM space character exclusively when `cursorBlinkOn === true`.
     - When `cursorBlinkOn === false`, it renders the underlying character in VRAM (`ram[base + col]`), which is `$A0` (space), rendering completely blank with zero accent artifacts.
- **Success Criteria**: `diag_cursor_frame_0.png` shows solid block; `diag_cursor_frame_1.png` shows clean blank space behind the `]` prompt without grave accent (`).

---

### Task 2: Authentic DOS 3.3 Disk Boot Remediation
- **Target File**: `index-standalone.html` (Lines 1835–1865, 2270–2278)
- **Concrete Code Edits**:
  1. Remove the fake hardcoded text write in `bootFloppyDrive()` (lines 2271–2277) that manually writes `"APPLESOFT BASIC READY"`.
  2. Mount the authentic DOS 3.3 System Master disk image (`window.DOS33_DISK_BASE64` or parse from `disks/`) into `window.mountedDisks[1]`.
  3. Invoke `window.emulator.bootFloppy(mountedDisk)` so the 65C02 CPU boots from Sector 0 via the authentic Disk II boot ROM ($C600).
- **Success Criteria**: Booting Drive 1 executes the authentic DOS 3.3 boot sequence, displays the genuine DOS 3.3 header from disk, and drops into Applesoft BASIC through the 65C02 CPU.

---

### Task 3: World Games Preset Loading & Fastloader Remediation
- **Target File**: `index-standalone.html` (Lines 1835–1840, 5307–5316)
- **Concrete Code Edits**:
  1. In `selectDiskPreset(preset)` (lines 1835–1840):
     - When `preset === 'worldgames'`, do NOT leave `window.mountedDisks[1]` as `null`.
     - Implement `window.mountWorldGamesPresetDisk()` (analogous to `mountAcsPresetDisk()`) which decodes and parses `World Games disk 1A.woz` into `window.mountedDisks[1]`.
  2. In `launchWorldGames()`:
     - Ensure `let parsed = (window.mountedDisks && window.mountedDisks[1]) || window.mountWorldGamesPresetDisk();` is populated.
     - Call `this.bootFloppy(parsed)`.
  3. In `handleDiskIo(off)` (line 3985):
     - Ensure WOZ raw bitstream tracks are streamed through latch `$C0EC` to support Epyx Vorpal fastloader synchronization.
- **Success Criteria**: Selecting World Games and clicking Boot transitions into graphics mode and displays the Epyx World Games splash/menu.

---

### Task 4: Hardware Cold Reset on Floppy Boot (ACS Reboot Fix)
- **Target File**: `index-standalone.html` (Lines 5241–5291, `bootFloppy()`)
- **Concrete Code Edits**:
  1. In `bootFloppy(parsedDisk)`, perform a complete hardware state reset prior to loading sector 0:
     - **Reset MMU Bank Switches**:
       ```javascript
       this.lcReadRam = false;   // $C080..$C08B: Read ROM, not LC RAM
       this.lcWriteRam = false;  // LC RAM write-protected
       this.lcBank2 = true;      // Default to Bank 2 ($D000)
       this.lcPreWrite = false;
       this.altzp = false;       // $C008: Main zero page & stack ($0000-$01FF)
       this.store80 = false;     // $C000: 80STORE disabled
       this.ramReadAux = false;  // $C002: Read main 48KB RAM
       this.ramWriteAux = false; // $C004: Write main 48KB RAM
       this.isCol80 = false;     // 40-column display
       this.altCharset = false;  // Standard character ROM
       ```
     2. **Zero Out Zero Page & Language Card Flags**:
        ```javascript
        for (let i = 0x0000; i < 0x0100; i++) {
          this.ram[i] = 0x00; // Clear dirty Forth pointers and vectors
        }
        ```
     3. **Reset CPU Stack & Flags**:
        ```javascript
        this.sp = 0xFF;
        this.status = 0x24; // Unused bit 5 set, Interrupts disabled
        this.pc = 0x0801;
        ```
     4. **Reset Graphics Mode**:
        ```javascript
        this.isGraphicsMode = false;
        this.mixedGraphics = false;
        this.isHires = false;
        this.clearHiresVram();
        ```
- **Success Criteria**: Booting ACS, pressing 'M' to Make Adventure, and triggering a disk reboot resets cleanly, displays the Electronic Arts logo, and responds to Spacebar to advance to the Title Screen with zero crashes (`PC != $0000`).

---

### Task 5: Bird Brain Wave Flickering Remediation
- **Target File**: `index-standalone.html` (Lines 6349–6388, 5522–5596)
- **Concrete Code Edits**:
  1. In `drawShape(shapeNum, startX, startY, isXdraw)`:
     - Remove the duplicate call: `this.executeSubroutine(isXdraw ? 0xF65D : 0xF601, 100);` on line 6349.
     - Either use pure 65C02 subroutine execution OR the clean JavaScript shape parser, NEVER both.
  2. In `executeBasicLoop()` (lines 5594–5595):
     - Replace the unthrottled `setTimeout(() => this.executeBasicLoop(), delay)` with a requestAnimationFrame-aligned VBL pacing when `isGraphicsMode` is active.
     - Ensure each frame executes a bounded number of statements (max 5–8 statements per 60 Hz frame slice), so wave draw/erase cycles (`XDRAW 9`) are in lockstep with CRT vertical refresh.
- **Success Criteria**: Running Bird Brain in Type-In Studio at 1.02 MHz produces smooth ocean wave animations without high-frequency strobing or missing pixels.

---

### Task 6: Automated Verification via Pure Browser DOM (CDP)
- **Target File**: `scratch/diagnose_user_reported_issues.mjs` and `tests/interactiveDomUatTest.mjs`
- **Execution**:
  - Run `node scratch/diagnose_user_reported_issues.mjs` to execute all 5 scenarios end-to-end via headless Chrome/Edge DOM events.
  - Verify all 5 scenarios pass with 0 errors and capture updated screenshots in `qa/screenshots/`.
  - Re-run `npm test` and `node tests/typeinTestSuite.mjs` to ensure zero regressions across peripheral cabinets and tutorial labs.

