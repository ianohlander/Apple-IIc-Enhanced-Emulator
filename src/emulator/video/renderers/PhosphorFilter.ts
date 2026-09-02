import { DisplayPhosphor } from '../../../types/emulator';

export class PhosphorFilter {
  public static readonly P1_GREEN = [0x33, 0xFF, 0x44];
  public static readonly P3_AMBER = [0xFF, 0xB0, 0x00];
  public static readonly P4_WHITE = [0xF0, 0xF4, 0xF8];

  public static apply(data: Uint8ClampedArray, phosphor: DisplayPhosphor, scanlines: boolean): void {
    const tint = PhosphorFilter.getPhosphorTint(phosphor);
    if (tint) {
      PhosphorFilter.applyMonoTint(data, tint);
    }
    if (scanlines) {
      PhosphorFilter.applyScanlines(data);
    }
  }

  private static getPhosphorTint(phosphor: DisplayPhosphor): number[] | null {
    if (phosphor === DisplayPhosphor.GREEN) return PhosphorFilter.P1_GREEN;
    if (phosphor === DisplayPhosphor.AMBER) return PhosphorFilter.P3_AMBER;
    if (phosphor === DisplayPhosphor.WHITE) return PhosphorFilter.P4_WHITE;
    return null;
  }

  private static applyMonoTint(data: Uint8ClampedArray, tint: number[]): void {
    const totalPixels = 560 * 384;
    for (let i = 0; i < totalPixels; i++) {
      const idx = i * 4;
      const luma = (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114) / 255.0;
      data[idx] = Math.min(255, Math.floor(luma * tint[0]));
      data[idx + 1] = Math.min(255, Math.floor(luma * tint[1]));
      data[idx + 2] = Math.min(255, Math.floor(luma * tint[2]));
    }
  }

  private static applyScanlines(data: Uint8ClampedArray): void {
    for (let y = 1; y < 384; y += 2) {
      const rowOffset = y * 560 * 4;
      for (let x = 0; x < 560; x++) {
        const idx = rowOffset + x * 4;
        data[idx] = Math.floor(data[idx] * 0.72);
        data[idx + 1] = Math.floor(data[idx + 1] * 0.72);
        data[idx + 2] = Math.floor(data[idx + 2] * 0.72);
      }
    }
  }
}
