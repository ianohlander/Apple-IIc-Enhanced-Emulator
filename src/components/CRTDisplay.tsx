import React, { useRef, useEffect } from 'react';
import { Apple2cUltra } from '../emulator/apple2c';
import { DisplayPhosphor, ClockSpeed } from '../types/emulator';
import { TypeInManager } from '../emulator/typein/typeInManager';

interface CRTDisplayProps {
  emulator: Apple2cUltra;
  phosphor: DisplayPhosphor;
  onPhosphorChange: (p: DisplayPhosphor) => void;
  scanlines: boolean;
  onScanlinesToggle: () => void;
  isCurved: boolean;
  onCurvedToggle: () => void;
  clockSpeed?: number;
  onSpeedChange?: (speed: number) => void;
  onReset?: (cold: boolean) => void;
  onPowerToggle?: () => void;
  isRunning?: boolean;
  onOpenCabinet?: (tabId: string) => void;
  onToggleKeyboard?: () => void;
  onToggleFullscreen?: () => void;
}

export const CRTDisplay: React.FC<CRTDisplayProps> = ({
  emulator,
  phosphor,
  onPhosphorChange,
  scanlines,
  onScanlinesToggle,
  isCurved,
  onCurvedToggle,
  clockSpeed = ClockSpeed.SPEED_TURBO,
  onSpeedChange,
  onReset,
  onPowerToggle,
  isRunning = true,
  onOpenCabinet,
  onToggleKeyboard,
  onToggleFullscreen
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      emulator.video.setCanvas(canvasRef.current);
    }
  }, [emulator]);

  useEffect(() => {
    emulator.video.setPhosphor(phosphor);
  }, [emulator, phosphor]);

  useEffect(() => {
    emulator.video.options.scanlines = scanlines;
  }, [emulator, scanlines]);

  // Global Clipboard Paste Listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      e.preventDefault();
      const text = e.clipboardData?.getData('text');
      if (text) {
        const mgr = new TypeInManager(emulator.mmu);
        mgr.queueText(text);
        mgr.startTyping(10);
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [emulator]);

  const handlePasteClick = async () => {
    try {
      if (navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          const mgr = new TypeInManager(emulator.mmu);
          mgr.queueText(text);
          mgr.startTyping(10);
          return;
        }
      }
    } catch(e) {}
    const fallback = prompt("Paste your Apple II BASIC program or Monitor hex dump here:");
    if (fallback) {
      const mgr = new TypeInManager(emulator.mmu);
      mgr.queueText(fallback);
      mgr.startTyping(10);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;
    const appleX = Math.floor(relX * 255);
    const appleY = Math.floor(relY * 255);
    const btn0 = (e.buttons & 1) !== 0;
    const btn1 = (e.buttons & 2) !== 0;
    emulator.mmu.setMouse(appleX, appleY, btn0, btn1);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const btn0 = e.button === 0;
    const btn1 = e.button === 2;
    const btn2 = e.button === 1;
    emulator.mmu.setMouse(emulator.mmu.ioRouter.mouseX, emulator.mmu.ioRouter.mouseY, btn0, btn1, btn2);
  };

  const handleMouseUp = () => {
    emulator.mmu.setMouse(emulator.mmu.ioRouter.mouseX, emulator.mmu.ioRouter.mouseY, false, false, false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent browser right-click menu over CRT screen
  };

  return (
    <div id="crt-bezel-box" className="snow-white-crt-bezel flex-1 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 shadow-lg font-mono text-xs select-none">
      {/* Bezel Top Bar: Phosphor Dial, Speed, Scanlines, Fullscreen & Paste */}
      <div className="flex flex-wrap items-center justify-between pb-2.5 border-b border-[#bcb4a3] gap-2 font-mono text-xs">
        {/* Left: Status LEDs & Model */}
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isRunning ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse' : 'bg-red-500'
            }`}
            title="System Power & Video Clock Online"
          />
          <span className="font-black text-xs tracking-wider text-stone-800">MONITOR ULTRA //c</span>
          <span className="text-[10px] text-stone-600 hidden xl:inline">HIGH-RESOLUTION CRT</span>
        </div>

        {/* Center: Phosphor & Clock Speed Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1">
            <span className="text-stone-600 text-[10px] font-bold">PHOSPHOR:</span>
            <select
              value={phosphor}
              onChange={(e) => onPhosphorChange(e.target.value as DisplayPhosphor)}
              className="bg-[#141a24] text-emerald-400 font-bold px-2 py-1 rounded border border-stone-600 shadow-inner text-xs cursor-pointer focus:outline-none"
            >
              <option value={DisplayPhosphor.COLOR_NTSC} className="bg-[#141a24] text-amber-300">🎨 Color Composite</option>
              <option value={DisplayPhosphor.GREEN} className="bg-[#141a24] text-emerald-400">🟢 P1 Green</option>
              <option value={DisplayPhosphor.AMBER} className="bg-[#141a24] text-amber-400">🟡 P3 Amber</option>
              <option value={DisplayPhosphor.WHITE} className="bg-[#141a24] text-stone-200">⚪ P4 B&amp;W</option>
            </select>
          </div>

          {onSpeedChange && (
            <div className="flex items-center space-x-1">
              <span className="text-stone-600 text-[10px] font-bold">SPEED:</span>
              <select
                value={clockSpeed}
                onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                className="bg-[#141a24] text-amber-400 font-bold px-2 py-1 rounded border border-stone-600 shadow-inner text-xs cursor-pointer focus:outline-none"
              >
                <option value={ClockSpeed.SPEED_1MHZ} className="bg-[#141a24] text-stone-200">1.02 MHz (1984)</option>
                <option value={ClockSpeed.SPEED_2_8MHZ} className="bg-[#141a24] text-stone-200">2.80 MHz (IIGS)</option>
                <option value={ClockSpeed.SPEED_8MHZ} className="bg-[#141a24] text-stone-200">8.00 MHz (Zip)</option>
                <option value={ClockSpeed.SPEED_TURBO} className="bg-[#141a24] text-amber-400 font-bold">50.0 MHz (Ultra)</option>
              </select>
            </div>
          )}

          {/* Scanline Switch */}
          <button
            id="btn-scanlines-switch"
            onClick={onScanlinesToggle}
            className="px-2 py-1 bg-[#141a24] hover:bg-[#1f2838] text-emerald-400 font-bold rounded border border-stone-600 shadow-inner text-xs transition flex items-center gap-1 tooltip-hint"
            data-tooltip="Toggle CRT Glass Raster Scanlines"
          >
            <span id="btn-bay-scanlines" className="inline-flex items-center gap-1">
              <span>▤</span> <span>{scanlines ? 'Scanlines ON' : 'Scanlines OFF'}</span>
            </span>
          </button>
        </div>

        {/* Right: Fullscreen & Paste */}
        <div className="flex items-center space-x-1.5">
          {onToggleFullscreen && (
            <button
              id="btn-screen-fullscreen"
              onClick={onToggleFullscreen}
              className="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 font-bold rounded border border-emerald-800 transition text-xs flex items-center gap-1 shadow tooltip-hint"
              data-tooltip="HTML5 Fullscreen"
            >
              <span>⛶</span> Fullscreen
            </button>
          )}

          <button
            id="paste-btn"
            onClick={handlePasteClick}
            className="px-2.5 py-1 bg-amber-700 hover:bg-amber-600 text-white font-bold rounded border border-amber-800 transition flex items-center gap-1 shadow tooltip-hint"
            data-tooltip="Pastes clipboard text directly into the 65C02 Keyboard Strobe register ($C000)"
          >
            <span>📋</span> Paste ($C000)
          </button>
        </div>
      </div>

      {/* Canvas Frame (Pixel-Crisp Apple II VRAM Surface) */}
      <div id="crt-frame" className="crt-screen-frame relative p-2 crt-curved overflow-hidden aspect-[4/3] flex items-center justify-center transition-all duration-300">
        <canvas
          ref={canvasRef}
          width={560}
          height={384}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onContextMenu={handleContextMenu}
          className="w-full h-full object-contain rounded-xl cursor-crosshair"
          style={{
            filter: phosphor === DisplayPhosphor.GREEN
              ? 'drop-shadow(0 0 10px rgba(51, 255, 68, 0.4))'
              : phosphor === DisplayPhosphor.AMBER
              ? 'drop-shadow(0 0 10px rgba(255, 176, 0, 0.4))'
              : phosphor === DisplayPhosphor.WHITE
              ? 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.25))'
              : 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.3))'
          }}
        />
        {scanlines && (
          <div id="scanline-overlay" className="absolute inset-0 pointer-events-none scanlines rounded-xl opacity-60" />
        )}
      </div>

      {/* Bottom Bezel: Keyboard Trigger Button */}
      <div className="flex items-center justify-between pt-2 border-t border-[#bcb4a3] text-[11px] font-mono text-stone-700">
        {onToggleKeyboard && (
          <button
            id="btn-bay-keyboard"
            onClick={onToggleKeyboard}
            className="px-3 py-1.5 rounded-lg bg-[#2a303c] hover:bg-amber-600 text-amber-200 hover:text-white font-bold border border-stone-600 shadow transition flex items-center gap-2"
          >
            <span>⌨️</span> <span>Fly-Up 63-Key Mechanical Keyboard Matrix</span>
          </button>
        )}
        <span className="text-[10px] text-stone-600 hidden sm:inline">Active Resolution: 560x384 Double Hi-Res Color Composite • 24x80 VRAM</span>
      </div>
    </div>
  );
};

