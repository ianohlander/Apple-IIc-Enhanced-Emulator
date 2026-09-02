export class FloppyAudioEffects {
  public audioCtx: AudioContext | null = null;
  public isEnabled: boolean = true;
  private motorOsc: OscillatorNode | null = null;
  private motorGain: GainNode | null = null;

  private ensureAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioCtx = new AudioContextClass();
      } catch {
        return null;
      }
    }
    return this.audioCtx;
  }

  public playStepSound(track: number): void {
    if (!this.isEnabled) return;
    const ctx = this.ensureAudioContext();
    if (!ctx || ctx.state === 'suspended') return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140 + (track % 4) * 35, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.015);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.Q.setValueAtTime(3.0, now);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.02);
    } catch {
      // Ignored
    }
  }

  public setMotorHum(isRunning: boolean): void {
    if (!this.isEnabled) return;
    if (isRunning) {
      this.startMotorHum();
    } else {
      this.stopMotorHum();
    }
  }

  private startMotorHum(): void {
    if (this.motorOsc) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      this.motorOsc = ctx.createOscillator();
      this.motorGain = ctx.createGain();
      this.motorOsc.type = 'triangle';
      this.motorOsc.frequency.setValueAtTime(95, ctx.currentTime);
      this.motorGain.gain.setValueAtTime(0.04, ctx.currentTime);

      this.motorOsc.connect(this.motorGain);
      this.motorGain.connect(ctx.destination);
      this.motorOsc.start();
    } catch {
      // Ignored
    }
  }

  private stopMotorHum(): void {
    if (!this.motorOsc) return;
    try {
      this.motorOsc.stop();
      this.motorOsc.disconnect();
    } catch {
      // Ignored
    }
    this.motorOsc = null;
    this.motorGain = null;
  }
}
