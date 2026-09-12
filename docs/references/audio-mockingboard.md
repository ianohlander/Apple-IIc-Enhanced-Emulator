# Audio & Sound Subsystem Reference

This document details the 1-bit speaker pulse emulation and the 6-voice AY-3-8910 Mockingboard synthesizer implemented in [`src/emulator/audio.ts`](file:///h:/My%20Drive/Repos/Apple-II-Emulator/src/emulator/audio.ts).

---

## 1. 1-Bit Speaker Subsystem ($C030)

The native Apple II audio system is a single 1-bit speaker toggle:

* **Softswitch**: `$C030` (`SPKR`).
* **Trigger**: Any access (read or write) toggles the state of the speaker cone from High to Low or Low to High.
* **Frequency Synthesis**: Pitch and timbre are determined purely by 65C02 instruction cycle delays between consecutive `$C030` hits.
* **Web Audio Pipeline**:
  * The MMU routes `$C030` accesses to `Apple2cAudio.toggleSpeaker()`.
  * Pulses are integrated into an audio sample buffer and scheduled with low latency through the browser's `AudioContext`.

---

## 2. Mockingboard AY-3-8910 Programmable Sound Generator (PSG)

The Apple //c Ultra implements dual General Instrument AY-3-8910 sound generators interfaced via two 6522 VIAs (Versatile Interface Adapters) mapped to Slot 4 or Slot 5.

### Synthesis Architecture
* **Total Channels**: 6 square-wave tone channels (3 channels on Chip A, 3 channels on Chip B).
* **Noise Generators**: 2 independent 5-bit pseudo-random Linear Feedback Shift Registers (LFSR).
* **Envelope Generators**: 2 16-bit hardware volume envelope generators with 8 programmable waveforms (Attack, Decay, Alternate, Repeat).

### AY-3-8910 Register Map (Registers 0–15 per chip)

| Reg | Name | Bit Width | Description |
| :--- | :--- | :--- | :--- |
| **R0** | Tone A Period Fine | 8-bit | Low 8 bits of 12-bit channel A frequency divider |
| **R1** | Tone A Period Coarse | 4-bit | High 4 bits of 12-bit channel A frequency divider |
| **R2** | Tone B Period Fine | 8-bit | Low 8 bits of channel B frequency divider |
| **R3** | Tone B Period Coarse | 4-bit | High 4 bits of channel B frequency divider |
| **R4** | Tone C Period Fine | 8-bit | Low 8 bits of channel C frequency divider |
| **R5** | Tone C Period Coarse | 4-bit | High 4 bits of channel C frequency divider |
| **R6** | Noise Period | 5-bit | Clock divider for white noise generation |
| **R7** | Mixer Control | 8-bit | Bits 0–2: Disable Tone A/B/C (active low); Bits 3–5: Disable Noise A/B/C |
| **R8** | Amplitude A | 5-bit | Bit 4 = Envelope mode; Bits 0–3 = Fixed volume level (0–15) |
| **R9** | Amplitude B | 5-bit | Bit 4 = Envelope mode; Bits 0–3 = Fixed volume level (0–15) |
| **R10** | Amplitude C | 5-bit | Bit 4 = Envelope mode; Bits 0–3 = Fixed volume level (0–15) |
| **R11** | Envelope Period Fine | 8-bit | Low 8 bits of 16-bit envelope duration |
| **R12** | Envelope Period Coarse| 8-bit | High 8 bits of 16-bit envelope duration |
| **R13** | Envelope Shape | 4-bit | Selects waveform: Sawtooth, Triangle, Decaying, Repeating |
| **R14** | I/O Port A | 8-bit | General purpose digital I/O |
| **R15** | I/O Port B | 8-bit | General purpose digital I/O |

### 6522 VIA Bus Handshaking
The 65C02 controls the PSG using VIA Port A (data lines) and Port B (control lines):
* `%000` — Inactive bus.
* `%001` — Read PSG register.
* `%010` — Write to active PSG register.
* `%011` — Latch address register (selects R0–R15).

---

## 3. Related Files

* Audio Engine & AY-3-8910 Core: [`src/emulator/audio.ts`](file:///h:/My%20Drive/Repos/Apple-II-Emulator/src/emulator/audio.ts)
* Unit Tests: [`tests/runTests.mjs`](file:///h:/My%20Drive/Repos/Apple-II-Emulator/tests/runTests.mjs) (Suite: Mockingboard AY-3-8910)

