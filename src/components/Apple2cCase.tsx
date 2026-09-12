import React, { useRef } from 'react';
import { Apple2cUltra } from '../emulator/apple2c';
import { ClockSpeed } from '../types/emulator';
import { Power, RotateCcw, Volume2, VolumeX, Disc, HardDrive, Cpu, Layers } from 'lucide-react';

interface Apple2cCaseProps {
  emulator: Apple2cUltra;
  isRunning: boolean;
  onPowerToggle: () => void;
  onReset: (cold: boolean) => void;
  clockSpeed: number;
  onSpeedChange: (speed: number) => void;
  isMuted: boolean;
  onMuteToggle: () => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  onOpenLibrary: () => void;
  onOpenCabinet?: (tabId: string) => void;
}

export const Apple2cCase: React.FC<Apple2cCaseProps> = ({
  emulator,
  isRunning,
  onPowerToggle,
  onReset,
  clockSpeed,
  onSpeedChange,
  isMuted,
  onMuteToggle,
  volume,
  onVolumeChange,
  onOpenLibrary,
  onOpenCabinet
}) => {
  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  const d1Status = emulator.diskController.getStatus(1);
  const d2Status = emulator.diskController.getStatus(2);
  const hdStatus = emulator.smartPort.getStatus(1);

  const handleFileUpload = (drive: 1 | 2, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (buffer) {
        emulator.diskController.insertDisk(drive, new Uint8Array(buffer), file.name);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleBootDrive1 = () => {
    emulator.reset(false);
    const drive1 = emulator.diskController.drive1;
    if (drive1 && drive1.rawData && drive1.rawData.length >= 256) {
      // Load Stage 1 Boot Sectors (Track 0 Sectors 0..sectorCount-1) into RAM $0800+
      const sector0 = drive1.rawData.subarray(0, 256);
      const sectorCount = Math.min(16, Math.max(1, sector0[0] || 1));
      for (let sec = 0; sec < sectorCount; sec++) {
        const physSector = FloppyDisk.DOS33_SKEW[sec] !== undefined ? FloppyDisk.DOS33_SKEW[sec] : sec;
        const src = physSector * 256;
        const dst = 0x0800 + sec * 256;
        if (src + 256 <= drive1.rawData.length) {
          for (let b = 0; b < 256; b++) {
            emulator.mmu.write(dst + b, drive1.rawData[src + b]);
          }
        }
      }
      emulator.diskController.motorOn = true;
      emulator.diskController.activeDriveNumber = 1;
      emulator.diskController.trackQuarterSteps = 0;
      emulator.cpu.a = 0x60;
      emulator.cpu.x = 0x60;
      emulator.cpu.y = 0x00;
      emulator.cpu.sp = 0xff;
      for (let i = 0x0100; i < 0x0200; i++) {
        emulator.mmu.write(i, 0x00);
      }
      emulator.cpu.setStatusByte(0x24);
      emulator.cpu.pc = 0x0801;
      if (!emulator.isRunning) {
        emulator.powerOn();
      }
    } else {
      // Boot Slot 6 PR#6: standard Apple II entry point $C600
      emulator.cpu.pc = 0xc600;
      if (!emulator.isRunning) {
        emulator.powerOn();
      }
    }
  };

  return (
    <div id="left-drive-tower" className="w-full lg:w-80 flex-shrink-0 flex flex-col justify-between gap-3.5 bg-[#dfd9cc] p-4 rounded-2xl border border-[#bcb5a4] shadow-md font-mono text-xs select-none">
      {/* Hidden File Inputs for Direct Floppy Loading */}
      <input
        type="file"
        ref={fileInputRef1}
        accept=".dsk,.do,.po,.woz"
        className="hidden"
        onChange={(e) => handleFileUpload(1, e)}
      />
      <input
        type="file"
        ref={fileInputRef2}
        accept=".dsk,.do,.po,.woz"
        className="hidden"
        onChange={(e) => handleFileUpload(2, e)}
      />

      {/* Top Exhaust Ventilation Louvers */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-stone-600 font-bold px-1">
          <span>SYSTEM CHASSIS EXHAUST</span>
          <span>1984 FROGDESIGN</span>
        </div>
        <div className="w-full h-4 frog-louvers-h rounded border border-[#a8a190]" title="Chassis Cooling Fan Slats" />
      </div>

      {/* Stacked Floppy Drives Container */}
      <div className="flex flex-col gap-3">
        {/* Drive 1 (5.25" Floppy Upper Drive) */}
        <div className="floppy-525-bezel rounded-xl p-3 text-stone-200 flex flex-col gap-2.5 shadow-lg">
          {/* Drive 1 Header */}
          <div className="flex items-center justify-between border-b border-stone-700 pb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold">💾</span>
              <span className="font-bold text-xs text-white">DISK II — DRIVE 1</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                id="led-drive1"
                className={`w-3 h-3 rounded-full border border-stone-900 transition-all duration-150 ${
                  d1Status.isMotorOn
                    ? 'bg-red-500 shadow-[0_0_10px_#ef4444]'
                    : d1Status.mounted
                    ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]'
                    : 'bg-stone-600'
                }`}
                title="Drive 1 Activity LED"
              />
              <span className="text-[10px] text-stone-400 font-bold">140 KB</span>
            </div>
          </div>

          {/* Floppy Door Slot & Latch Lever */}
          <div className="floppy-slot-bay p-2 rounded-lg flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-hidden flex-1">
              {/* Metal Latch Lever */}
              <div
                className="w-5 h-7 metal-latch rounded flex items-center justify-center flex-shrink-0 cursor-pointer shadow"
                title="Drive Latch Lever"
                onClick={() => fileInputRef1.current?.click()}
              >
                <div className="w-1 h-4 bg-stone-800 rounded-full" />
              </div>
              {/* Disk Label */}
              <div className="overflow-hidden">
                <span id="chassis-drive1-label" className="text-[11px] text-amber-300 font-bold block truncate">
                  {d1Status.mounted ? (d1Status.diskName || 'System Master DSK') : 'Empty Drive Bay'}
                </span>
                <span className="text-[9px] text-stone-400 block">Slot 6, Drive 1 ($C0E8)</span>
              </div>
            </div>

            {/* Load / Boot Buttons */}
            <div className="flex flex-col gap-1 flex-shrink-0">
              <button
                onClick={() => fileInputRef1.current?.click()}
                className="px-2 py-0.5 bg-stone-700 hover:bg-stone-600 text-white rounded text-[10px] font-bold shadow transition"
              >
                📂 Insert
              </button>
              <button
                onClick={handleBootDrive1}
                disabled={!isRunning}
                className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-black rounded text-[10px] font-black shadow transition disabled:opacity-50"
              >
                ⚡ Boot
              </button>
            </div>
          </div>
        </div>

        {/* Drive 2 (5.25" Floppy Lower Drive) */}
        <div className="floppy-525-bezel rounded-xl p-3 text-stone-200 flex flex-col gap-2.5 shadow-lg">
          {/* Drive 2 Header */}
          <div className="flex items-center justify-between border-b border-stone-700 pb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold">💾</span>
              <span className="font-bold text-xs text-white">DISK II — DRIVE 2</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                id="led-drive2"
                className={`w-3 h-3 rounded-full border border-stone-900 transition-all duration-150 ${
                  d2Status.isMotorOn
                    ? 'bg-red-500 shadow-[0_0_10px_#ef4444]'
                    : d2Status.mounted
                    ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]'
                    : 'bg-stone-600'
                }`}
                title="Drive 2 Activity LED"
              />
              <span className="text-[10px] text-stone-400 font-bold">140 KB</span>
            </div>
          </div>

          {/* Floppy Door Slot & Latch Lever */}
          <div className="floppy-slot-bay p-2 rounded-lg flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-hidden flex-1">
              {/* Metal Latch Lever */}
              <div
                className="w-5 h-7 metal-latch rounded flex items-center justify-center flex-shrink-0 cursor-pointer shadow"
                title="Drive Latch Lever"
                onClick={() => fileInputRef2.current?.click()}
              >
                <div className="w-1 h-4 bg-stone-800 rounded-full" />
              </div>
              {/* Disk Label */}
              <div className="overflow-hidden">
                <span id="chassis-drive2-label" className="text-[11px] text-emerald-300 font-bold block truncate">
                  {d2Status.mounted ? (d2Status.diskName || 'Mounted .DSK') : 'Empty Drive Bay'}
                </span>
                <span className="text-[9px] text-stone-400 block">Slot 6, Drive 2 ($C0E9)</span>
              </div>
            </div>

            {/* Load / Manage Buttons */}
            <div className="flex flex-col gap-1 flex-shrink-0">
              <button
                onClick={() => fileInputRef2.current?.click()}
                className="px-2 py-0.5 bg-stone-700 hover:bg-stone-600 text-white rounded text-[10px] font-bold shadow transition"
              >
                📂 Insert
              </button>
              <button
                onClick={onOpenLibrary}
                className="px-2 py-0.5 bg-stone-800 hover:bg-stone-700 text-amber-300 rounded text-[10px] font-bold shadow transition border border-stone-700"
              >
                🎛️ Library
              </button>
            </div>
          </div>
        </div>

        {/* SmartPort 32MB HD Status Bar */}
        <div className="bg-[#cdc6b7] px-2.5 py-1.5 rounded-lg border border-[#b8b09f] flex items-center justify-between text-[10px] text-stone-800 font-bold">
          <div className="flex items-center gap-1.5">
            <HardDrive className="w-3 h-3 text-stone-700" />
            <span>32MB SMARTPORT HD</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${hdStatus.mounted ? 'bg-emerald-600' : 'bg-stone-500'}`} />
            <span>{hdStatus.mounted ? '65,536 BLOCKS' : 'OFFLINE'}</span>
          </div>
        </div>
      </div>

      {/* Audio Volume Slider */}
      <div className="bg-[#cdc6b7] px-3 py-2 rounded-xl border border-[#b8b09f] flex items-center justify-between shadow-inner">
        <div className="flex items-center space-x-1.5">
          <button
            onClick={onMuteToggle}
            className="p-1 rounded bg-[#dfd9cc] hover:bg-stone-200 border border-[#bbb3a0] text-stone-800"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-600" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-700" />}
          </button>
          <span className="text-[10px] font-bold text-stone-700">AUDIO:</span>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-24 accent-amber-700 cursor-pointer h-1.5 bg-stone-400 rounded"
          />
          <span className="text-[10px] font-bold text-stone-800 w-7 text-right">{Math.round(volume * 100)}%</span>
        </div>
      </div>

      {/* Bottom Control Bay: Physical Power Rocker & Reset Pushbutton */}
      <div className="bg-[#cdc6b7] p-3 rounded-xl border border-[#b8b09f] flex items-center justify-between shadow-inner">
        {/* Heavy Power Rocker Switch */}
        <div className="flex items-center gap-2">
          <button
            id="power-btn"
            onClick={onPowerToggle}
            className={`px-3.5 py-2 ${
              isRunning ? 'rocker-power-on text-white' : 'rocker-power-off text-stone-400'
            } font-black rounded-lg shadow-md transition flex items-center gap-1.5 text-xs tooltip-hint`}
            data-tooltip="Heavy Rocker Power Switch (Cold Power Reboot)"
          >
            <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-300 animate-pulse' : 'bg-red-500'}`} />
            <span>POWER</span>
          </button>
        </div>

        {/* Tactile Reset Pushbutton */}
        <div className="flex items-center gap-2">
          <button
            id="reset-btn"
            onClick={() => onReset(false)}
            disabled={!isRunning}
            className="px-3.5 py-2 tactile-reset text-white font-black rounded-lg shadow-md transition flex items-center gap-1.5 text-xs tooltip-hint disabled:opacity-50"
            data-tooltip="Tactile Reset Pushbutton (Warm Reset $FFFC)"
          >
            <span>RESET</span>
          </button>
        </div>
      </div>
    </div>
  );
};
