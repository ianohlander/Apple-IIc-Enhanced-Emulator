import { SoftswitchesState, VideoMode } from '../../types/emulator';
import { ZeroPageStackBank } from './banks/ZeroPageStackBank';
import { ProgramRamBank } from './banks/ProgramRamBank';
import { LanguageCardBank } from './banks/LanguageCardBank';
import { SlinkyExpansionBank } from './banks/SlinkyExpansionBank';
import { IoSoftswitchRouter } from './IoSoftswitchRouter';
import { DiskIIController } from '../storage/diskII';
import { SmartPortController } from '../storage/smartport';
import { MockingboardController } from '../audio';
import { UthernetController } from '../network/uthernet';

export class Apple2cMMU {
  public zpStack: ZeroPageStackBank = new ZeroPageStackBank();
  public programRam: ProgramRamBank = new ProgramRamBank();
  public languageCard: LanguageCardBank = new LanguageCardBank();
  public slinky: SlinkyExpansionBank = new SlinkyExpansionBank();
  public ioRouter: IoSoftswitchRouter;
  public rom: Uint8Array = new Uint8Array(32768);

  public sw: SoftswitchesState = {
    text: true, mixed: false, page2: false, hires: false, col80: false, dhires: false, altCharset: false,
    store80: false, ramrd: false, ramwrt: false, altzp: false, slotc3rom: false, intcxrom: false,
    lcBank2: true, lcReadRam: false, lcWriteRam: false, lcPreWrite: false,
    slinkyAddress: 0, ramworksBank: 0
  };

  constructor(
    diskController: DiskIIController,
    smartPort: SmartPortController,
    mockingboard: MockingboardController,
    uthernet: UthernetController
  ) {
    this.ioRouter = new IoSoftswitchRouter(this.slinky, diskController, smartPort, mockingboard, uthernet);
  }

  public get mainRAM(): Uint8Array { return this.programRam.main; }
  public get auxRAM(): Uint8Array { return this.programRam.aux; }
  public get extendedRAM(): Uint8Array[] { return this.programRam.extendedBanks; }
  public get slinkyRAM(): Uint8Array { return this.slinky.memory; }
  public get lcMainBank1(): Uint8Array { return this.languageCard.mainBank1; }
  public get lcMainBank2(): Uint8Array { return this.languageCard.mainBank2; }
  public get lastKeyPressed(): number { return this.ioRouter.lastKeyPressed; }
  public set lastKeyPressed(v: number) { this.ioRouter.lastKeyPressed = v; }
  public get openAppleKey(): boolean { return this.ioRouter.openAppleKey; }
  public set openAppleKey(v: boolean) { this.ioRouter.openAppleKey = v; }
  public get closedAppleKey(): boolean { return this.ioRouter.closedAppleKey; }
  public set closedAppleKey(v: boolean) { this.ioRouter.closedAppleKey = v; }
  public get onSpeakerToggle(): (() => void) | undefined { return this.ioRouter.onSpeakerToggle; }
  public set onSpeakerToggle(fn: (() => void) | undefined) { this.ioRouter.onSpeakerToggle = fn; }

  public reset(): void {
    this.zpStack.reset();
    this.programRam.reset();
    this.slinky.reset();
    this.sw.text = true;
    this.sw.hires = false;
    this.sw.page2 = false;
    this.sw.dhires = false;
    this.sw.col80 = false;
    this.sw.lcReadRam = false;
    this.sw.lcWriteRam = false;
  }

  public setKey(ascii: number): void {
    this.ioRouter.lastKeyPressed = (ascii & 0x7f) | 0x80;
    this.ioRouter.keyStrobe = true;
  }

  public setMouse(x: number, y: number, btn0: boolean, btn1: boolean = false, btn2: boolean = false): void {
    this.ioRouter.mouseX = Math.max(0, Math.min(255, Math.floor(x)));
    this.ioRouter.mouseY = Math.max(0, Math.min(255, Math.floor(y)));
    this.ioRouter.mouseButton0 = btn0;
    this.ioRouter.mouseButton1 = btn1;
    this.ioRouter.mouseButton2 = btn2;
  }

  public getVideoMode(): VideoMode {
    if (this.sw.text) {
      return this.sw.col80 ? VideoMode.TEXT_80 : VideoMode.TEXT_40;
    }
    const isDouble = this.sw.dhires && this.sw.col80;
    if (this.sw.hires) {
      return isDouble ? VideoMode.DHGR : VideoMode.HGR;
    }
    return isDouble ? VideoMode.DLGR : VideoMode.LGR;
  }

  public read(addr: number): number {
    addr &= 0xffff;
    if (addr < 0x0200) return this.zpStack.read(addr, this.sw.altzp);
    if (addr < 0xc000) return this.programRam.read(addr, this.sw);
    if (addr < 0xd000) return this.ioRouter.read(addr, this.sw);
    if (this.sw.lcReadRam) return this.languageCard.read(addr, this.sw.lcBank2, this.sw.altzp);

    const romOffset = (addr - 0xc000) & (this.rom.length - 1);
    return this.rom[romOffset];
  }

  public write(addr: number, val: number): void {
    addr &= 0xffff;
    val &= 0xff;
    if (addr < 0x0200) { this.zpStack.write(addr, val, this.sw.altzp); return; }
    if (addr < 0xc000) { this.programRam.write(addr, val, this.sw); return; }
    if (addr < 0xd000) { this.ioRouter.write(addr, val, this.sw); return; }
    if (this.sw.lcWriteRam) { this.languageCard.write(addr, val, this.sw.lcBank2, this.sw.altzp); }
  }

  public readWord(addr: number): number {
    return this.read(addr) | (this.read((addr + 1) & 0xffff) << 8);
  }

  public peek(addr: number): number {
    addr &= 0xffff;
    if (addr < 0x0200) return this.zpStack.read(addr, this.sw.altzp);
    if (addr < 0xc000) return this.programRam.read(addr, this.sw);
    if (addr < 0xd000) return 0;
    if (this.sw.lcReadRam) return this.languageCard.read(addr, this.sw.lcBank2, this.sw.altzp);
    return this.rom[(addr - 0xc000) & (this.rom.length - 1)];
  }
}
