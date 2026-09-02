export class LanguageCardBank {
  public mainBank1: Uint8Array = new Uint8Array(4096);
  public mainBank2: Uint8Array = new Uint8Array(4096);
  public mainHigh: Uint8Array = new Uint8Array(8192);

  public auxBank1: Uint8Array = new Uint8Array(4096);
  public auxBank2: Uint8Array = new Uint8Array(4096);
  public auxHigh: Uint8Array = new Uint8Array(8192);

  public read(address: number, bank2: boolean, isAux: boolean): number {
    if (address < 0xe000) {
      const offset = address - 0xd000;
      if (bank2) {
        return isAux ? this.auxBank2[offset] : this.mainBank2[offset];
      }
      return isAux ? this.auxBank1[offset] : this.mainBank1[offset];
    }
    const offset = address - 0xe000;
    return isAux ? this.auxHigh[offset] : this.mainHigh[offset];
  }

  public write(address: number, value: number, bank2: boolean, isAux: boolean): void {
    if (address < 0xe000) {
      const offset = address - 0xd000;
      if (bank2) {
        if (isAux) this.auxBank2[offset] = value; else this.mainBank2[offset] = value;
      } else {
        if (isAux) this.auxBank1[offset] = value; else this.mainBank1[offset] = value;
      }
      return;
    }
    const offset = address - 0xe000;
    if (isAux) this.auxHigh[offset] = value; else this.mainHigh[offset] = value;
  }
}
