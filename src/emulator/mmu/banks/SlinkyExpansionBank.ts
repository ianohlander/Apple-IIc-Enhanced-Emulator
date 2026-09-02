export class SlinkyExpansionBank {
  public memory: Uint8Array = new Uint8Array(1024 * 1024 * 4); // 4MB Slinky RAM
  public address: number = 0;

  public readData(): number {
    const val = this.memory[this.address % this.memory.length];
    this.address = (this.address + 1) & 0xffffff;
    return val;
  }

  public writeData(val: number): void {
    this.memory[this.address % this.memory.length] = val & 0xff;
    this.address = (this.address + 1) & 0xffffff;
  }

  public setAddressLow(val: number): void {
    this.address = (this.address & 0xffff00) | (val & 0xff);
  }

  public setAddressMid(val: number): void {
    this.address = (this.address & 0xff00ff) | ((val & 0xff) << 8);
  }

  public setAddressHigh(val: number): void {
    this.address = (this.address & 0x00ffff) | ((val & 0xff) << 16);
  }

  public reset(): void {
    this.address = 0;
  }
}
