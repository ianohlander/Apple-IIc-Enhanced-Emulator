import { SoftswitchesState } from '../../../types/emulator';

export class ProgramRamBank {
  public main: Uint8Array = new Uint8Array(65536);
  public aux: Uint8Array = new Uint8Array(65536);
  public extendedBanks: Uint8Array[] = [];
  public currentAuxBank: number = 0;

  constructor() {
    for (let i = 0; i < 16; i++) {
      this.extendedBanks.push(new Uint8Array(65536));
    }
  }

  public getActiveAux(): Uint8Array {
    if (this.currentAuxBank === 0 || this.extendedBanks.length === 0) {
      return this.aux;
    }
    return this.extendedBanks[this.currentAuxBank % this.extendedBanks.length];
  }

  public read(address: number, sw: SoftswitchesState): number {
    if (sw.store80 && this.isVideoPage(address, sw.hires)) {
      return sw.page2 ? this.getActiveAux()[address] : this.main[address];
    }
    return sw.ramrd ? this.getActiveAux()[address] : this.main[address];
  }

  public write(address: number, value: number, sw: SoftswitchesState): void {
    if (sw.store80 && this.isVideoPage(address, sw.hires)) {
      if (sw.page2) this.getActiveAux()[address] = value;
      else this.main[address] = value;
      return;
    }
    if (sw.ramwrt) this.getActiveAux()[address] = value;
    else this.main[address] = value;
  }

  private isVideoPage(address: number, hires: boolean): boolean {
    const isTextPage = address >= 0x0400 && address <= 0x07ff;
    const isHgrPage = hires && address >= 0x2000 && address <= 0x3fff;
    return isTextPage || isHgrPage;
  }

  public reset(): void {
    this.main.fill(0);
    this.aux.fill(0);
    this.currentAuxBank = 0;
  }
}
