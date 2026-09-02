export class AY38910PSG {
  public registers: Uint8Array = new Uint8Array(16);
  public selectedRegister: number = 0;

  private tonePeriod: number[] = [0, 0, 0];
  private toneCounter: number[] = [0, 0, 0];
  private toneOutput: number[] = [1, 1, 1];

  private noisePeriod: number = 0;
  private noiseCounter: number = 0;
  private noiseLFSR: number = 1;
  private noiseOutput: number = 1;

  private envPeriod: number = 0;
  private envCounter: number = 0;
  private envVolume: number = 0;

  public reset(): void {
    this.registers.fill(0);
    this.selectedRegister = 0;
    this.tonePeriod = [0, 0, 0];
    this.toneCounter = [0, 0, 0];
    this.toneOutput = [1, 1, 1];
    this.noiseLFSR = 1;
    this.noiseOutput = 1;
    this.envVolume = 0;
  }

  public writeRegister(reg: number, val: number): void {
    reg &= 0x0f;
    val &= 0xff;
    this.registers[reg] = val;

    if (reg <= 5) {
      this.updateTonePeriod(reg);
    } else {
      this.dispatchAuxRegister(reg, val);
    }
  }

  private dispatchAuxRegister(reg: number, val: number): void {
    const map: Record<number, () => void> = {
      6: () => { this.noisePeriod = (val & 0x1f) || 1; },
      11: () => { this.updateEnvPeriod(); },
      12: () => { this.updateEnvPeriod(); },
      13: () => { this.triggerEnvelope(val); }
    };
    const fn = map[reg];
    if (fn) fn();
  }

  private updateTonePeriod(reg: number): void {
    const ch = Math.floor(reg / 2);
    const low = this.registers[ch * 2];
    const high = this.registers[ch * 2 + 1] & 0x0f;
    this.tonePeriod[ch] = (low | (high << 8)) || 1;
  }

  private updateEnvPeriod(): void {
    this.envPeriod = (this.registers[11] | (this.registers[12] << 8)) || 1;
  }

  private triggerEnvelope(val: number): void {
    this.envCounter = 0;
    const isAttack = (val & 0x04) !== 0;
    this.envVolume = isAttack ? 0 : 15;
  }

  public sample(): number {
    this.clockToneOscillators();
    this.clockNoiseGenerator();
    return this.mixAudioChannels();
  }

  private clockToneOscillators(): void {
    for (let ch = 0; ch < 3; ch++) {
      this.toneCounter[ch]++;
      if (this.toneCounter[ch] >= this.tonePeriod[ch]) {
        this.toneCounter[ch] = 0;
        this.toneOutput[ch] = this.toneOutput[ch] === 1 ? -1 : 1;
      }
    }
  }

  private clockNoiseGenerator(): void {
    this.noiseCounter++;
    if (this.noiseCounter >= this.noisePeriod) {
      this.noiseCounter = 0;
      const bit = ((this.noiseLFSR >> 0) ^ (this.noiseLFSR >> 3)) & 1;
      this.noiseLFSR = (this.noiseLFSR >> 1) | (bit << 16);
      this.noiseOutput = (this.noiseLFSR & 1) ? 1 : 0;
    }
  }

  private mixAudioChannels(): number {
    const mixer = this.registers[7];
    let totalOutput = 0;

    for (let ch = 0; ch < 3; ch++) {
      const toneDisabled = (mixer & (1 << ch)) !== 0;
      const noiseDisabled = (mixer & (1 << (ch + 3))) !== 0;
      const tone = toneDisabled ? 1 : (this.toneOutput[ch] > 0 ? 1 : 0);
      const noise = noiseDisabled ? 1 : this.noiseOutput;

      if (tone & noise) {
        totalOutput += this.getChannelVolume(ch) * 0.33;
      }
    }
    return totalOutput;
  }

  private getChannelVolume(ch: number): number {
    const volReg = this.registers[8 + ch];
    const isEnv = (volReg & 0x10) !== 0;
    const vol = isEnv ? this.envVolume : (volReg & 0x0f);
    return vol / 15.0;
  }
}

export class MockingboardController {
  public psg1: AY38910PSG = new AY38910PSG();
  public psg2: AY38910PSG = new AY38910PSG();
  public via1Regs: Uint8Array = new Uint8Array(16);

  public read(offset: number): number {
    return this.via1Regs[offset & 0x0f];
  }

  public write(offset: number, value: number): void {
    offset &= 0x0f;
    value &= 0xff;
    this.via1Regs[offset] = value;

    if (offset === 0) {
      const bdir = (value & 0x04) !== 0;
      const bc1 = (value & 0x02) !== 0;
      const data = this.via1Regs[1];

      if (bdir && bc1) this.psg1.selectedRegister = data & 0x0f;
      else if (bdir && !bc1) this.psg1.writeRegister(this.psg1.selectedRegister, data);
    }
  }

  public sample(): number {
    return (this.psg1.sample() + this.psg2.sample()) * 0.5;
  }
}

export class Apple2cAudio {
  public audioCtx: AudioContext | null = null;
  public scriptNode: ScriptProcessorNode | null = null;
  public isMuted: boolean = false;
  public masterVolume: number = 0.8;
  public speakerState: number = 0;
  public mockingboard: MockingboardController;
  public dacSample: number = 0;

  constructor(mockingboard: MockingboardController) {
    this.mockingboard = mockingboard;
  }

  public init(): void {
    if (typeof window === 'undefined' || this.audioCtx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtx({ sampleRate: 44100 });
      this.setupScriptProcessor();
    } catch (e) {
      console.warn('Audio init deferred', e);
    }
  }

  private setupScriptProcessor(): void {
    if (!this.audioCtx) return;
    this.scriptNode = this.audioCtx.createScriptProcessor(1024, 0, 2);
    this.scriptNode.onaudioprocess = (e) => {
      const outLeft = e.outputBuffer.getChannelData(0);
      const outRight = e.outputBuffer.getChannelData(1);

      for (let i = 0; i < outLeft.length; i++) {
        const sample = this.renderAudioSample();
        outLeft[i] = sample;
        outRight[i] = sample;
      }
    };
    this.scriptNode.connect(this.audioCtx.destination);
  }

  private renderAudioSample(): number {
    if (this.isMuted) return 0;
    const speaker = this.speakerState * 0.35;
    const mbSample = this.mockingboard.sample() * 0.5;
    const dac = (this.dacSample - 128) / 128.0 * 0.25;
    return (speaker + mbSample + dac) * this.masterVolume;
  }

  public toggleSpeaker(): void {
    this.speakerState = this.speakerState === 1 ? -1 : 1;
  }

  public setVolume(vol: number): void {
    this.masterVolume = Math.max(0, Math.min(1, vol));
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }
}
