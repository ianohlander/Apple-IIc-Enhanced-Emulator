import { RomPackage } from '../../types/emulator';
import { generateDefaultApple2cRom } from './defaultRoms';

export interface RomBuilderOptions {
  name: string;
  version: string;
  bundleProDOS: boolean;
  bundleDOS33: boolean;
  bundleBasicSystem: boolean;
  bundleDiagnostics: boolean;
  autoBootDisk: boolean;
  customBannerText: string;
}

export class CustomRomBuilder {
  public static buildRom(options: RomBuilderOptions): RomPackage {
    const rom = generateDefaultApple2cRom();

    if (options.customBannerText) {
      CustomRomBuilder.patchBanner(rom, options.customBannerText);
    }
    if (options.autoBootDisk) {
      CustomRomBuilder.patchAutoBoot(rom);
    }

    const id = `custom-rom-${Date.now()}`;
    return {
      id,
      name: options.name || 'Custom Apple IIc Ultra ROM',
      description: `Enhanced ROM with ProDOS & Utilities`,
      version: options.version || '1.0',
      sizeBytes: 32768,
      hasProDOS: options.bundleProDOS,
      hasDOS33: options.bundleDOS33,
      hasAutoBoot: options.autoBootDisk,
      data: rom
    };
  }

  private static patchBanner(rom: Uint8Array, text: string): void {
    const banner = `\r   *** ${text.toUpperCase()} ***\r\r] `;
    const bannerCode: number[] = [0xa2, 0x00];
    for (let i = 0; i < banner.length; i++) {
      const ch = banner.charCodeAt(i) | 0x80;
      bannerCode.push(0xa9, ch, 0x20, 0xed, 0xfd);
    }
    bannerCode.push(0x60);
    rom.set(bannerCode.slice(0, 256), 0x3a10);
  }

  private static patchAutoBoot(rom: Uint8Array): void {
    const bootCode = [
      0xd8, 0xa2, 0xff, 0x9a,
      0x20, 0x58, 0xfc,
      0x20, 0x10, 0xfa,
      0x4c, 0x00, 0xc6
    ];
    rom.set(bootCode, 0x3800);
  }

  public static exportAsBin(romPackage: RomPackage): Blob {
    return new Blob([romPackage.data], { type: 'application/octet-stream' });
  }
}
