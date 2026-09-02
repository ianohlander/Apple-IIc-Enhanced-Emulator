import { ClockSpeed, DisplayPhosphor, VideoMode } from '../types/emulator';
import { CPU65C02 } from './cpu65C02';
import { Apple2cMMU } from './mmu';
import { Apple2cVideo } from './video';
import { Apple2cAudio, MockingboardController } from './audio';
import { DiskIIController, FloppyDisk } from './storage/diskII';
import { SmartPortController, SmartPortHardDrive } from './storage/smartport';
import { FloppyAudioEffects } from './storage/diskSounds';
import { generateDefaultApple2cRom } from './roms/defaultRoms';
import { UthernetController } from './network/uthernet';

export class Apple2cUltra {
  public cpu: CPU65C02;
  public mmu: Apple2cMMU;
  public video: Apple2cVideo;
  public audio: Apple2cAudio;
  public diskController: DiskIIController;
  public smartPort: SmartPortController;
  public uthernet: UthernetController;
  public diskSounds: FloppyAudioEffects;

  public clockSpeed: number = ClockSpeed.SPEED_1MHZ;
  public isRunning: boolean = false;
  public isPaused: boolean = false;
  public breakpoints: Set<number> = new Set();

  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;

  constructor() {
    this.diskController = new DiskIIController();
    this.smartPort = new SmartPortController();
    const mockingboard = new MockingboardController();
    this.audio = new Apple2cAudio(mockingboard);
    this.uthernet = new UthernetController();
    this.diskSounds = new FloppyAudioEffects();

    // Sound effect hook for drive head step
    this.diskController.onStepSound = (track) => {
      this.diskSounds.playStepSound(track);
    };

    this.mmu = new Apple2cMMU(
      this.diskController,
      this.smartPort,
      mockingboard,
      this.uthernet
    );

    // Audio click hook for speaker toggle ($C030)
    this.mmu.onSpeakerToggle = () => {
      this.audio.toggleSpeaker();
    };

    // Load default Apple IIc system ROM
    const defaultRom = generateDefaultApple2cRom();
    this.mmu.rom.set(defaultRom);

    this.video = new Apple2cVideo(this.mmu);
    this.cpu = new CPU65C02(this.mmu);
  }

  public powerOn(): void {
    this.audio.init();
    this.reset(true);
    this.isRunning = true;
    this.isPaused = false;
    this.lastFrameTime = performance.now();
    this.loop();
  }

  public powerOff(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public reset(cold: boolean = false): void {
    if (cold) {
      this.mmu.reset();
      this.mmu.mainRAM.fill(0);
      this.mmu.auxRAM.fill(0);
    }
    this.cpu.reset();
  }

  public setSpeed(speed: ClockSpeed | number): void {
    this.clockSpeed = speed;
  }

  public togglePause(): boolean {
    this.isPaused = !this.isPaused;
    if (!this.isPaused && this.isRunning) {
      this.lastFrameTime = performance.now();
      this.loop();
    }
    return this.isPaused;
  }

  public addBreakpoint(addr: number): void {
    this.breakpoints.add(addr & 0xffff);
  }

  public removeBreakpoint(addr: number): void {
    this.breakpoints.delete(addr & 0xffff);
  }

  public toggleBreakpoint(addr: number): boolean {
    addr &= 0xffff;
    if (this.breakpoints.has(addr)) {
      this.breakpoints.delete(addr);
      return false;
    } else {
      this.breakpoints.add(addr);
      return true;
    }
  }

  public stepInstruction(): number {
    const cycles = this.cpu.step();
    return cycles;
  }

  public injectBinary(address: number, data: Uint8Array, autoExecute: boolean = true): void {
    address &= 0xffff;
    for (let i = 0; i < data.length; i++) {
      this.mmu.write(address + i, data[i]);
    }
    if (autoExecute) {
      this.cpu.pc = address;
    }
  }

  public loadCustomRom(romData: Uint8Array): void {
    this.mmu.rom.fill(0xea);
    this.mmu.rom.set(romData.slice(0, 32768));
    this.reset(true);
  }

  private loop = (): void => {
    if (!this.isRunning || this.isPaused) return;

    const now = performance.now();
    const elapsedSec = Math.min(0.05, (now - this.lastFrameTime) / 1000.0);
    this.lastFrameTime = now;

    // Calculate cycle budget based on current MHz speed (1.023 MHz standard = ~17,050 cycles per 60Hz frame)
    const targetCycles = Math.floor(this.clockSpeed * 1000000 * elapsedSec);
    let cyclesRun = 0;

    while (cyclesRun < targetCycles) {
      // Check breakpoint
      if (this.breakpoints.has(this.cpu.pc)) {
        this.isPaused = true;
        break;
      }

      const c = this.cpu.step();
      cyclesRun += c;
    }

    // Render video frame
    this.video.renderFrame();

    // Motor sound feedback
    this.diskSounds.setMotorHum(this.diskController.motorOn);

    this.animationFrameId = requestAnimationFrame(this.loop);
  };
}
