export class UthernetController {
  public isConnected: boolean = false;
  public ws: WebSocket | null = null;
  public rxQueue: Uint8Array[] = [];
  public currentRxPacket: Uint8Array | null = null;
  public rxPointer: number = 0;

  public connect(url: string = 'wss://bbs.apple2ultra.net/telnet'): void {
    if (typeof WebSocket === 'undefined') return;
    try {
      this.ws = new WebSocket(url);
      this.ws.binaryType = 'arraybuffer';
      this.ws.onopen = () => { this.isConnected = true; };
      this.ws.onmessage = (event) => { this.rxQueue.push(new Uint8Array(event.data)); };
      this.ws.onclose = () => { this.isConnected = false; };
      this.ws.onerror = () => { this.isConnected = false; };
    } catch {
      this.isConnected = false;
    }
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }

  public read(offset: number): number {
    const reg = offset & 0x0f;
    const regMap: Record<number, () => number> = {
      0x00: () => this.readRxByte(),
      0x02: () => this.readRxByte(),
      0x04: () => (this.hasRxData() ? 0x01 : 0x00),
      0x06: () => (this.isConnected ? 0x80 : 0x00)
    };
    const fn = regMap[reg];
    return fn ? fn() : 0x00;
  }

  private hasRxData(): boolean {
    return this.rxQueue.length > 0 || this.currentRxPacket !== null;
  }

  private readRxByte(): number {
    if (!this.currentRxPacket && this.rxQueue.length > 0) {
      this.currentRxPacket = this.rxQueue.shift()!;
      this.rxPointer = 0;
    }
    if (this.currentRxPacket && this.rxPointer < this.currentRxPacket.length) {
      const byte = this.currentRxPacket[this.rxPointer++];
      if (this.rxPointer >= this.currentRxPacket.length) {
        this.currentRxPacket = null;
      }
      return byte;
    }
    return 0x00;
  }

  public write(offset: number, value: number): void {
    if ((offset & 0x0f) === 0x00 && this.ws && this.isConnected) {
      this.ws.send(new Uint8Array([value & 0xff]));
    }
  }
}
