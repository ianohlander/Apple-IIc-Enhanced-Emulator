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

## 4. Next Steps for Incoming Session
1. In `index-standalone.html`:
   - Fix 1: Replace all `"] █"` prompt strings with standard `"] "`; replace `0x60` with `0xA0` in `writeString`.
   - Fix 2: Provide authentic DOS 3.3 DSK mounting for the default boot.
   - Fix 3: Implement `mountWorldGamesPresetDisk()` to mount `World Games disk 1A.woz`.
   - Fix 4: Add MMU softswitch reset (`lcReadRam = false`, `lcWriteRam = false`, `altzp = false`) and zero-page clearing in `bootFloppy()`.
   - Fix 5: Remove duplicate subroutine execution in `drawShape()` and throttle BASIC statements to 60 Hz VBL.
2. Re-run `node scratch/diagnose_user_reported_issues.mjs` to verify all 5 issues are resolved via pure DOM surface testing.
3. Update walkthrough and commit changes to `main`.
