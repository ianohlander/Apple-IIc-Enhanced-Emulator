import React, { useState, useEffect, useMemo } from 'react';
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
import { DiskLibraryModal } from './components/DiskLibraryModal';
import {
  Terminal,
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
  ExternalLink
} from 'lucide-react';

export const App: React.FC = () => {
  const emulator = useMemo(() => new Apple2cUltra(), []);

  const [isRunning, setIsRunning] = useState(false);
  const [phosphor, setPhosphor] = useState<DisplayPhosphor>(DisplayPhosphor.COLOR_NTSC);
  const [scanlines, setScanlines] = useState(true);
  const [isCurved, setIsCurved] = useState(true);
  const [clockSpeed, setClockSpeed] = useState<number>(ClockSpeed.SPEED_1MHZ);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [activeUnderHoodTab, setActiveUnderHoodTab] = useState<
    'debugger' | 'memory' | 'softswitches' | 'storage' | 'rom' | 'typein' | 'code' | 'audio'
  >('debugger');

  const [, setTick] = useState(0);
  const triggerRefresh = () => setTick((t) => t + 1);

  useEffect(() => {
    // Auto-power on when loaded
    emulator.powerOn();
    setIsRunning(true);

    return () => {
      emulator.powerOff();
    };
  }, [emulator]);

  const handlePowerToggle = () => {
    if (isRunning) {
      emulator.powerOff();
      setIsRunning(false);
    } else {
      emulator.powerOn();
      setIsRunning(true);
    }
    triggerRefresh();
  };

  const handleReset = (cold: boolean) => {
    emulator.reset(cold);
    triggerRefresh();
  };

  const handleSpeedChange = (speed: number) => {
    setClockSpeed(speed);
    emulator.setSpeed(speed);
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    emulator.audio.setVolume(vol);
  };

  const handleMuteToggle = () => {
    const muted = emulator.audio.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="min-h-screen bg-[#131416] text-stone-200 font-sans flex flex-col items-center p-3 md:p-6 select-none">
      {/* Top Navbar */}
      <header className="max-w-6xl w-full flex flex-wrap items-center justify-between border-b border-stone-800 pb-3 mb-6 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg border border-amber-400/40">
            <span className="text-xl font-black text-stone-900"></span>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wider text-amber-400 font-mono">
              APPLE //c ULTRA
            </h1>
            <p className="text-xs text-stone-400">
              Enhanced 65C02 Web Computer • 1MB+ Banked RAM • 32MB Hard Drive • Double Hi-Res
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="flex items-center space-x-1 bg-stone-900 px-3 py-1.5 rounded-lg border border-stone-800">
            <span className="text-stone-500">SPEED:</span>
            <span className="text-amber-400 font-bold">{clockSpeed} MHz</span>
          </div>
          <div className="flex items-center space-x-1 bg-stone-900 px-3 py-1.5 rounded-lg border border-stone-800">
            <span className="text-stone-500">RAM:</span>
            <span className="text-green-400 font-bold">1,024 KB</span>
          </div>
          <div className="flex items-center space-x-1 bg-stone-900 px-3 py-1.5 rounded-lg border border-stone-800">
            <span className="text-stone-500">HD:</span>
            <span className="text-amber-300 font-bold">32 MB ProDOS</span>
          </div>
        </div>
      </header>

      {/* Main Vintage Workstation Section */}
      <main className="max-w-6xl w-full grid grid-cols-1 gap-6 items-center justify-center">
        {/* CRT Monitor */}
        <div className="flex justify-center w-full">
          <CRTDisplay
            emulator={emulator}
            phosphor={phosphor}
            onPhosphorChange={setPhosphor}
            scanlines={scanlines}
            onScanlinesToggle={() => setScanlines(!scanlines)}
            isCurved={isCurved}
            onCurvedToggle={() => setIsCurved(!isCurved)}
          />
        </div>

        {/* Apple IIc Chassis & Controls */}
        <div className="flex justify-center w-full">
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
          />
        </div>

        {/* Mechanical Keyboard */}
        <div className="flex justify-center w-full">
          <Keyboard emulator={emulator} />
        </div>

        {/* UNDER THE HOOD: Vintage Hacker & Engineering Suite */}
        <section className="w-full mt-4 flex flex-col space-y-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-stone-200 font-mono">
                UNDER THE HOOD INSPECTOR
              </h2>
            </div>
            <span className="text-xs text-stone-500 font-mono">
              Live Hardware Bus, Bytecode & ROM Toolchain
            </span>
          </div>

          {/* Under The Hood Tabs */}
          <div className="flex flex-wrap gap-1.5 bg-stone-950 p-1.5 rounded-xl border border-stone-800 font-mono text-xs">
            {[
              { id: 'debugger', label: '65C02 CPU Debugger', icon: Cpu },
              { id: 'memory', label: 'Memory Hex Map (1MB)', icon: Binary },
              { id: 'softswitches', label: 'Softswitches ($C000)', icon: Sliders },
              { id: 'storage', label: 'Floppy & 32MB HD', icon: HardDrive },
              { id: 'rom', label: 'Custom ROM Studio', icon: Terminal },
              { id: 'typein', label: 'Magazine Type-In', icon: BookOpen },
              { id: 'code', label: 'Java & .NET CLR', icon: Code },
              { id: 'audio', label: 'Mockingboard Audio', icon: Music },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeUnderHoodTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveUnderHoodTab(tab.id as typeof activeUnderHoodTab)}
                  className={`px-3 py-2 rounded-lg font-bold flex items-center gap-1.5 transition ${
                    active
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Active Tab Panel */}
          <div className="w-full">
            {activeUnderHoodTab === 'debugger' && <DebuggerPanel emulator={emulator} />}
            {activeUnderHoodTab === 'memory' && <MemoryHexViewer emulator={emulator} />}
            {activeUnderHoodTab === 'softswitches' && <SoftswitchMatrix emulator={emulator} />}
            {activeUnderHoodTab === 'storage' && (
              <StorageManager emulator={emulator} onRefresh={triggerRefresh} />
            )}
            {activeUnderHoodTab === 'rom' && <RomBuilderStudio emulator={emulator} />}
            {activeUnderHoodTab === 'typein' && <TypeInStudio system={emulator} />}
            {activeUnderHoodTab === 'code' && <ModernCodeStudio emulator={emulator} />}
            {activeUnderHoodTab === 'audio' && <AudioVisualizer emulator={emulator} />}
          </div>
        </section>
      </main>

      {/* Disk Library Dialog */}
      <DiskLibraryModal
        emulator={emulator}
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onMountSuccess={triggerRefresh}
      />

      {/* Footer */}
      <footer className="mt-12 text-stone-500 text-xs font-mono text-center max-w-4xl border-t border-stone-800 pt-4 w-full">
        Apple IIc Ultra Web Computer • Authentic 65C02 CMOS Emulation • Double Hi-Res NTSC Graphics • Web Audio Mockingboard
      </footer>
    </div>
  );
};
