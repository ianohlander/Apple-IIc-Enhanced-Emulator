import { IVideoRenderer } from './IVideoRenderer';
import { Apple2cMMU } from '../../mmu/Apple2cMMU';
import { TextRenderer } from './TextRenderer';

export class DoubleHiResRenderer implements IVideoRenderer {
  public static readonly PALETTE: number[][] = [
    [0x00, 0x00, 0x00], [0x90, 0x17, 0x40], [0x40, 0x2C, 0xA5], [0xD0, 0x43, 0xE5],
    [0x00, 0x69, 0x40], [0x80, 0x80, 0x80], [0x2F, 0x95, 0xE5], [0xBF, 0xAB, 0xFF],
    [0x40, 0x54, 0x00], [0xD0, 0x6A, 0x1A], [0x80, 0x80, 0x80], [0xFF, 0x96, 0xBF],
    [0x2F, 0xBC, 0x1A], [0xBF, 0xD3, 0x5A], [0x6F, 0xE8, 0xBF], [0xFF, 0xFF, 0xFF]
  ];

  public static getHgrRowAddress(y: number): number {
    const box = Math.floor(y / 64);
    const row = Math.floor((y % 64) / 8);
    const sub = y % 8;
    return 0x2000 + (sub * 0x400) + (row * 0x80) + (box * 0x28);
  }

  public render(data: Uint8ClampedArray, mmu: Apple2cMMU, charRom: Uint8Array, flash: boolean): void {
    const isMixed = mmu.sw.mixed;
    const maxY = isMixed ? 160 : 192;
    const pageOffset = (!mmu.sw.store80 && mmu.sw.page2) ? 0x2000 : 0x0000;

    for (let y = 0; y < maxY; y++) {
      this.renderScanline(data, mmu, y, pageOffset);
    }

    if (isMixed) {
      this.renderMixedText(data, mmu, charRom, flash);
    }
  }

  private renderScanline(data: Uint8ClampedArray, mmu: Apple2cMMU, y: number, pageOffset: number): void {
    const lineAddr = DoubleHiResRenderer.getHgrRowAddress(y) + pageOffset;
    const bits = new Uint8Array(560);
    let ptr = 0;

    for (let col = 0; col < 40; col++) {
      const bAux = mmu.auxRAM[lineAddr + col] & 0x7f;
      for (let b = 0; b < 7; b++) bits[ptr++] = (bAux >> b) & 1;
      const bMain = mmu.mainRAM[lineAddr + col] & 0x7f;
      for (let b = 0; b < 7; b++) bits[ptr++] = (bMain >> b) & 1;
    }

    for (let x = 0; x < 560; x += 4) {
      const colorVal = (bits[x] | (bits[x + 1] << 1) | (bits[x + 2] << 2) | (bits[x + 3] << 3));
      const color = DoubleHiResRenderer.PALETTE[colorVal];
      this.drawPixelBlock(data, x, y * 2, color);
    }
  }

  private drawPixelBlock(data: Uint8ClampedArray, x: number, y2: number, color: number[]): void {
    for (let dx = 0; dx < 4; dx++) {
      const px = x + dx;
      const idx1 = (y2 * 560 + px) * 4;
      const idx2 = ((y2 + 1) * 560 + px) * 4;

      data[idx1] = color[0]; data[idx1 + 1] = color[1]; data[idx1 + 2] = color[2]; data[idx1 + 3] = 255;
      data[idx2] = color[0]; data[idx2 + 1] = color[1]; data[idx2 + 2] = color[2]; data[idx2 + 3] = 255;
    }
  }

  private renderMixedText(data: Uint8ClampedArray, mmu: Apple2cMMU, charRom: Uint8Array, flash: boolean): void {
    const textRenderer = new TextRenderer();
    for (let row = 20; row < 24; row++) {
      const base = TextRenderer.getTextRowAddress(row);
      for (let col = 0; col < 40; col++) {
        textRenderer.drawChar(data, mmu.auxRAM[base + col], (col * 2) * 7, row * 16, 1, charRom, flash);
        textRenderer.drawChar(data, mmu.mainRAM[base + col], (col * 2 + 1) * 7, row * 16, 1, charRom, flash);
      }
    }
  }
}
