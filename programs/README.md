# Vintage Apple II Applesoft BASIC Program Repository

This directory houses complete, verified, and clean-room validated Applesoft BASIC programs extracted from historic vintage computing magazines (e.g. *Home Computer Magazine*, *inCider*, *Nibble*, *Compute!*), tailored for the **65C02 Ultra Workstation** and Apple //c architecture.

---

## 📁 Program Catalog

### 1. **Bird Brain** (`programs/bird-brain.bas`)
* **Author**: Craig Blazakis & the HCM Staff
* **Publication**: *Home Computer Magazine*, Vol. 4, No. 5 (Pages 91–92)
* **Language**: Applesoft Floating-Point BASIC + 65C02 Machine Code Sound Driver
* **Graphics Mode**: Hi-Res Graphics Page 2 (`HGR2`, 280 &times; 192, Full Screen)
* **Animation System**: Apple II Shape Table Vector Table loaded at `$6000` (24576) via `$E8/$E9` pointer
* **Sound Engine**: 51-byte machine language pulse synthesizer loaded into Zero/Page 3 at `$0300` (768..818)
* **Control Modes**: Keyboard (`K`) or Joystick / Paddle (`J`)
* **QA Validation Report**: [`qa/bird-brain-qa-report.html`](../qa/bird-brain-qa-report.html) (100% Verified in Headless Browser CDP)

---

## 🕹️ Memory Allocation & Vector Map

| Hex Address Range | Decimal Address | Purpose / Hardware Component |
|---|---|---|
| `$00E8 - $00E9` | 232 - 233 | Zero-Page Pointer to Active Shape Table Base (`$6000`) |
| `$0300 - $0332` | 768 - 818 | 65C02 Machine Language Sound Engine Routine |
| `$2000 - $3FFF` | 8192 - 16383 | Hi-Res Graphics Page 1 VRAM (Active Game Layer) |
| `$4000 - $5FFF` | 16384 - 24575 | Hi-Res Graphics Page 2 VRAM (Landscape Buffer) |
| `$6000 - $60C7` | 24576 - 24779 | 9 Vector Shapes (Bird Flying/Perching, Wings, Fish, Splash, Ripples) |
| `$C000 / $C010` | 49152 / 49168 | Keyboard Data Latch & Keyboard Strobe Reset |

---

## ⚡ Loading & Running Inside the Emulator

1. Open [`index-standalone.html`](../index-standalone.html) in any modern web browser.
2. Open the **Cabinet Drawer** and select **Magazine Type-In / OCR Ingestion**.
3. Paste or load [`programs/bird-brain.bas`](bird-brain.bas) into the editor textarea.
4. Click **"Load into Apple //c Ultra"**.
5. Type `RUN` at the Applesoft prompt (`]`) and press **RETURN**.
