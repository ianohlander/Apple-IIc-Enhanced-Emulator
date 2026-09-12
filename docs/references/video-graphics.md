# Video & Graphics Subsystem Reference

This document details the video generation, memory interleaving, and CRT phosphor rendering pipeline implemented in [`src/emulator/video/Apple2cVideo.ts`](file:///h:/My%20Drive/Repos/Apple-II-Emulator/src/emulator/video/Apple2cVideo.ts).

---

## 1. Video Framebuffer & Output Dimensions

* **Internal Canvas Dimensions**: 560 × 384 pixels.
* **Scanline Scaling**: Each of the 192 Apple II vertical scanlines is rendered 2× high to preserve the 4:3 CRT aspect ratio with scanline filter spacing.
* **Refresh Rate**: 60 Hz synchronized via `requestAnimationFrame`.

---

## 2. Supported Display Modes

The active display mode is derived from the softswitches `TEXT`, `MIXED`, `HIRES`, `col80`, and `dhires`:

| Video Mode | Resolution | Colors | Memory Range & Banking |
| :--- | :--- | :--- | :--- |
| **Text 40** | 40 × 24 chars | 1 (Monochrome) | Main `$0400-$07FF` (Page 1) / `$0800-$0BFF` (Page 2) |
| **Text 80** | 80 × 24 chars | 1 (Monochrome) | Main + Aux interleaved `$0400-$07FF` (Even cols Aux, Odd cols Main) |
| **Lo-Res (LGR)** | 40 × 48 blocks | 16 Colors | Main `$0400-$07FF` (Upper nibble = top block, Lower nibble = bottom block) |
| **Double Lo-Res** | 80 × 48 blocks | 16 Colors | Main + Aux interleaved `$0400-$07FF` |
| **Hi-Res (HGR)** | 280 × 192 pixels | 6 Colors | Main `$2000-$3FFF` (Page 1) / `$4000-$5FFF` (Page 2) |
| **Double Hi-Res** | 560 × 192 mono / 140 × 192 color | 16 Colors | Interleaved Aux `$2000-$3FFF` + Main `$2000-$3FFF` (16KB total) |

### Mixed Mode
When `MIXED` (`$C053`) is active in LGR, HGR, or DHGR modes, the top 160 scanlines display graphics, while the bottom 32 scanlines display the bottom 4 rows of text (rows 20–23).

---

## 3. Video Memory Interleaving & "Screen Holes"

Apple II video memory is non-contiguous to optimize vintage 6845/discrete TTL raster counters.

### Text & Lo-Res Row Address Formula
Row base addresses for row $y \in [0, 23]$:
$$\text{Base}(y) = \$0400 + ((y \bmod 8) \times \$0080) + (\lfloor y / 8 \rfloor \times \$0028)$$

Unused 8-byte intervals between lines ($\$0478-\$047F$, $\$04F8-\$04FF$, etc.) are **"Screen Holes"**, traditionally used by peripheral cards and the Apple //c firmware as scratchpads without corrupting the display.

### Hi-Res Line Address Formula
Scanline base addresses for line $y \in [0, 191]$:
$$\text{Base}(y) = \$2000 + ((y \bmod 8) \times \$0400) + ((\lfloor y / 8 \rfloor \bmod 8) \times \$0080) + (\lfloor y / 64 \rfloor \times \$0028)$$

---

## 4. Double Hi-Res (DHGR) Interleaving

DHGR achieves 560 horizontal resolution by rapidly multiplexing Aux RAM and Main RAM:
* **Aux RAM bytes**: Render horizontal dots 0–6, 14–20, 28–34, etc. (even column bytes).
* **Main RAM bytes**: Render horizontal dots 7–13, 21–27, 35–41, etc. (odd column bytes).
* Each byte provides 7 visible pixel bits (bits 0–6). Bit 7 is unused or used for palette shift.
* Total horizontal pixel count: $40 \text{ bytes} \times 2 \text{ (Aux/Main)} \times 7 \text{ dots} = 560 \text{ dots}$.

---

## 5. NTSC Phase & CRT Phosphor Shader Pipeline

The software renderer (`PhosphorFilter.ts`) applies post-processing filters to the offscreen canvas `ImageData`:

1. **Composite NTSC Color Artifacting**: Translates 4-bit pixel patterns into composite NTSC color phase frequencies (producing the classic 16 Apple II colors).
2. **Monochrome Phosphor Palettes**:
   * **P1 Green**: Peak 525nm phosphor curve (Apple Monitor //c).
   * **P3 Amber**: Peak 605nm warm amber phosphor.
   * **P4 White**: Paper-white monochrome phosphor.
   * **Color NTSC**: Full saturated 16-color composite palette.
3. **CRT Raster Artifacts**:
   * **Scanline dimming**: Alternating horizontal scanline intensity.
   * **Glass curvature**: Subtle radial distortion simulating curved CRT tube faceplates.

---

## 6. Related Files

* Video Coordinator: [`src/emulator/video/Apple2cVideo.ts`](file:///h:/My%20Drive/Repos/Apple-II-Emulator/src/emulator/video/Apple2cVideo.ts)
* Text Renderer: [`src/emulator/video/renderers/TextRenderer.ts`](file:///h:/My%20Drive/Repos/Apple-II-Emulator/src/emulator/video/renderers/TextRenderer.ts)
* DHGR Renderer: [`src/emulator/video/renderers/DoubleHiResRenderer.ts`](file:///h:/My%20Drive/Repos/Apple-II-Emulator/src/emulator/video/renderers/DoubleHiResRenderer.ts)
* Phosphor & CRT Shaders: [`src/emulator/video/renderers/PhosphorFilter.ts`](file:///h:/My%20Drive/Repos/Apple-II-Emulator/src/emulator/video/renderers/PhosphorFilter.ts)

