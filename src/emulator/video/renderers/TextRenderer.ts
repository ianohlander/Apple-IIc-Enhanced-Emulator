import { IVideoRenderer } from './IVideoRenderer';
import { Apple2cMMU } from '../../mmu/Apple2cMMU';

export class TextRenderer implements IVideoRenderer {
  public static getTextRowAddress(row: number): number {
    const group = Math.floor(row / 8);
    const sub = row % 8;
    return 0x0400 + (sub * 0x80) + (group * 0x28);
  }

  public render(data: Uint8ClampedArray, mmu: Apple2cMMU, charRom: Uint8Array, flash: boolean): void {
    if (mmu.sw.col80) {
      this.render80(data, mmu, charRom, flash);
    } else {
      this.render40(data, mmu, charRom, flash);
    }
  }

  public render40(data: Uint8ClampedArray, mmu: Apple2cMMU, charRom: Uint8Array, flash: boolean): void {
    const pageOffset = (!mmu.sw.store80 && mmu.sw.page2) ? 0x0400 : 0x0000;
    const ram = mmu.mainRAM;

    for (let row = 0; row < 24; row++) {
      const base = TextRenderer.getTextRowAddress(row) + pageOffset;
      for (let col = 0; col < 40; col++) {
        this.drawChar(data, ram[base + col], col * 14, row * 16, 2, charRom, flash);
      }
    }
  }

  public render80(data: Uint8ClampedArray, mmu: Apple2cMMU, charRom: Uint8Array, flash: boolean): void {
    const pageOffset = (!mmu.sw.store80 && mmu.sw.page2) ? 0x0400 : 0x0000;
    const mainRAM = mmu.mainRAM;
    const auxRAM = mmu.auxRAM;

    for (let row = 0; row < 24; row++) {
      const base = TextRenderer.getTextRowAddress(row) + pageOffset;
      for (let col = 0; col < 40; col++) {
        this.drawChar(data, auxRAM[base + col], (col * 2) * 7, row * 16, 1, charRom, flash);
        this.drawChar(data, mainRAM[base + col], (col * 2 + 1) * 7, row * 16, 1, charRom, flash);
      }
    }
  }

  public drawChar(data: Uint8ClampedArray, code: number, x: number, y: number, scaleX: number, charRom: Uint8Array, flash: boolean): void {
    const isInverse = this.checkInverse(code, flash);
    const fg = isInverse ? 0 : 255;
    const bg = isInverse ? 255 : 0;
    const glyphOffset = (code & 0x7f) * 8;

    this.drawGlyphMatrix(data, x, y, scaleX, charRom, glyphOffset, fg, bg);
  }

  private checkInverse(code: number, flash: boolean): boolean {
    if (code < 0x40) return true;
    if (code < 0x80) return flash;
    return false;
  }

  private drawGlyphMatrix(data: Uint8ClampedArray, x: number, y: number, scaleX: number, charRom: Uint8Array, offset: number, fg: number, bg: number): void {
    for (let dy = 0; dy < 8; dy++) {
      const bits = charRom[(offset + dy) % charRom.length] || 0;
      for (let dx = 0; dx < 7; dx++) {
        const bit = (bits >> dx) & 1;
        const color = bit ? fg : bg;
        this.drawScaledDot(data, x + dx * scaleX, y + dy * 2, scaleX, color);
      }
    }
  }

  private drawScaledDot(data: Uint8ClampedArray, px: number, py: number, scaleX: number, color: number): void {
    for (let sx = 0; sx < scaleX; sx++) {
      this.setPixel(data, px + sx, py, color);
      this.setPixel(data, px + sx, py + 1, color);
    }
  }

  private setPixel(data: Uint8ClampedArray, x: number, y: number, color: number): void {
    if (x < 0 || x >= 560 || y < 0 || y >= 384) return;
    const idx = (y * 560 + x) * 4;
    data[idx] = color;
    data[idx + 1] = color;
    data[idx + 2] = color;
    data[idx + 3] = 255;
  }
}
