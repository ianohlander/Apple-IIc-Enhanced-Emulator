import React, { useState, useEffect } from 'react';
import { Apple2cUltra } from '../../emulator/apple2c';
import { DisassemblyLine } from '../../types/emulator';
import { Play, Pause, StepForward, SkipForward, CircleDot, RefreshCw } from 'lucide-react';

interface DebuggerPanelProps {
  emulator: Apple2cUltra;
}

export const DebuggerPanel: React.FC<DebuggerPanelProps> = ({ emulator }) => {
  const [cpuState, setCpuState] = useState(emulator.cpu.getState());
  const [disassembly, setDisassembly] = useState<DisassemblyLine[]>([]);
  const [jumpAddr, setJumpAddr] = useState('2000');

  const refreshState = () => {
    setCpuState(emulator.cpu.getState());
    generateDisassembly(emulator.cpu.pc);
  };

  const generateDisassembly = (startAddr: number) => {
    const lines: DisassemblyLine[] = [];
    let cur = startAddr;
    for (let i = 0; i < 16; i++) {
      const line = emulator.cpu.disassemble(cur);
      line.isBreakpoint = emulator.breakpoints.has(cur);
      lines.push(line);
      cur = (cur + line.bytes.length) & 0xffff;
    }
    setDisassembly(lines);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCpuState(emulator.cpu.getState());
    }, 150);
    return () => clearInterval(interval);
  }, [emulator]);

  useEffect(() => {
    generateDisassembly(emulator.cpu.pc);
  }, [emulator, emulator.cpu.pc]);

  const handleStep = () => {
    emulator.stepInstruction();
    refreshState();
  };

  const handleToggleBreak = (addr: number) => {
    emulator.toggleBreakpoint(addr);
    refreshState();
  };

  const handleJump = () => {
    const addr = parseInt(jumpAddr, 16);
    if (!isNaN(addr)) {
      generateDisassembly(addr);
    }
  };

  const formatHex2 = (v: number) => v.toString(16).toUpperCase().padStart(2, '0');
  const formatHex4 = (v: number) => v.toString(16).toUpperCase().padStart(4, '0');

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 font-mono text-stone-200 text-xs shadow-xl flex flex-col space-y-4">
      {/* Top Controls Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-stone-800 pb-3 gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-amber-500 font-bold text-sm">65C02 CPU DEBUGGER</span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            emulator.isPaused ? 'bg-amber-900/60 text-amber-300' : 'bg-green-900/60 text-green-300'
          }`}>
            {emulator.isPaused ? 'PAUSED / BREAKPOINT' : 'RUNNING'}
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => { emulator.togglePause(); refreshState(); }}
            className={`px-2.5 py-1 rounded font-bold flex items-center gap-1 transition ${
              emulator.isPaused
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            {emulator.isPaused ? <><Play className="w-3 h-3" /> Resume</> : <><Pause className="w-3 h-3" /> Pause</>}
          </button>

          <button
            onClick={handleStep}
            disabled={!emulator.isPaused}
            className="px-2.5 py-1 rounded bg-stone-700 hover:bg-stone-600 text-stone-200 font-bold flex items-center gap-1 disabled:opacity-40"
            title="Step One Instruction"
          >
            <StepForward className="w-3 h-3" /> Step
          </button>

          <button
            onClick={() => { emulator.stepInstruction(); emulator.stepInstruction(); refreshState(); }}
            disabled={!emulator.isPaused}
            className="px-2.5 py-1 rounded bg-stone-700 hover:bg-stone-600 text-stone-200 font-bold flex items-center gap-1 disabled:opacity-40"
            title="Step Over"
          >
            <SkipForward className="w-3 h-3" /> Step Over
          </button>
        </div>
      </div>

      {/* Registers Grid & Status Flags */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-stone-950 p-3 rounded-lg border border-stone-800/80">
        <div className="flex flex-col space-y-1">
          <span className="text-stone-400 text-[11px]">Accumulator (A)</span>
          <span className="text-base font-bold text-amber-400">${formatHex2(cpuState.a)} <span className="text-stone-500 text-xs">({cpuState.a})</span></span>
        </div>

        <div className="flex flex-col space-y-1">
          <span className="text-stone-400 text-[11px]">X & Y Indexes</span>
          <span className="text-base font-bold text-amber-400">
            X:${formatHex2(cpuState.x)} <span className="text-stone-300">Y:${formatHex2(cpuState.y)}</span>
          </span>
        </div>

        <div className="flex flex-col space-y-1">
          <span className="text-stone-400 text-[11px]">Program Counter & SP</span>
          <span className="text-base font-bold text-green-400">
            PC:${formatHex4(cpuState.pc)} <span className="text-stone-400 text-xs">SP:${formatHex2(cpuState.sp)}</span>
          </span>
        </div>

        <div className="flex flex-col space-y-1">
          <span className="text-stone-400 text-[11px]">Status Flags (NV-BDIZC)</span>
          <div className="flex space-x-1 font-bold text-[11px]">
            <span className={cpuState.status.n ? 'text-amber-400' : 'text-stone-600'}>N</span>
            <span className={cpuState.status.v ? 'text-amber-400' : 'text-stone-600'}>V</span>
            <span className="text-stone-500">1</span>
            <span className={cpuState.status.b ? 'text-amber-400' : 'text-stone-600'}>B</span>
            <span className={cpuState.status.d ? 'text-amber-400' : 'text-stone-600'}>D</span>
            <span className={cpuState.status.i ? 'text-amber-400' : 'text-stone-600'}>I</span>
            <span className={cpuState.status.z ? 'text-amber-400' : 'text-stone-600'}>Z</span>
            <span className={cpuState.status.c ? 'text-amber-400' : 'text-stone-600'}>C</span>
          </div>
        </div>
      </div>

      {/* Disassembly View */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between text-stone-400 text-[11px]">
          <span>LIVE DISASSEMBLY (Click dot to toggle breakpoint)</span>
          <div className="flex items-center space-x-1.5">
            <span>Jump to: $</span>
            <input
              type="text"
              value={jumpAddr}
              onChange={(e) => setJumpAddr(e.target.value)}
              className="bg-stone-800 border border-stone-700 px-1.5 py-0.5 rounded text-amber-300 w-16 text-center"
              maxLength={4}
            />
            <button
              onClick={handleJump}
              className="px-2 py-0.5 rounded bg-stone-700 hover:bg-stone-600 text-stone-200"
            >
              Go
            </button>
          </div>
        </div>

        <div className="bg-stone-950 border border-stone-800 rounded-lg p-2 max-h-56 overflow-y-auto space-y-1 font-mono text-xs">
          {disassembly.map((line, idx) => {
            const isCurrentPC = line.address === cpuState.pc;
            return (
              <div
                key={idx}
                className={`flex items-center justify-between px-2 py-0.5 rounded transition ${
                  isCurrentPC ? 'bg-amber-950/80 border border-amber-600/60 text-amber-200 font-bold' : 'hover:bg-stone-900 text-stone-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleToggleBreak(line.address)}
                    className="text-stone-600 hover:text-red-400"
                  >
                    <CircleDot className={`w-3.5 h-3.5 ${line.isBreakpoint ? 'text-red-500 fill-red-500' : ''}`} />
                  </button>
                  <span className={isCurrentPC ? 'text-green-400' : 'text-stone-500'}>${formatHex4(line.address)}:</span>
                  <span className="text-stone-400 text-[11px] w-16">
                    {line.bytes.map((b) => formatHex2(b)).join(' ')}
                  </span>
                  <span className="font-bold text-amber-300 w-12">{line.opcode}</span>
                  <span className="text-stone-200">{line.operands}</span>
                </div>

                {line.label && (
                  <span className="text-[10px] bg-stone-800 text-stone-400 px-1.5 py-0.5 rounded">
                    {line.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
