# Storage & SmartPort Subsystem Reference

This document details the dual 5.25" floppy disk controller (IWM / Disk II) and the 32MB SmartPort virtual hard drive implemented in [`src/emulator/storage/`](file:///h:/My%20Drive/Repos/Apple-II-Emulator/src/emulator/storage).

---

## 1. Dual 5.25" Floppy Subsystem (IWM / Disk II)

The Apple //c features an Integrated Woz Machine (IWM) controlling internal Drive 1 and external Drive 2.

### IWM Softswitch Registers ($C0E0–$C0EF in Slot 6)

| Address | Function | Effect |
| :--- | :--- | :--- |
| `$C0E0` / `$C0E1` | Phase 0 Off / On | Stepper motor pole 0 toggle |
| `$C0E2` / `$C0E3` | Phase 1 Off / On | Stepper motor pole 1 toggle |
| `$C0E4` / `$C0E5` | Phase 2 Off / On | Stepper motor pole 2 toggle |
| `$C0E6` / `$C0E7` | Phase 3 Off / On | Stepper motor pole 3 toggle |
| `$C0E8` / `$C0E9` | Motor Off / Motor On | Drives spindle motor on active drive |
| `$C0EA` / `$C0EB` | Drive 1 / Drive 2 Select | Switches active drive mechanism |
| `$C0EC` / `$C0ED` | Q6 Low / High | Shift register read / status strobe |
| `$C0EE` / `$C0EF` | Q7 Low / High | Read data / Write data latch |

### Track Stepping Mechanics
* 5.25" Apple II drives have 35 tracks (Tracks 0–34), subdivided into 70 half-tracks (quarter-track resolution in emulator).
* Stepping tracks requires cycling the 4 stepper phases in sequence: $0 \to 1 \to 2 \to 3 \to 0$ (forward) or reverse.
* The emulator triggers procedural mechanical sound effects on each track step (`playStepSound(track)`).

### 6-and-2 GCR Nibble Encoding
Raw 256-byte sector data is encoded into 342 GCR (Group Coded Recording) disk bytes:
1. **Address Field**:
   * Prologue: `$D5 $AA $96`
   * Volume, Track, Sector, Checksum (4-and-4 encoded)
   * Epilogue: `$DE $AA $EB`
2. **Data Field**:
   * Prologue: `$D5 $AA $AD`
   * 342 6-bit nibbles (encoded via 64-entry GCR translation table)
   * Checksum byte
   * Epilogue: `$DE $AA $EB`

### Supported Disk Image Formats
* **`.DSK` / `.DO`**: Standard 140KB raw sectors in Apple DOS 3.3 sector order (16 sectors/track × 256 bytes × 35 tracks).
* **`.PO`**: 140KB raw sectors in ProDOS logical block order.
* **`.NIB`**: Unwrapped 232,960-byte raw nibble streams (6,656 bytes/track).
* **`.WOZ` (v1 & v2)**: Flux-level bit-stream format preserving copy protection, sync bits, and weak bits.

---

## 2. 32MB SmartPort Virtual Hard Drive

The emulator implements a 32MB block device in Slot 7 (`$C0F0-$C0FF`) adhering to the Apple SmartPort / ProDOS MLI protocol.

### Block Device Geometry
* **Block Size**: 512 bytes per block.
* **Total Blocks**: 65,535 blocks ($0000-$FFFE).
* **Total Capacity**: 33,553,920 bytes (~32 MB).
* **Default Image**: `ProDOS-32MB.hdv` pre-formatted with ProDOS directory header and autoboot blocks.

### SmartPort MLI Command Protocol
ProDOS communicates with the SmartPort driver via the Machine Language Interface (MLI):

```
+---------------+---------------+---------------------------------------+
| Command Byte  | Name          | Parameters                            |
+---------------+---------------+---------------------------------------+
| $00           | STATUS        | Device status, block count, write-prot|
| $01           | READ          | Unit number, memory buffer, block #   |
| $02           | WRITE         | Unit number, memory buffer, block #   |
| $03           | FORMAT        | Unit number                           |
+---------------+---------------+---------------------------------------+
```

### Browser Storage Persistence
* Modified sectors are flagged (`isModified = true`).
* The storage manager syncs changes into **IndexedDB** (`apple2c_storage_db`) or the **Origin Private File System (OPFS)**.
* Files persist automatically across browser refreshes and system power cycles.

---

## 3. Commercial Fastloaders & Spindle Timing

Commercial titles (e.g. *Adventure Construction Set*, *World Games*) bypass DOS 3.3 RWTS with proprietary fastloaders that poll the disk latch directly.

### 32-Cycle Spindle Pacing
* **Hardware Timing**: At 1.023 MHz, 1 byte shifts into the Disk II latch every 32 $\mu\text{s}$ (~32 CPU cycles).
* **Shift Register Latch**: Fastloader polling loops execute tight `LDA $C0EC; BPL *-3` sequences. Greedy incrementation on access burns through sectors before the CPU initializes.
* **Cycle Provider Pacing**: The emulator synchronizes byte streaming to CPU cycles: `byteIndex = Math.floor(cycles / 32) % trackData.length`. Repeated reads within the 32-cycle window return `0x00` (bit 7 clear), maintaining authentic loop synchronization.

### Custom Sector Encodings & System ROM Interop
* **EA Fastloader (Stuart Smith / ACS)**:
  * Uses proprietary GCR nibblizing (`Table B` loaded at Sector 3) and custom prologues (`$D5 $AA $AD`).
  * In standard `.DSK` raw images, sectors are formatted in DOS 3.3 logical order. Nibblizing directly maps `fileSec = FloppyDisk.DOS33_SKEW[physSector]`.
  * The fastloader at `$0C00` uses lookup table `$0C48` to place physical sector $Y$ into memory page `$3E + $0C48[Y]`. Physical sector 1 loads File Sector 7 into Page `$A8`, matching the game's main entry point at `$A806`.
  * **System Monitor `$FCA8` (`WAIT`)**: Fastloader delay and pacing loops jump to `$FCA8`. The emulator ROM provides the standard 12-byte Apple II monitor routine (`SEC; PHA; SBC #1; BNE; PLA; SBC #1; BNE; RTS`, duration: $\approx \frac{26 + 27A + 5A^2}{2}$ $\mu\text{s}$) to avoid stack corruption.
* **Epyx Vorpal**: Relies on sub-millisecond bitstream timing loops across tracks.

---

## 4. Related Files

* Disk II Floppy Controller: [`src/emulator/storage/diskII.ts`](file:///h:/My%20Drive/Repos/Apple-II-Emulator/src/emulator/storage/diskII.ts)
* SmartPort Hard Drive: [`src/emulator/storage/smartport.ts`](file:///h:/My%20Drive/Repos/Apple-II-Emulator/src/emulator/storage/smartport.ts)
* Stepper & Motor Audio: [`src/emulator/storage/diskSounds.ts`](file:///h:/My%20Drive/Repos/Apple-II-Emulator/src/emulator/storage/diskSounds.ts)

