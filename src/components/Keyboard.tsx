import React, { useEffect, useState } from 'react';
import { Apple2cUltra } from '../emulator/apple2c';

interface KeyboardProps {
  emulator: Apple2cUltra;
}

export const Keyboard: React.FC<KeyboardProps> = ({ emulator }) => {
  const [openApple, setOpenApple] = useState(false);
  const [closedApple, setClosedApple] = useState(false);
  const [capsLock, setCapsLock] = useState(true);
  const [col80, setCol80] = useState(false);

  useEffect(() => {
    emulator.mmu.openAppleKey = openApple;
  }, [emulator, openApple]);

  useEffect(() => {
    emulator.mmu.closedAppleKey = closedApple;
  }, [emulator, closedApple]);

  useEffect(() => {
    emulator.mmu.sw.col80 = col80;
  }, [emulator, col80]);

  // Physical Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in code editors or input text areas
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'Alt') {
        setOpenApple(true);
        return;
      }
      if (e.key === 'Meta' || e.key === 'Control') {
        setClosedApple(true);
        return;
      }

      let ascii = 0;
      if (e.key === 'Enter') {
        ascii = 0x0d; // Return / CR
      } else if (e.key === 'Backspace') {
        ascii = 0x08; // Left arrow / Backspace
      } else if (e.key === 'Tab') {
        e.preventDefault();
        ascii = 0x09;
      } else if (e.key === 'Escape') {
        ascii = 0x1b;
      } else if (e.key === 'ArrowLeft') {
        ascii = 0x08;
      } else if (e.key === 'ArrowRight') {
        ascii = 0x15;
      } else if (e.key === 'ArrowUp') {
        ascii = 0x0b;
      } else if (e.key === 'ArrowDown') {
        ascii = 0x0a;
      } else if (e.key.length === 1) {
        let char = e.key;
        if (capsLock && char >= 'a' && char <= 'z') {
          char = char.toUpperCase();
        }
        ascii = char.charCodeAt(0);
      }

      if (ascii > 0) {
        emulator.mmu.setKey(ascii);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        setOpenApple(false);
      }
      if (e.key === 'Meta' || e.key === 'Control') {
        setClosedApple(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [emulator, capsLock]);

  const sendKey = (ascii: number) => {
    emulator.mmu.setKey(ascii);
  };

  const keyRows = [
    [
      { label: 'ESC', code: 0x1b, w: 'w-10' },
      { label: '1 !', code: 0x31 }, { label: '2 @', code: 0x32 }, { label: '3 #', code: 0x33 },
      { label: '4 $', code: 0x34 }, { label: '5 %', code: 0x35 }, { label: '6 ^', code: 0x36 },
      { label: '7 &', code: 0x37 }, { label: '8 *', code: 0x38 }, { label: '9 (', code: 0x39 },
      { label: '0 )', code: 0x30 }, { label: '- _', code: 0x2d }, { label: '= +', code: 0x3d },
      { label: 'DELETE', code: 0x7f, w: 'w-14' }
    ],
    [
      { label: 'TAB', code: 0x09, w: 'w-12' },
      { label: 'Q', code: 0x51 }, { label: 'W', code: 0x57 }, { label: 'E', code: 0x45 },
      { label: 'R', code: 0x52 }, { label: 'T', code: 0x54 }, { label: 'Y', code: 0x59 },
      { label: 'U', code: 0x55 }, { label: 'I', code: 0x49 }, { label: 'O', code: 0x4f },
      { label: 'P', code: 0x50 }, { label: '[ {', code: 0x5b }, { label: '] }', code: 0x5d },
      { label: '\\ |', code: 0x5c, w: 'w-12' }
    ],
    [
      { label: 'CONTROL', code: 0x00, w: 'w-14' },
      { label: 'A', code: 0x41 }, { label: 'S', code: 0x53 }, { label: 'D', code: 0x44 },
      { label: 'F', code: 0x46 }, { label: 'G', code: 0x47 }, { label: 'H', code: 0x48 },
      { label: 'J', code: 0x4a }, { label: 'K', code: 0x4b }, { label: 'L', code: 0x4c },
      { label: '; :', code: 0x3b }, { label: '\' "', code: 0x27 },
      { label: 'RETURN', code: 0x0d, w: 'w-16', highlight: true }
    ],
    [
      { label: 'SHIFT', code: 0x00, w: 'w-16' },
      { label: 'Z', code: 0x5a }, { label: 'X', code: 0x58 }, { label: 'C', code: 0x43 },
      { label: 'V', code: 0x56 }, { label: 'B', code: 0x42 }, { label: 'N', code: 0x4e },
      { label: 'M', code: 0x4d }, { label: ', <', code: 0x2c }, { label: '. >', code: 0x2e },
      { label: '/ ?', code: 0x2f },
      { label: 'SHIFT', code: 0x00, w: 'w-20' }
    ]
  ];

  return (
    <div className="bg-[#D8D2BA] border-4 border-[#BDB59B] rounded-2xl p-4 shadow-xl max-w-4xl w-full text-stone-800 font-mono select-none">
      {/* Function Toggle Switches */}
      <div className="flex items-center justify-between mb-3 px-2 border-b border-[#C3BCA2] pb-2 text-xs font-bold">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setCol80(!col80)}
            className={`px-2.5 py-1 rounded border text-[11px] font-bold transition ${
              col80 ? 'bg-amber-700 text-white border-amber-900 shadow-sm' : 'bg-stone-200 text-stone-700 border-stone-400'
            }`}
          >
            40 / 80 Switch: {col80 ? '80 COLUMNS' : '40 COLUMNS'}
          </button>

          <button
            onClick={() => setCapsLock(!capsLock)}
            className={`px-2.5 py-1 rounded border text-[11px] font-bold transition ${
              capsLock ? 'bg-amber-700 text-white border-amber-900 shadow-sm' : 'bg-stone-200 text-stone-700 border-stone-400'
            }`}
          >
            CAPS LOCK: {capsLock ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setOpenApple(!openApple)}
            className={`px-2.5 py-1 rounded border text-[11px] font-bold transition ${
              openApple ? 'bg-red-600 text-white border-red-800' : 'bg-stone-200 text-stone-700 border-stone-400'
            }`}
          >
             Open Apple
          </button>

          <button
            onClick={() => setClosedApple(!closedApple)}
            className={`px-2.5 py-1 rounded border text-[11px] font-bold transition ${
              closedApple ? 'bg-stone-800 text-white border-stone-950' : 'bg-stone-200 text-stone-700 border-stone-400'
            }`}
          >
             Solid Apple
          </button>
        </div>
      </div>

      {/* Keyboard Matrix Keys */}
      <div className="flex flex-col space-y-1.5 bg-[#C0B99F] p-3 rounded-xl border border-[#A79F84] shadow-inner">
        {keyRows.map((row, rIdx) => (
          <div key={rIdx} className="flex justify-center space-x-1">
            {row.map((k, kIdx) => (
              <button
                key={kIdx}
                onClick={() => k.code > 0 && sendKey(k.code)}
                className={`${k.w || 'w-9'} h-9 text-[11px] font-bold rounded bg-[#F4EFE0] hover:bg-amber-100 active:bg-amber-200 border-b-2 border-r-2 border-stone-400 active:border-b active:border-r text-stone-800 shadow-sm flex items-center justify-center transition`}
              >
                {k.label}
              </button>
            ))}
          </div>
        ))}

        {/* Space Bar Row */}
        <div className="flex justify-center space-x-1 pt-1">
          <button
            onClick={() => setOpenApple(!openApple)}
            className={`w-14 h-9 text-[10px] font-bold rounded border-b-2 border-stone-400 shadow-sm flex items-center justify-center ${
              openApple ? 'bg-red-600 text-white' : 'bg-[#EAE4D2] text-stone-700'
            }`}
          >
             OPEN
          </button>

          <button
            onClick={() => sendKey(0x20)}
            className="w-72 h-9 text-xs font-bold rounded bg-[#F4EFE0] hover:bg-amber-100 active:bg-amber-200 border-b-2 border-stone-400 text-stone-700 shadow-sm flex items-center justify-center"
          >
            SPACE BAR
          </button>

          <button
            onClick={() => setClosedApple(!closedApple)}
            className={`w-14 h-9 text-[10px] font-bold rounded border-b-2 border-stone-400 shadow-sm flex items-center justify-center ${
              closedApple ? 'bg-stone-900 text-white' : 'bg-[#EAE4D2] text-stone-700'
            }`}
          >
             SOLID
          </button>

          <button
            onClick={() => sendKey(0x08)}
            className="w-10 h-9 text-[11px] font-bold rounded bg-[#F4EFE0] hover:bg-amber-100 border-b-2 border-stone-400 text-stone-700 shadow-sm flex items-center justify-center"
            title="Left Arrow"
          >
            ←
          </button>
          <button
            onClick={() => sendKey(0x15)}
            className="w-10 h-9 text-[11px] font-bold rounded bg-[#F4EFE0] hover:bg-amber-100 border-b-2 border-stone-400 text-stone-700 shadow-sm flex items-center justify-center"
            title="Right Arrow"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
};
