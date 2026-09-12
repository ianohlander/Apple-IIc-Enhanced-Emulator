import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Apple2cUltra } from './emulator/apple2c';
import { DisplayPhosphor, ClockSpeed } from './types/emulator';
import { CRTDisplay } from './components/CRTDisplay';
import { Apple2cCase } from './components/Apple2cCase';
import { Keyboard } from './components/Keyboard';
import { DebuggerPanel } from './components/UnderTheHood/DebuggerPanel';
import { MemoryHexViewer } from './components/UnderTheHood/MemoryHexViewer';
import { SoftswitchMatrix } from './components/UnderTheHood/SoftswitchMatrix';
import { StorageManager } from './components/UnderTheHood/StorageManager';
import { RomBuilderStudio } from './components/UnderTheHood/RomBuilderStudio';
import { ModernCodeStudio } from './components/UnderTheHood/ModernCodeStudio';
import { TypeInStudio } from './components/UnderTheHood/TypeInStudio';
import { AudioVisualizer } from './components/UnderTheHood/AudioVisualizer';
import { SlotStudio } from './components/UnderTheHood/SlotStudio';
import { PrinterStudio } from './components/UnderTheHood/PrinterStudio';
import { DiskLibraryModal } from './components/DiskLibraryModal';
import {
  Terminal,
  Layers,
  Cpu,
  Binary,
  Sliders,
  HardDrive,
  Code,
  Music,
  BookOpen,
  Tv,
  HelpCircle,
  Sparkles,
  Printer,
  Info,
  X,
  Maximize2,
  ExternalLink
} from 'lucide-react';

export const App: React.FC = () => {
  const emulator = useMemo(() => new Apple2cUltra(), []);

  const [isRunning, setIsRunning] = useState(false);
  const [phosphor, setPhosphor] = useState<DisplayPhosphor>(DisplayPhosphor.COLOR_NTSC);
  const [scanlines, setScanlines] = useState(true);
  const [isCurved, setIsCurved] = useState(true);
  const [clockSpeed, setClockSpeed] = useState<number>(ClockSpeed.SPEED_TURBO);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  // Retractable Sliding Hardware Cabinet Drawer
  const [isCabinetOpen, setIsCabinetOpen] = useState(false);
  const [activeCabinetTab, setActiveCabinetTab] = useState<
    'storage' | 'printer' | 'slots' | 'code' | 'typein' | 'debugger' | 'rom' | 'memory' | 'softswitches' | 'audio' | 'info'
  >('storage');

  // Bottom Mechanical Keyboard Drawer Toggle
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [, setTick] = useState(0);
  const triggerRefresh = useCallback(() => setTick((t) => t + 1), []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  useEffect(() => {
    // Auto-power on when loaded
    emulator.powerOn();
    emulator.setSpeed(ClockSpeed.SPEED_TURBO);
    setIsRunning(true);

    return () => {
      emulator.powerOff();
    };
  }, [emulator]);

  // Keyboard shortcut for Esc (closes cabinet / keyboard)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isCabinetOpen) {
          setIsCabinetOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCabinetOpen]);

  const handlePowerToggle = () => {
    if (isRunning) {
      emulator.powerOff();
      setIsRunning(false);
      showToast('⚡ Power Off');
    } else {
      emulator.powerOn();
      setIsRunning(true);
      showToast('⚡ Cold Power Cycle Completed');
    }
    triggerRefresh();
  };

  const handleReset = (cold: boolean) => {
    emulator.reset(cold);
    if (cold) {
      showToast('⚡ Cold Reboot (Ctrl+Open-Apple+Reset)');
    } else {
      showToast('🔄 Warm Reset (Ctrl+Reset)');
    }
    triggerRefresh();
  };

  const handleSpeedChange = (speed: number) => {
    setClockSpeed(speed);
    emulator.setSpeed(speed);
    showToast(`⚡ CPU Frequency: ${speed} MHz`);
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    emulator.audio.setVolume(vol);
  };

  const handleMuteToggle = () => {
    const muted = emulator.audio.toggleMute();
    setIsMuted(muted);
    showToast(muted ? '🔇 Audio Muted' : '🔊 Audio Active');
  };

  const handleOpenCabinet = (tab: typeof activeCabinetTab) => {
    setActiveCabinetTab(tab);
    setIsCabinetOpen(true);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const cabinetTabs = [
    { id: 'storage', label: '💾 Floppy & HD', icon: HardDrive },
    { id: 'printer', label: '🖨️ ImageWriter II', icon: Printer },
    { id: 'slots', label: '🎛️ 7-Slot Bus', icon: Layers },
    { id: 'code', label: '☕ Java & C# AOT', icon: Code },
    { id: 'typein', label: '📖 Magazine Type-In', icon: BookOpen },
    { id: 'debugger', label: '⚙️ CPU Debugger', icon: Cpu },
    { id: 'rom', label: '⚡ Custom ROM', icon: Terminal },
    { id: 'memory', label: '📊 Memory Hex Map', icon: Binary },
    { id: 'softswitches', label: '🎚️ Softswitches', icon: Sliders },
    { id: 'audio', label: '🎵 Mockingboard', icon: Music },
    { id: 'info', label: 'ⓘ System Guide', icon: Info },
  ];

  return (
    <div className={`min-h-screen text-stone-900 font-sans flex flex-col items-center p-3 sm:p-5 select-none overflow-x-hidden ${isFullscreen ? 'fullscreen-active' : ''}`}>
      {/* Top Rainbow Ribbon Bar */}
      <div className="fixed top-0 left-0 right-0 h-1.5 rainbow-border z-50" />

      {/* Top Header & Navigation Bar */}
      <header className="w-full max-w-6xl mt-2 mb-3 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center space-x-3">
          {/* 6502 Ultra Silicon Prism Badge */}
          <div className="w-9 h-9 rounded-xl bg-[#1e232d] border-2 border-[#d4af37] flex items-center justify-center shadow-lg p-1">
            <svg viewBox="0 0 32 32" className="w-full h-full">
              <rect x="3" y="3" width="26" height="26" rx="3" fill="#12161f" stroke="#eab308" strokeWidth="1.5"/>
              <path d="M3 9 L29 9" stroke="#61bb46" strokeWidth="1.5"/>
              <path d="M3 12 L29 12" stroke="#fdb827" strokeWidth="1.5"/>
              <path d="M3 15 L29 15" stroke="#f58220" strokeWidth="1.5"/>
              <path d="M3 18 L29 18" stroke="#e03a3e" strokeWidth="1.5"/>
              <path d="M3 21 L29 21" stroke="#963d97" strokeWidth="1.5"/>
              <path d="M3 24 L29 24" stroke="#009ddc" strokeWidth="1.5"/>
              <polygon points="16,5 23,21 9,21" fill="rgba(255,255,255,0.4)" stroke="#ffffff" strokeWidth="1"/>
            </svg>
          </div>
          <div>
            <h1 className="font-black text-base tracking-wider text-amber-100 flex items-center gap-2">
              <span>6502 ULTRA</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40 font-bold">1984 SNOW WHITE HARDWARE STUDIO</span>
            </h1>
            <p className="text-[11px] text-stone-400 font-mono">Enhanced 65C02 CMOS Web Workstation • Frogdesign 1984 Architecture • Slinky 1MB RAM • 32MB SmartPort HD</p>
          </div>
        </div>

        {/* Quick Navigation Links */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="docs/index.html"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-lg bg-[#201c18] hover:bg-[#2e2823] text-stone-200 border border-stone-700 transition flex items-center gap-1.5 shadow"
          >
            <span>📖</span> Documentation Portal
          </a>
          <a
            href="qa/index.html"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-lg bg-[#241f15] hover:bg-[#332b1d] text-amber-300 border border-amber-500/40 transition flex items-center gap-1.5 shadow"
          >
            <span>🧪</span> Developer &amp; QA Portal
          </a>
        </div>
      </header>

      {/* Main Vintage Workstation Section */}
      <main id="monitor-container" className="w-full max-w-6xl transition-all duration-300 mb-6">
        <div id="snow-white-workstation-chassis" className="snow-white-workstation rounded-3xl p-4 sm:p-6 border border-[#bfb8a7] shadow-2xl flex flex-col gap-4">
          
          {/* Top Bezel / Header: Inlaid 6502 Ultra Badge + Skeuomorphic Flyout Hardware Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c8c2b3] pb-3.5 font-mono text-xs">
            {/* Inlaid 6502 Ultra Silicon Prism Badge */}
            <div className="flex items-center space-x-3">
              <div className="px-3 py-1.5 rounded-xl bg-[#1e232d] border-2 border-[#d4af37] shadow-lg flex items-center gap-2.5">
                <svg viewBox="0 0 32 32" className="w-7 h-7">
                  <rect x="3" y="3" width="26" height="26" rx="3" fill="#12161f" stroke="#eab308" strokeWidth="1.5"/>
                  <path d="M3 9 L29 9" stroke="#61bb46" strokeWidth="1.5"/>
                  <path d="M3 12 L29 12" stroke="#fdb827" strokeWidth="1.5"/>
                  <path d="M3 15 L29 15" stroke="#f58220" strokeWidth="1.5"/>
                  <path d="M3 18 L29 18" stroke="#e03a3e" strokeWidth="1.5"/>
                  <path d="M3 21 L29 21" stroke="#963d97" strokeWidth="1.5"/>
                  <path d="M3 24 L29 24" stroke="#009ddc" strokeWidth="1.5"/>
                  <polygon points="16,5 23,21 9,21" fill="rgba(255,255,255,0.4)" stroke="#ffffff" strokeWidth="1"/>
                </svg>
                <div>
                  <span className="font-serif font-black text-base tracking-widest text-amber-200">6502</span>
                  <span className="font-sans font-black text-[11px] tracking-widest text-emerald-400 ml-1">ULTRA</span>
                </div>
              </div>
              <div>
                <div className="font-black text-xs tracking-wider font-mono text-stone-900 flex items-center gap-2">
                  <span>FROGDESIGN 1984 WORKSTATION</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-stone-800 text-amber-300 font-bold">{clockSpeed} MHz TURBO</span>
                </div>
                <div className="text-[10px] text-stone-600 font-mono">1MB Slinky RAM • 32MB SmartPort HD • Dual 5.25" Disk II Drives • ImageWriter II</div>
              </div>
            </div>

            {/* Skeuomorphic Flyout Hardware Push-Buttons Bar */}
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
              <button
                id="btn-bay-storage"
                onClick={() => handleOpenCabinet('storage')}
                className="px-2.5 py-1.5 rounded-lg bg-[#2a303c] hover:bg-amber-600 text-amber-200 hover:text-white font-bold border border-stone-600 shadow transition flex items-center gap-1.5 tooltip-hint"
                data-tooltip="Floppy & 32MB HD Storage Bay"
              >
                <span>💾</span> <span>Floppy &amp; HD</span>
              </button>
              <button
                id="btn-bay-printer"
                onClick={() => handleOpenCabinet('printer')}
                className="px-2.5 py-1.5 rounded-lg bg-[#2a303c] hover:bg-amber-600 text-amber-200 hover:text-white font-bold border border-stone-600 shadow transition flex items-center gap-1.5 tooltip-hint"
                data-tooltip="ImageWriter II Dot-Matrix Printer"
              >
                <span>🖨️</span> <span>ImageWriter</span>
              </button>
              <button
                id="btn-bay-slots"
                onClick={() => handleOpenCabinet('slots')}
                className="px-2.5 py-1.5 rounded-lg bg-[#2a303c] hover:bg-amber-600 text-amber-200 hover:text-white font-bold border border-stone-600 shadow transition flex items-center gap-1.5 tooltip-hint"
                data-tooltip="7-Slot Expansion Bus Backplane"
              >
                <span>🎛️</span> <span>7-Slot Bus</span>
              </button>
              <button
                id="btn-bay-code"
                onClick={() => handleOpenCabinet('code')}
                className="px-2.5 py-1.5 rounded-lg bg-[#2a303c] hover:bg-amber-600 text-amber-200 hover:text-white font-bold border border-stone-600 shadow transition flex items-center gap-1.5 tooltip-hint"
                data-tooltip="Modern Java & C# AOT Compiler"
              >
                <span>☕</span> <span>Java/C# AOT</span>
              </button>
              <button
                id="btn-bay-typein"
                onClick={() => handleOpenCabinet('typein')}
                className="px-2.5 py-1.5 rounded-lg bg-[#2a303c] hover:bg-amber-600 text-amber-200 hover:text-white font-bold border border-stone-600 shadow transition flex items-center gap-1.5 tooltip-hint"
                data-tooltip="Magazine Type-In Transcriber Binder"
              >
                <span>📖</span> <span>Type-In</span>
              </button>
              <button
                id="btn-bay-debugger"
                onClick={() => handleOpenCabinet('debugger')}
                className="px-2.5 py-1.5 rounded-lg bg-[#2a303c] hover:bg-amber-600 text-amber-200 hover:text-white font-bold border border-stone-600 shadow transition flex items-center gap-1.5 tooltip-hint"
                data-tooltip="65C02 CPU Register Analyzer"
              >
                <span>⚙️</span> <span>Debugger</span>
              </button>
              <button
                id="btn-bay-rom"
                onClick={() => handleOpenCabinet('rom')}
                className="px-2.5 py-1.5 rounded-lg bg-[#2a303c] hover:bg-amber-600 text-amber-200 hover:text-white font-bold border border-stone-600 shadow transition flex items-center gap-1.5 tooltip-hint"
                data-tooltip="Custom ROM & Firmware Studio"
              >
                <span>⚡</span> <span>ROM Studio</span>
              </button>
              <button
                id="btn-bay-info"
                onClick={() => handleOpenCabinet('info')}
                className="px-2 py-1.5 rounded-lg bg-[#1e232d] hover:bg-[#2b3342] text-cyan-300 font-bold border border-stone-700 shadow transition flex items-center gap-1 tooltip-hint"
                data-tooltip="System Guide & Schematics"
              >
                <span>ⓘ</span>
              </button>
            </div>
          </div>

          {/* Main Hardware Body: Side-by-Side Left Floppy Tower + Right CRT Monitor */}
          <div className="flex flex-col lg:flex-row items-stretch gap-5">
            {/* Left Tower: Stacked Dual 5.25" Drives + Power Controls */}
            <Apple2cCase
              emulator={emulator}
              isRunning={isRunning}
              onPowerToggle={handlePowerToggle}
              onReset={handleReset}
              clockSpeed={clockSpeed}
              onSpeedChange={handleSpeedChange}
              isMuted={isMuted}
              onMuteToggle={handleMuteToggle}
              volume={volume}
              onVolumeChange={handleVolumeChange}
              onOpenLibrary={() => setIsLibraryOpen(true)}
              onOpenCabinet={handleOpenCabinet}
            />

            {/* Right Bay: Snow White CRT Monitor Housing */}
            <CRTDisplay
              emulator={emulator}
              phosphor={phosphor}
              onPhosphorChange={setPhosphor}
              scanlines={scanlines}
              onScanlinesToggle={() => setScanlines(!scanlines)}
              isCurved={isCurved}
              onCurvedToggle={() => setIsCurved(!isCurved)}
              clockSpeed={clockSpeed}
              onSpeedChange={handleSpeedChange}
              onReset={handleReset}
              onPowerToggle={handlePowerToggle}
              isRunning={isRunning}
              onOpenCabinet={handleOpenCabinet}
              onToggleKeyboard={() => setIsKeyboardOpen(!isKeyboardOpen)}
              onToggleFullscreen={handleToggleFullscreen}
            />
          </div>
        </div>

        {/* 63-Key Mechanical Keyboard Matrix */}
        {isKeyboardOpen && (
          <div className="w-full flex justify-center mt-4 transition-all duration-300">
            <Keyboard
              emulator={emulator}
              onClose={() => setIsKeyboardOpen(false)}
            />
          </div>
        )}
      </main>

      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[100000] bg-[#161f2c] border-2 border-amber-500/80 text-amber-300 px-4 py-2.5 rounded-xl shadow-2xl font-mono text-xs font-bold animate-bounce flex items-center gap-2">
          <span>⚡</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Dimmed Drawer Backdrop */}
      {isCabinetOpen && (
        <div
          onClick={() => setIsCabinetOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99998] transition-opacity duration-300 cursor-pointer"
        />
      )}

      {/* SLIDING RETRACTABLE HARDWARE CABINET DRAWER */}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-[#0f141d] cabinet-drawer z-[99999] transition-transform duration-300 flex flex-col font-mono text-xs overflow-hidden ${
          isCabinetOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Cabinet Header */}
        <div className="hardware-cabinet-header border-b-2 border-[#d4af37]/40 px-6 py-4 flex items-center justify-between shadow-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-[#141923] text-amber-400 border border-amber-500/50 flex items-center justify-center font-bold text-lg shadow-inner">
              🎛️
            </div>
            <div>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest block font-mono">
                6502 ULTRA RETRACTABLE HARDWARE CABINET
              </span>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                {cabinetTabs.find((t) => t.id === activeCabinetTab)?.label || 'Hardware Expansion Bay'}
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-1 font-mono text-[10px] text-stone-400 bg-[#12161f] px-2.5 py-1 rounded border border-stone-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>BUS ONLINE</span>
            </div>
            <button
              onClick={() => setIsCabinetOpen(false)}
              className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-red-900 text-gray-300 hover:text-white font-bold transition flex items-center justify-center border border-stone-700 text-sm shadow"
              title="Close Drawer (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Cabinet Tab Bar (Tactile Hardware Push-Buttons) */}
        <div className="bg-[#0b0e14] border-b border-[#242e3f] px-4 py-2.5 flex flex-wrap gap-1.5 overflow-x-auto shadow-inner">
          {cabinetTabs.map((tab) => {
            const active = activeCabinetTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCabinetTab(tab.id as typeof activeCabinetTab)}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition text-xs shadow-sm ${
                  active
                    ? 'bg-amber-600 text-white border border-amber-500/50 shadow'
                    : 'text-stone-400 hover:text-white hover:bg-stone-900 border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Cabinet Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {activeCabinetTab === 'storage' && (
            <StorageManager emulator={emulator} onRefresh={triggerRefresh} />
          )}

          {activeCabinetTab === 'printer' && (
            <PrinterStudio emulator={emulator} />
          )}

          {activeCabinetTab === 'slots' && (
            <SlotStudio emulator={emulator} />
          )}

          {activeCabinetTab === 'code' && (
            <ModernCodeStudio emulator={emulator} />
          )}

          {activeCabinetTab === 'typein' && (
            <TypeInStudio system={emulator} />
          )}

          {activeCabinetTab === 'debugger' && (
            <DebuggerPanel emulator={emulator} />
          )}

          {activeCabinetTab === 'rom' && (
            <RomBuilderStudio emulator={emulator} />
          )}

          {activeCabinetTab === 'memory' && (
            <MemoryHexViewer emulator={emulator} />
          )}

          {activeCabinetTab === 'softswitches' && (
            <SoftswitchMatrix emulator={emulator} />
          )}

          {activeCabinetTab === 'audio' && (
            <AudioVisualizer emulator={emulator} />
          )}

          {activeCabinetTab === 'info' && (
            <div className="bg-[#12161f] border-2 border-[#2b374a] rounded-xl p-5 font-mono text-gray-200 space-y-4 shadow-2xl">
              <div className="flex items-center space-x-3 border-b border-[#2b374a] pb-3">
                <div className="w-8 h-8 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                  ⓘ
                </div>
                <div>
                  <h4 className="text-sm font-bold text-cyan-400">6502 ULTRA HARDWARE REFERENCE</h4>
                  <p className="text-xs text-gray-400">Frogdesign 1984 Architecture &amp; Subsystem Map</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-stone-300">
                <div className="p-3 bg-[#0a0d14] rounded-lg border border-[#1b2535]">
                  <strong className="text-amber-400 block mb-1">Stacked Dual 5.25" Disk II Drives (Slot 6):</strong>
                  Directly load 140KB .DSK, .DO, .PO, and .WOZ disks into Drive 1 or Drive 2 with realistic read/write LED feedback and stepper sounds.
                </div>

                <div className="p-3 bg-[#0a0d14] rounded-lg border border-[#1b2535]">
                  <strong className="text-emerald-400 block mb-1">ImageWriter II Tractor-Feed Printer (Slot 1):</strong>
                  Real-time Centronics printer output from BASIC <code className="text-emerald-300">PR#1</code> or machine code with 9-pin dot-matrix simulation and continuous paper stock.
                </div>

                <div className="p-3 bg-[#0a0d14] rounded-lg border border-[#1b2535]">
                  <strong className="text-amber-300 block mb-1">7-Slot Peripheral Backplane:</strong>
                  Plug in authentic expansion cards or script custom JavaScript peripheral hardware responding to memory-mapped I/O ($C080..$C0FF).
                </div>

                <div className="p-3 bg-[#0a0d14] rounded-lg border border-[#1b2535]">
                  <strong className="text-cyan-300 block mb-1">Modern Java &amp; C# AOT Compilers:</strong>
                  Write clean modern object-oriented code with native zero-overhead lowering directly to 65C02 bytecode.
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <a
                  href="docs/index.html"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition shadow flex items-center gap-1.5"
                >
                  <span>📖</span> Open Full Documentation Portal
                </a>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Disk Library Dialog */}
      <DiskLibraryModal
        emulator={emulator}
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onMountSuccess={triggerRefresh}
      />

      {/* Footer */}
      <footer className="mt-8 text-stone-500 text-xs font-mono text-center max-w-4xl border-t border-stone-800 pt-4 w-full">
        <div>© 2026 Ian Ohlander. All rights reserved. • 65C02 Ultra Workstation</div>
        <div className="text-[11px] text-stone-600 mt-1">
          Zero Platform Lock-In • Modern .NET &amp; Java AOT Runtimes • Vintage Software Preservation
        </div>
      </footer>
    </div>
  );
};

