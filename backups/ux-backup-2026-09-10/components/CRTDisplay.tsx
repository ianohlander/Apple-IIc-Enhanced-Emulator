import React, { useRef, useEffect } from 'react';
import { Apple2cUltra } from '../emulator/apple2c';
import { DisplayPhosphor } from '../types/emulator';
import { Monitor, Zap, Tv, Eye, Clipboard } from 'lucide-react';
import { TypeInManager } from '../emulator/typein/typeInManager';

interface CRTDisplayProps {
  emulator: Apple2cUltra;
  phosphor: DisplayPhosphor;
  onPhosphorChange: (p: DisplayPhosphor) => void;
  scanlines: boolean;
  onScanlinesToggle: () => void;
  isCurved: boolean;
  onCurvedToggle: () => void;
}

export const CRTDisplay: React.FC<CRTDisplayProps> = ({
  emulator,
  phosphor,
  onPhosphorChange,
  scanlines,
  onScanlinesToggle,
  isCurved,
  onCurvedToggle
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
    <div className="flex flex-col items-center">
      {/* CRT Monitor Outer Casing (Warm Platinum Bezel) */}
      <div className="relative bg-[#D6D0B8] border-8 border-[#B8B094] rounded-2xl p-6 shadow-2xl max-w-4xl w-full">
        {/* Apple Logo Badge */}
        <div className="absolute top-2 left-6 flex items-center space-x-1">
          <span className="text-sm font-bold tracking-wider text-stone-700"> Monitor //c</span>
        </div>

        {/* CRT Screen Bezel */}
        <div className="relative bg-[#1A1C18] p-4 rounded-xl border-4 border-[#3A382E] shadow-inner flex justify-center items-center overflow-hidden">
          {/* CRT Glass Curvature Effect */}
          <div className={`relative w-full aspect-[4/3] max-w-[640px] flex items-center justify-center bg-black rounded-lg overflow-hidden ${
            isCurved ? 'shadow-[inset_0_0_80px_rgba(0,0,0,0.9)]' : ''
          }`}>
            <canvas
              ref={canvasRef}
              width={560}
              height={384}
              onMouseMove={handleMouseMove}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onContextMenu={handleContextMenu}
              className="w-full h-full object-contain rounded-md cursor-crosshair"
              style={{
                filter: phosphor === DisplayPhosphor.GREEN
                  ? 'drop-shadow(0 0 8px rgba(51, 255, 68, 0.45))'
                  : phosphor === DisplayPhosphor.AMBER
                  ? 'drop-shadow(0 0 8px rgba(255, 176, 0, 0.45))'
                  : 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.2))'
              }}
            />

            {/* Subtle Screen Glass Scanline Overlay */}
            {scanlines && (
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />
            )}

            {/* CRT Phosphor Glare / Vignette */}
            <div className="absolute inset-0 pointer-events-none rounded-lg bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03)_0%,rgba(0,0,0,0.35)_100%)]" />
          </div>
        </div>

        {/* Monitor Controls Under-Bezel */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-stone-800">
          <div className="flex items-center space-x-2">
            <span className="font-bold flex items-center gap-1">
              <Tv className="w-3.5 h-3.5" /> Phosphor:
            </span>
            <button
              onClick={() => onPhosphorChange(DisplayPhosphor.COLOR_NTSC)}
              className={`px-2.5 py-1 rounded font-bold border transition ${
                phosphor === DisplayPhosphor.COLOR_NTSC
                  ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                  : 'bg-stone-200 text-stone-700 border-stone-400 hover:bg-stone-300'
              }`}
            >
              NTSC Color
            </button>
            <button
              onClick={() => onPhosphorChange(DisplayPhosphor.GREEN)}
              className={`px-2.5 py-1 rounded font-bold border transition ${
                phosphor === DisplayPhosphor.GREEN
                  ? 'bg-green-600 text-white border-green-700 shadow-sm'
                  : 'bg-stone-200 text-stone-700 border-stone-400 hover:bg-stone-300'
              }`}
            >
              P1 Green
            </button>
            <button
              onClick={() => onPhosphorChange(DisplayPhosphor.AMBER)}
              className={`px-2.5 py-1 rounded font-bold border transition ${
                phosphor === DisplayPhosphor.AMBER
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                  : 'bg-stone-200 text-stone-700 border-stone-400 hover:bg-stone-300'
              }`}
            >
              P3 Amber
            </button>
            <button
              onClick={() => onPhosphorChange(DisplayPhosphor.WHITE)}
              className={`px-2.5 py-1 rounded font-bold border transition ${
                phosphor === DisplayPhosphor.WHITE
                  ? 'bg-stone-700 text-white border-stone-800 shadow-sm'
                  : 'bg-stone-200 text-stone-700 border-stone-400 hover:bg-stone-300'
              }`}
            >
              P4 White
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePasteClick}
              className="px-2 py-1 rounded border flex items-center gap-1 font-bold bg-amber-600 hover:bg-amber-500 text-white border-amber-700 shadow-sm transition"
              title="Paste clipboard text or BASIC program into Apple II"
            >
              <Clipboard className="w-3.5 h-3.5" /> Paste
            </button>
            <button
              onClick={onScanlinesToggle}
              className={`px-2 py-1 rounded border flex items-center gap-1 font-bold transition ${
                scanlines
                  ? 'bg-stone-700 text-white border-stone-800'
                  : 'bg-stone-200 text-stone-700 border-stone-400 hover:bg-stone-300'
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> Scanlines {scanlines ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={onCurvedToggle}
              className={`px-2 py-1 rounded border flex items-center gap-1 font-bold transition ${
                isCurved
                  ? 'bg-stone-700 text-white border-stone-800'
                  : 'bg-stone-200 text-stone-700 border-stone-400 hover:bg-stone-300'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" /> CRT Glass {isCurved ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
