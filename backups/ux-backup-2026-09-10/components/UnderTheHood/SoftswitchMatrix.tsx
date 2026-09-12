import React, { useState, useEffect } from 'react';
import { Apple2cUltra } from '../../emulator/apple2c';
import { ToggleLeft, ToggleRight, Sliders } from 'lucide-react';

interface SoftswitchMatrixProps {
  emulator: Apple2cUltra;
}

export const SoftswitchMatrix: React.FC<SoftswitchMatrixProps> = ({ emulator }) => {
  const [sw, setSw] = useState(emulator.mmu.sw);

  useEffect(() => {
    const interval = setInterval(() => {
      setSw({ ...emulator.mmu.sw });
    }, 150);
    return () => clearInterval(interval);
  }, [emulator]);

  const toggleSwitch = (name: keyof typeof sw) => {
    // Perform simulated softswitch access
    switch (name) {
      case 'store80':
        emulator.mmu.write(sw.store80 ? 0xc000 : 0xc001, 0);
        break;
      case 'ramrd':
        emulator.mmu.write(sw.ramrd ? 0xc002 : 0xc003, 0);
        break;
      case 'ramwrt':
        emulator.mmu.write(sw.ramwrt ? 0xc004 : 0xc005, 0);
        break;
      case 'altzp':
        emulator.mmu.write(sw.altzp ? 0xc008 : 0xc009, 0);
        break;
      case 'col80':
        emulator.mmu.write(sw.col80 ? 0xc00c : 0xc00d, 0);
        break;
      case 'altCharset':
        emulator.mmu.write(sw.altCharset ? 0xc00e : 0xc00f, 0);
        break;
      case 'text':
        emulator.mmu.write(sw.text ? 0xc050 : 0xc051, 0);
        break;
      case 'mixed':
        emulator.mmu.write(sw.mixed ? 0xc052 : 0xc053, 0);
        break;
      case 'page2':
        emulator.mmu.write(sw.page2 ? 0xc054 : 0xc055, 0);
        break;
      case 'hires':
        emulator.mmu.write(sw.hires ? 0xc056 : 0xc057, 0);
        break;
      case 'dhires':
        emulator.mmu.write(sw.dhires ? 0xc05e : 0xc05f, 0);
        break;
    }
    setSw({ ...emulator.mmu.sw });
  };

  const switchGroups = [
    {
      category: 'Memory Management (MMU)',
      items: [
        { key: 'store80', label: '80STORE ($C000/1)', desc: 'Map Page2 to Aux Video' },
        { key: 'ramrd', label: 'RAMRD ($C002/3)', desc: 'Read $0200-$BFFF from Aux' },
        { key: 'ramwrt', label: 'RAMWRT ($C004/5)', desc: 'Write $0200-$BFFF to Aux' },
        { key: 'altzp', label: 'ALTZP ($C008/9)', desc: 'Aux Zero Page & Stack' },
        { key: 'intcxrom', label: 'INTCXROM ($C006/7)', desc: 'Internal Peripheral ROM' },
        { key: 'slotc3rom', label: 'SLOTC3ROM ($C00A/B)', desc: 'Slot 3 80-Col ROM' },
      ]
    },
    {
      category: 'Display & Graphics Softswitches',
      items: [
        { key: 'text', label: 'TEXT ($C050/1)', desc: 'Graphics vs Text Mode' },
        { key: 'mixed', label: 'MIXED ($C052/3)', desc: '4 Lines of Bottom Text' },
        { key: 'page2', label: 'PAGE2 ($C054/5)', desc: 'Select Video Page 1 / 2' },
        { key: 'hires', label: 'HIRES ($C056/7)', desc: 'Hi-Res vs Lo-Res Mode' },
        { key: 'col80', label: '80COL ($C00C/D)', desc: '80-Column Text Display' },
        { key: 'dhires', label: 'DHIRES ($C05E/F)', desc: 'Double Hi-Res 560x192' },
      ]
    },
    {
      category: 'Language Card ($D000-$FFFF)',
      items: [
        { key: 'lcBank2', label: 'BANK2 ($C083/B)', desc: 'Bank 2 vs Bank 1 $D000' },
        { key: 'lcReadRam', label: 'READ RAM ($C080/8)', desc: 'Read RAM instead of ROM' },
        { key: 'lcWriteRam', label: 'WRITE RAM ($C081/9)', desc: 'RAM Write Protection' },
      ]
    }
  ];

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 font-mono text-stone-200 text-xs shadow-xl flex flex-col space-y-4">
      <div className="flex items-center justify-between border-b border-stone-800 pb-3">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-amber-500" />
          <span className="text-amber-500 font-bold text-sm">SOFTSWITCH MATRIX ($C000-$C0FF)</span>
        </div>
        <span className="text-stone-400 text-[11px]">Click to Toggle Softswitch State</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {switchGroups.map((group, gIdx) => (
          <div key={gIdx} className="bg-stone-950 p-3 rounded-lg border border-stone-800 flex flex-col space-y-2">
            <span className="font-bold text-amber-400 text-[11px] border-b border-stone-800 pb-1">
              {group.category}
            </span>

            <div className="flex flex-col space-y-1.5">
              {group.items.map((item) => {
                const isActive = !!sw[item.key as keyof typeof sw];
                return (
                  <button
                    key={item.key}
                    onClick={() => toggleSwitch(item.key as keyof typeof sw)}
                    className={`flex items-center justify-between p-2 rounded border transition text-left ${
                      isActive
                        ? 'bg-amber-950/60 border-amber-600/70 text-amber-200 shadow-sm'
                        : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-[11px]">{item.label}</span>
                      <span className="text-[9px] text-stone-500">{item.desc}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <span className={`text-[10px] font-bold ${isActive ? 'text-amber-400' : 'text-stone-600'}`}>
                        {isActive ? 'ON' : 'OFF'}
                      </span>
                      {isActive ? (
                        <ToggleRight className="w-5 h-5 text-amber-400" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-stone-600" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
