import React, { useState, useEffect } from 'react';
import { Apple2cUltra } from '../../emulator/apple2c';
import { Volume2, Music, Radio } from 'lucide-react';

interface AudioVisualizerProps {
  emulator: Apple2cUltra;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ emulator }) => {
  const [psg1Regs, setPsg1Regs] = useState<number[]>([]);
  const [speakerState, setSpeakerState] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPsg1Regs(Array.from(emulator.audio.mockingboard.psg1.registers));
      setSpeakerState(emulator.audio.speakerState);
    }, 100);
    return () => clearInterval(interval);
  }, [emulator]);

  const formatHex2 = (v: number) => (v ?? 0).toString(16).toUpperCase().padStart(2, '0');

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 font-mono text-stone-200 text-xs shadow-xl flex flex-col space-y-4">
      <div className="flex items-center justify-between border-b border-stone-800 pb-3">
        <div className="flex items-center space-x-2">
          <Music className="w-4 h-4 text-amber-500" />
          <span className="text-amber-500 font-bold text-sm">AUDIO & MOCKINGBOARD MIXER</span>
        </div>
        <span className="text-stone-400 text-[11px]">1-Bit Speaker ($C030) + Dual AY-3-8910 (6 Voices)</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1-Bit Speaker Status */}
        <div className="bg-stone-950 p-3 rounded-lg border border-stone-800 flex flex-col space-y-3">
          <span className="font-bold text-amber-400 text-[11px] flex items-center gap-1">
            <Radio className="w-3.5 h-3.5" /> 1-Bit Internal Speaker Pulse ($C030)
          </span>

          <div className="flex items-center justify-between bg-stone-900 p-2 rounded border border-stone-800">
            <span className="text-stone-400">Cone Position:</span>
            <span className={`font-bold ${speakerState > 0 ? 'text-green-400' : 'text-stone-500'}`}>
              {speakerState > 0 ? 'HIGH (+1)' : 'LOW (-1)'}
            </span>
          </div>

          <div className="h-16 bg-stone-900 rounded border border-stone-800 flex items-center justify-center overflow-hidden relative">
            <div className="flex items-center space-x-1 w-full px-2 justify-around">
              {Array.from({ length: 24 }).map((_, i) => {
                const height = speakerState !== 0 ? (Math.sin(i * 0.5) * 16 + 20) : 4;
                return (
                  <div
                    key={i}
                    className="w-1.5 bg-amber-500 rounded-full transition-all duration-75"
                    style={{ height: `${height}px` }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Mockingboard PSG Registers */}
        <div className="bg-stone-950 p-3 rounded-lg border border-stone-800 flex flex-col space-y-3">
          <span className="font-bold text-amber-400 text-[11px] flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5" /> Mockingboard PSG 1 Registers ($C0C0-$C0CF)
          </span>

          <div className="grid grid-cols-4 gap-1.5 text-[11px]">
            {psg1Regs.slice(0, 14).map((reg, idx) => (
              <div key={idx} className="bg-stone-900 p-1.5 rounded border border-stone-800 flex justify-between items-center">
                <span className="text-stone-500">R{idx}:</span>
                <span className="text-amber-300 font-bold">${formatHex2(reg)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
