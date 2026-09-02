import { Apple2cMMU } from '../../mmu/Apple2cMMU';

export interface IVideoRenderer {
  render(data: Uint8ClampedArray, mmu: Apple2cMMU, charRom: Uint8Array, flash: boolean): void;
}
