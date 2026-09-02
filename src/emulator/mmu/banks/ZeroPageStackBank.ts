export class ZeroPageStackBank {
  public main: Uint8Array = new Uint8Array(512);
  public aux: Uint8Array = new Uint8Array(512);

  public read(address: number, altzp: boolean): number {
    const ram = altzp ? this.aux : this.main;
    return ram[address & 0x1ff];
  }

  public write(address: number, value: number, altzp: boolean): void {
    const ram = altzp ? this.aux : this.main;
    ram[address & 0x1ff] = value & 0xff;
  }

  public reset(): void {
    this.main.fill(0);
    this.aux.fill(0);
  }
}
