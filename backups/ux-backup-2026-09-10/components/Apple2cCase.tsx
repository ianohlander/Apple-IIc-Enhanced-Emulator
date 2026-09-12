import React from 'react';
import { Apple2cUltra } from '../emulator/apple2c';
import { ClockSpeed } from '../types/emulator';
import { Power, RotateCcw, Volume2, VolumeX, Disc, HardDrive, Gauge, Cpu } from 'lucide-react';

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
  onOpenLibrary
}) => {
  const d1Status = emulator.diskController.getStatus(1);
  const d2Status = emulator.diskController.getStatus(2);
  const hdStatus = emulator.smartPort.getStatus(1);

  return (
    <div className="bg-[#DFD9C0] border-4 border-[#BFB79D] rounded-2xl p-5 shadow-xl max-w-4xl w-full text-stone-800 font-mono select-none">
      {/* Top Badge Strip */}
      <div className="flex flex-wrap items-center justify-between border-b-2 border-[#C9C2A7] pb-3 mb-4 gap-2">
        <div className="flex items-center space-x-3">
          <div className="text-xl font-bold tracking-widest text-stone-800 flex items-center gap-1.5">
            <span className="text-red-500 font-black"></span>
            <span className="font-extrabold text-stone-800">apple //c</span>
            <span className="bg-amber-600 text-white text-xs px-2 py-0.5 rounded font-sans uppercase font-black tracking-normal">
              ULTRA 65C02
            </span>
          </div>
          <div className="text-xs bg-stone-300 text-stone-700 px-2 py-0.5 rounded border border-stone-400 font-semibold">
            1MB+ Aux RAM
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onPowerToggle}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 text-xs shadow transition ${
              isRunning
                ? 'bg-red-600 hover:bg-red-700 text-white border border-red-800'
                : 'bg-green-600 hover:bg-green-700 text-white border border-green-800'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            {isRunning ? 'Power OFF' : 'Power ON'}
          </button>

          <button
            onClick={() => onReset(false)}
            disabled={!isRunning}
            className="px-2.5 py-1.5 rounded-lg bg-stone-300 hover:bg-stone-400 text-stone-800 border border-stone-400 text-xs font-bold flex items-center gap-1 transition disabled:opacity-50"
            title="Warm Reset (Ctrl+Reset)"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>

          <button
            onClick={() => onReset(true)}
            disabled={!isRunning}
            className="px-2.5 py-1.5 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-900 border border-amber-400 text-xs font-bold flex items-center gap-1 transition disabled:opacity-50"
            title="Cold Reboot (Ctrl+Open-Apple+Reset)"
          >
            Cold Boot
          </button>

          <button
            onClick={onOpenLibrary}
            className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white border border-amber-900 text-xs font-bold flex items-center gap-1.5 shadow transition"
          >
            <Disc className="w-3.5 h-3.5" /> Software Library
          </button>
        </div>
      </div>

      {/* Hardware Status Strip: Speed Switcher, Volume, and Drive Activity LEDs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-[#D2CCB1] p-3 rounded-xl border border-[#BBB396] shadow-inner">
        {/* Speed Selector (1.02 MHz to Turbo) */}
        <div className="flex flex-col space-y-1">
          <span className="text-[11px] font-bold text-stone-700 flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5" /> CPU Frequency: <span className="text-amber-800">{clockSpeed} MHz</span>
          </span>
          <div className="flex items-center space-x-1">
            {[
              { label: '1.02M', val: ClockSpeed.SPEED_1MHZ },
              { label: '2.8M', val: ClockSpeed.SPEED_2_8MHZ },
              { label: '4M', val: ClockSpeed.SPEED_4MHZ },
              { label: '8M', val: ClockSpeed.SPEED_8MHZ },
              { label: '16M', val: ClockSpeed.SPEED_16MHZ },
              { label: 'Turbo 50M', val: ClockSpeed.SPEED_TURBO },
            ].map((spd) => (
              <button
                key={spd.label}
                onClick={() => onSpeedChange(spd.val)}
                className={`px-1.5 py-1 rounded text-[10px] font-bold border transition ${
                  clockSpeed === spd.val
                    ? 'bg-amber-700 text-white border-amber-900 shadow-sm'
                    : 'bg-[#E5DFCA] text-stone-700 border-stone-400 hover:bg-stone-200'
                }`}
              >
                {spd.label}
              </button>
            ))}
          </div>
        </div>

        {/* Audio Volume */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onMuteToggle}
            className="p-1.5 rounded-lg bg-[#E5DFCA] hover:bg-stone-200 border border-stone-400 text-stone-700"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-600" /> : <Volume2 className="w-4 h-4 text-green-700" />}
          </button>
          <div className="flex-1 flex flex-col space-y-0.5">
            <span className="text-[10px] font-bold text-stone-600">Volume: {Math.round(volume * 100)}%</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-amber-700 cursor-pointer h-1.5 bg-stone-300 rounded"
            />
          </div>
        </div>

        {/* Drive Activity Lights */}
        <div className="flex items-center justify-around space-x-2 bg-[#C7C0A4] p-2 rounded-lg border border-[#ADA487]">
          {/* Drive 1 LED */}
          <div className="flex items-center space-x-1.5">
            <div className={`w-3 h-3 rounded-full border border-stone-600 transition-all ${
              d1Status.isMotorOn
                ? 'bg-red-500 shadow-[0_0_8px_#ff0000]'
                : d1Status.mounted ? 'bg-green-700' : 'bg-stone-500'
            }`} />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-stone-800">DRIVE 1</span>
              <span className="text-[9px] text-stone-600 truncate max-w-[65px]">{d1Status.mounted ? '5.25"' : 'Empty'}</span>
            </div>
          </div>

          {/* Drive 2 LED */}
          <div className="flex items-center space-x-1.5">
            <div className={`w-3 h-3 rounded-full border border-stone-600 transition-all ${
              d2Status.isMotorOn
                ? 'bg-red-500 shadow-[0_0_8px_#ff0000]'
                : d2Status.mounted ? 'bg-green-700' : 'bg-stone-500'
            }`} />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-stone-800">DRIVE 2</span>
              <span className="text-[9px] text-stone-600 truncate max-w-[65px]">{d2Status.mounted ? '5.25"' : 'Empty'}</span>
            </div>
          </div>

          {/* SmartPort HD LED */}
          <div className="flex items-center space-x-1.5">
            <div className={`w-3 h-3 rounded-full border border-stone-600 transition-all ${
              hdStatus.isReading || hdStatus.isWriting
                ? 'bg-amber-400 shadow-[0_0_8px_#ffaa00]'
                : hdStatus.mounted ? 'bg-amber-700' : 'bg-stone-500'
            }`} />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-stone-800">HD 32MB</span>
              <span className="text-[9px] text-stone-600 truncate max-w-[65px]">{hdStatus.mounted ? 'ProDOS' : 'None'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
