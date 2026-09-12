import React, { useState, useEffect } from 'react';
import { Apple2cUltra } from '../../emulator/apple2c';

interface MemoryHexViewerProps {
  emulator: Apple2cUltra;
}

export const MemoryHexViewer: React.FC<MemoryHexViewerProps> = ({ emulator }) => {
  const [selectedBank, setSelectedBank] = useState<'main' | 'aux' | 'slinky' | 'lc1' | 'lc2' | 'rom'>('main');
  const [startAddress, setStartAddress] = useState(0x2000);
  const [addressInput, setAddressInput] = useState('2000');
  const [memoryBytes, setMemoryBytes] = useState<number[]>([]);
  const [editAddr, setEditAddr] = useState<number | null>(null);
  const [editVal, setEditVal] = useState<string>('');

  const numRows = 12;
  const bytesPerRow = 16;

  const refreshMemory = () => {
    const bytes: number[] = [];
    let ram: Uint8Array = emulator.mmu.mainRAM;

    if (selectedBank === 'aux') ram = emulator.mmu.auxRAM;
    else if (selectedBank === 'slinky') ram = emulator.mmu.slinkyRAM;
    else if (selectedBank === 'lc1') ram = emulator.mmu.lcMainBank1;
    else if (selectedBank === 'lc2') ram = emulator.mmu.lcMainBank2;
    else if (selectedBank === 'rom') ram = emulator.mmu.rom;

    const maxLen = ram.length;
    for (let i = 0; i < numRows * bytesPerRow; i++) {
      const idx = (startAddress + i) % maxLen;
      bytes.push(ram[idx] || 0);
    }
    setMemoryBytes(bytes);
  };

  useEffect(() => {
    refreshMemory();
    const interval = setInterval(refreshMemory, 200);
    return () => clearInterval(interval);
  }, [emulator, selectedBank, startAddress]);

  const handleJump = () => {
    const addr = parseInt(addressInput, 16);
    if (!isNaN(addr)) {
      setStartAddress(addr);
    }
  };

  const handleByteClick = (byteOffset: number, currentVal: number) => {
    const targetAddr = (startAddress + byteOffset) & 0xffff;
    setEditAddr(targetAddr);
    setEditVal(currentVal.toString(16).toUpperCase().padStart(2, '0'));
  };

  const handleSaveByte = () => {
    if (editAddr === null) return;
    const val = parseInt(editVal, 16);
    if (!isNaN(val)) {
      emulator.mmu.write(editAddr, val & 0xff);
    }
    setEditAddr(null);
    refreshMemory();
  };

  const formatHex2 = (v: number) => (v ?? 0).toString(16).toUpperCase().padStart(2, '0');
  const formatHex4 = (v: number) => (v ?? 0).toString(16).toUpperCase().padStart(4, '0');

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 font-mono text-stone-200 text-xs shadow-xl flex flex-col space-y-3">
      {/* Header & Bank Selector */}
      <div className="flex flex-wrap items-center justify-between border-b border-stone-800 pb-3 gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-amber-500 font-bold text-sm">MEMORY HEX INSPECTOR</span>
          <span className="text-stone-400 text-[11px]">1MB+ Bank Switcher</span>
        </div>

        <div className="flex items-center space-x-1">
          {[
            { id: 'main', label: 'Main 64K' },
            { id: 'aux', label: 'Aux 64K' },
            { id: 'slinky', label: 'Slinky 1MB' },
            { id: 'lc1', label: 'LC Bank 1' },
            { id: 'lc2', label: 'LC Bank 2' },
            { id: 'rom', label: 'ROM 32K' },
          ].map((b) => (
            <button
              key={b.id}
              onClick={() => { setSelectedBank(b.id as typeof selectedBank); setStartAddress(0); }}
              className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                selectedBank === b.id
                  ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                  : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Jump Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-stone-950 p-2 rounded-lg border border-stone-800 text-[11px]">
        <div className="flex items-center space-x-1">
          <span className="text-stone-400">Jump:</span>
          {[
            { label: '$0000 Zero', addr: 0x0000 },
            { label: '$0100 Stack', addr: 0x0100 },
            { label: '$0400 Text1', addr: 0x0400 },
            { label: '$2000 HGR1', addr: 0x2000 },
            { label: '$4000 HGR2', addr: 0x4000 },
            { label: '$F800 Reset', addr: 0xf800 },
          ].map((j) => (
            <button
              key={j.label}
              onClick={() => { setStartAddress(j.addr); setAddressInput(j.addr.toString(16).toUpperCase()); }}
              className="px-1.5 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700"
            >
              {j.label}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-1.5">
          <span className="text-stone-400">$</span>
          <input
            type="text"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            className="bg-stone-800 border border-stone-700 px-1.5 py-0.5 rounded text-amber-300 w-16 text-center"
            maxLength={4}
          />
          <button
            onClick={handleJump}
            className="px-2 py-0.5 rounded bg-amber-700 hover:bg-amber-600 text-white font-bold"
          >
            Seek
          </button>
        </div>
      </div>

      {/* Hex Dump Grid */}
      <div className="bg-stone-950 p-3 rounded-lg border border-stone-800 font-mono text-xs overflow-x-auto">
        <div className="grid grid-cols-[80px_1fr_140px] gap-2 font-bold text-stone-500 border-b border-stone-800 pb-1 mb-1 text-[11px]">
          <span>ADDR</span>
          <span>00 01 02 03 04 05 06 07  08 09 0A 0B 0C 0D 0E 0F</span>
          <span>ASCII</span>
        </div>

        {Array.from({ length: numRows }).map((_, rIdx) => {
          const rowAddr = (startAddress + rIdx * bytesPerRow) & 0xffff;
          const rowSlice = memoryBytes.slice(rIdx * bytesPerRow, (rIdx + 1) * bytesPerRow);

          return (
            <div key={rIdx} className="grid grid-cols-[80px_1fr_140px] gap-2 items-center hover:bg-stone-900/60 py-0.5 rounded px-1">
              <span className="text-amber-500 font-bold">${formatHex4(rowAddr)}:</span>

              <div className="flex space-x-1.5">
                {rowSlice.map((byte, cIdx) => {
                  const currentByteAddr = (rowAddr + cIdx) & 0xffff;
                  const isEditing = editAddr === currentByteAddr;

                  return isEditing ? (
                    <input
                      key={cIdx}
                      type="text"
                      value={editVal}
                      onChange={(e) => setEditVal(e.target.value)}
                      onBlur={handleSaveByte}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveByte()}
                      autoFocus
                      className="w-5 bg-amber-500 text-stone-950 font-black text-center rounded px-0 py-0"
                      maxLength={2}
                    />
                  ) : (
                    <span
                      key={cIdx}
                      onClick={() => handleByteClick(rIdx * bytesPerRow + cIdx, byte)}
                      className={`cursor-pointer hover:text-amber-300 hover:underline ${
                        byte === 0 ? 'text-stone-600' : 'text-stone-200'
                      } ${cIdx === 7 ? 'mr-1' : ''}`}
                    >
                      {formatHex2(byte)}
                    </span>
                  );
                })}
              </div>

              {/* ASCII representation */}
              <span className="text-stone-400 tracking-wider text-[11px]">
                {rowSlice.map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.')).join('')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
