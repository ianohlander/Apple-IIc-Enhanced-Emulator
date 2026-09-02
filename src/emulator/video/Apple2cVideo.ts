import { DisplayPhosphor, VideoMode } from '../../types/emulator';
import { Apple2cMMU } from '../mmu/Apple2cMMU';
import { DEFAULT_CHARSET_ROM } from '../roms/defaultRoms';
import { IVideoRenderer } from './renderers/IVideoRenderer';
import { TextRenderer } from './renderers/TextRenderer';
import { DoubleHiResRenderer } from './renderers/DoubleHiResRenderer';
import { PhosphorFilter } from './renderers/PhosphorFilter';

export interface VideoRendererOptions {
  phosphor: DisplayPhosphor;
  scanlines: boolean;
  curvature: boolean;
  bloom: boolean;
}

export class Apple2cVideo {
  public mmu: Apple2cMMU;
  public canvas: HTMLCanvasElement | null = null;
  public ctx: CanvasRenderingContext2D | null = null;
  public offscreenCanvas: HTMLCanvasElement;
  public offscreenCtx: CanvasRenderingContext2D;
  public charRom: Uint8Array;

  public width: number = 560;
  public height: number = 384;
  public imageData: ImageData;

  public options: VideoRendererOptions = {
    phosphor: DisplayPhosphor.COLOR_NTSC,
    scanlines: true,
    curvature: false,
    bloom: true
  };

  private textRenderer: TextRenderer = new TextRenderer();
  private dhgrRenderer: DoubleHiResRenderer = new DoubleHiResRenderer();

  constructor(mmu: Apple2cMMU, charRom?: Uint8Array) {
    this.mmu = mmu;
    this.charRom = charRom || DEFAULT_CHARSET_ROM;

    this.offscreenCanvas = typeof document !== 'undefined'
      ? document.createElement('canvas')
      : ({} as HTMLCanvasElement);

    if (this.offscreenCanvas.getContext) {
      this.offscreenCanvas.width = this.width;
      this.offscreenCanvas.height = this.height;
      this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true })!;
      this.imageData = this.offscreenCtx.createImageData(this.width, this.height);
    } else {
      this.offscreenCtx = {} as CanvasRenderingContext2D;
      this.imageData = { data: new Uint8ClampedArray(this.width * this.height * 4), width: this.width, height: this.height, colorSpace: 'srgb' };
    }
  }

  public setCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = canvas.getContext('2d');
  }

  public setPhosphor(phosphor: DisplayPhosphor): void {
    this.options.phosphor = phosphor;
  }

  public renderFrame(): void {
    const data = this.imageData.data;
    const mode = this.mmu.getVideoMode();
    const flashPhase = (Date.now() % 500) < 250;

    data.fill(0);

    const renderer = this.getRenderer(mode);
    renderer.render(data, this.mmu, this.charRom, flashPhase);

    PhosphorFilter.apply(data, this.options.phosphor, this.options.scanlines);
    this.drawToCanvas();
  }

  private getRenderer(mode: VideoMode): IVideoRenderer {
    if (mode === VideoMode.DHGR || mode === VideoMode.HGR) {
      return this.dhgrRenderer;
    }
    return this.textRenderer;
  }

  private drawToCanvas(): void {
    if (this.offscreenCtx && this.offscreenCtx.putImageData) {
      this.offscreenCtx.putImageData(this.imageData, 0, 0);
      if (this.ctx && this.canvas) {
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.drawImage(this.offscreenCanvas, 0, 0);
      }
    }
  }
}
