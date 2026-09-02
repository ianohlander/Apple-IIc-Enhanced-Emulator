import { SoftswitchesState } from '../../types/emulator';
import { SlinkyExpansionBank } from './banks/SlinkyExpansionBank';
import { DiskIIController } from '../storage/diskII';
import { SmartPortController } from '../storage/smartport';
import { MockingboardController } from '../audio';
import { UthernetController } from '../network/uthernet';

export class IoSoftswitchRouter {
  public slinky: SlinkyExpansionBank;
  public diskController: DiskIIController;
  public smartPort: SmartPortController;
  public mockingboard: MockingboardController;
  public uthernet: UthernetController;

  public lastKeyPressed: number = 0;
  public keyStrobe: boolean = false;
  public openAppleKey: boolean = false;
  public closedAppleKey: boolean = false;
  public mouseX: number = 140; // Screen Center
  public mouseY: number = 96;
  public mouseButton0: boolean = false; // Left Button / Open Apple
  public mouseButton1: boolean = false; // Right Button / Solid Apple
  public mouseButton2: boolean = false; // Middle Button
  private paddleTimerTriggerTime: number = 0;
  public onSpeakerToggle?: () => void;

  constructor(
    slinky: SlinkyExpansionBank,
    diskController: DiskIIController,
    smartPort: SmartPortController,
    mockingboard: MockingboardController,
    uthernet: UthernetController
  ) {
    this.slinky = slinky;
    this.diskController = diskController;
    this.smartPort = smartPort;
    this.mockingboard = mockingboard;
    this.uthernet = uthernet;
  }

  public read(addr: number, sw: SoftswitchesState): number {
    const direct = this.getDirectRead(addr);
    if (direct !== null) return direct;

    const mmuStatus = this.readMmuStatus(addr, sw);
    if (mmuStatus !== null) return mmuStatus;

    if (addr >= 0xc050 && addr <= 0xc05f) { this.handleDisplaySwitch(addr, sw); return 0; }
    if (addr >= 0xc080 && addr <= 0xc08f) { this.handleLanguageCardSwitch(addr, sw); return 0; }

    return this.readSlotDevice(addr);
  }

  private getDirectRead(addr: number): number | null {
    const map: Record<number, () => number> = {
      0xc000: () => this.lastKeyPressed,
      0xc010: () => this.readStrobe(),
      0xc030: () => this.readSpeaker(),
      0xc061: () => this.readButton0(),
      0xc062: () => this.readButton1(),
      0xc063: () => (this.mouseButton2 ? 0x80 : 0x00),
      0xc064: () => this.readPaddle(this.mouseX),
      0xc065: () => this.readPaddle(this.mouseY),
      0xc070: () => { this.paddleTimerTriggerTime = performance.now(); return 0; },
      0xc071: () => this.slinky.readData()
    };
    const fn = map[addr];
    return fn ? fn() : null;
  }

  private readStrobe(): number {
    this.lastKeyPressed &= 0x7f;
    this.keyStrobe = false;
    return this.lastKeyPressed;
  }

  private readSpeaker(): number {
    if (this.onSpeakerToggle) this.onSpeakerToggle();
    return 0;
  }

  private readButton0(): number {
    return (this.openAppleKey || this.mouseButton0) ? 0x80 : 0x00;
  }

  private readButton1(): number {
    return (this.closedAppleKey || this.mouseButton1) ? 0x80 : 0x00;
  }

  private readPaddle(pos: number): number {
    const elapsedUs = (performance.now() - this.paddleTimerTriggerTime) * 1000;
    const targetUs = Math.min(2800, (pos / 255) * 2800);
    return elapsedUs < targetUs ? 0x80 : 0x00;
  }

  private readSlotDevice(addr: number): number {
    const slotNibble = (addr >> 4) & 0x0f;
    const offset = addr & 0x0f;
    const slotMap: Record<number, (off: number) => number> = {
      0x0b: (off) => this.uthernet.read(off),
      0x0c: (off) => this.mockingboard.read(off),
      0x0e: (off) => this.diskController.read(off),
      0x0f: (off) => this.smartPort.read(off)
    };
    const reader = slotMap[slotNibble];
    return reader ? reader(offset) : 0;
  }

  public write(addr: number, val: number, sw: SoftswitchesState): void {
    if (this.handleDirectWrite(addr, val)) return;
    if (this.writeMmuSwitch(addr, sw)) return;
    if (addr >= 0xc050 && addr <= 0xc05f) { this.handleDisplaySwitch(addr, sw); return; }
    if (addr >= 0xc080 && addr <= 0xc08f) { this.handleLanguageCardSwitch(addr, sw); return; }
    this.writeSlotDevice(addr, val);
  }

  private handleDirectWrite(addr: number, val: number): boolean {
    const map: Record<number, () => void> = {
      0xc010: () => { this.lastKeyPressed &= 0x7f; this.keyStrobe = false; },
      0xc030: () => { if (this.onSpeakerToggle) this.onSpeakerToggle(); },
      0xc071: () => this.slinky.writeData(val),
      0xc073: () => this.slinky.setAddressLow(val),
      0xc074: () => this.slinky.setAddressMid(val),
      0xc075: () => this.slinky.setAddressHigh(val)
    };
    const action = map[addr];
    if (action) { action(); return true; }
    return false;
  }

  private writeSlotDevice(addr: number, val: number): void {
    const slotNibble = (addr >> 4) & 0x0f;
    const offset = addr & 0x0f;
    const slotMap: Record<number, (off: number, v: number) => void> = {
      0x0b: (off, v) => this.uthernet.write(off, v),
      0x0c: (off, v) => this.mockingboard.write(off, v),
      0x0e: (off, v) => this.diskController.write(off, v),
      0x0f: (off, v) => this.smartPort.write(off, v)
    };
    const writer = slotMap[slotNibble];
    if (writer) writer(offset, val);
  }

  private readMmuStatus(addr: number, sw: SoftswitchesState): number | null {
    const statusMap: Record<number, boolean> = {
      0xc011: sw.lcBank2,
      0xc012: sw.lcReadRam,
      0xc013: sw.ramrd,
      0xc014: sw.ramwrt,
      0xc016: sw.altzp,
      0xc018: sw.store80,
      0xc01a: sw.text,
      0xc01b: sw.mixed,
      0xc01c: sw.page2,
      0xc01d: sw.hires,
      0xc01f: sw.col80,
    };
    const val = statusMap[addr];
    return val !== undefined ? (val ? 0x80 : 0x00) : null;
  }

  private writeMmuSwitch(addr: number, sw: SoftswitchesState): boolean {
    const map: Record<number, () => void> = {
      0xc000: () => { sw.store80 = false; },
      0xc001: () => { sw.store80 = true; },
      0xc002: () => { sw.ramrd = false; },
      0xc003: () => { sw.ramrd = true; },
      0xc004: () => { sw.ramwrt = false; },
      0xc005: () => { sw.ramwrt = true; },
      0xc008: () => { sw.altzp = false; },
      0xc009: () => { sw.altzp = true; },
      0xc00c: () => { sw.col80 = false; },
      0xc00d: () => { sw.col80 = true; },
    };
    const action = map[addr];
    if (action) { action(); return true; }
    return false;
  }

  private handleDisplaySwitch(addr: number, sw: SoftswitchesState): void {
    const map: Record<number, () => void> = {
      0xc050: () => { sw.text = false; },
      0xc051: () => { sw.text = true; },
      0xc052: () => { sw.mixed = false; },
      0xc053: () => { sw.mixed = true; },
      0xc054: () => { sw.page2 = false; },
      0xc055: () => { sw.page2 = true; },
      0xc056: () => { sw.hires = false; },
      0xc057: () => { sw.hires = true; },
      0xc05e: () => { sw.dhires = false; },
      0xc05f: () => { sw.dhires = true; },
    };
    const action = map[addr];
    if (action) action();
  }

  private handleLanguageCardSwitch(addr: number, sw: SoftswitchesState): void {
    sw.lcBank2 = (addr & 0x08) !== 0;
    sw.lcReadRam = (addr & 0x02) === 0 && (addr & 0x01) !== 0;
    const writeEnable = (addr & 0x01) !== 0;

    if (writeEnable) {
      if (sw.lcPreWrite) sw.lcWriteRam = true;
      sw.lcPreWrite = true;
    } else {
      sw.lcWriteRam = false;
      sw.lcPreWrite = false;
    }
  }
}
