// ============================================================================
// Copyright (c) 2026 Ian Ohlander. All rights reserved.
// Apple //c Ultra Architecture - Virtual Motherboard Slot & Card Studio
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Apple2cUltra } from '../../emulator/apple2c';
import { PrinterCard } from '../../emulator/slots/cards/PrinterCard';
import { CustomScriptableCard } from '../../emulator/slots/cards/CustomScriptableCard';
import {
  Layers,
  Printer,
  Clock,
  Play,
  Copy,
  Download,
  Trash2,
  Code,
  Sparkles
} from 'lucide-react';

interface SlotStudioProps {
  emulator: Apple2cUltra;
}

const PRESET_SCRIPTS: Record<string, { name: string; code: string }> = {
  weather: {
    name: '🌤️ IoT Weather Station (Temp, Humidity, Pressure, Wind)',
    code: `// Preset: IoT Weather Station (Slot 3 @ $C0B0)
// Simulates live telemetry from environmental sensors
card.temperature = 74; // deg F
card.humidity = 48;    // % RH
card.pressure = 1013;  // hPa (Sea-level standard)
card.windSpeed = 12;   // mph
card.rainGauge = 5;    // hundredths of an inch (0.05 in)

// Simulate fluctuating sensor readings
setInterval(() => {
  card.temperature = 70 + Math.floor(Math.random() * 8);
  card.humidity = 45 + Math.floor(Math.random() * 10);
  card.windSpeed = 10 + Math.floor(Math.random() * 6);
}, 5000);

card.onReadHandler = (offset) => {
  if (offset === 0x00) return card.temperature & 0xFF;        // $C0B0: Temp
  if (offset === 0x01) return card.humidity & 0xFF;           // $C0B1: Humidity
  if (offset === 0x02) return (card.pressure * 10) & 0xFF;    // $C0B2: Press Low
  if (offset === 0x03) return ((card.pressure * 10) >> 8) & 0xFF; // $C0B3: Press High
  if (offset === 0x04) return card.windSpeed & 0xFF;          // $C0B4: Wind Speed
  if (offset === 0x05) return card.rainGauge & 0xFF;          // $C0B5: Rain Gauge
  if (offset === 0x07) return 0x80; // $C0B7: Status (Bit 7 = Data Ready)
  return 0x00;
};`
  },
  serial: {
    name: '🔌 Web Serial Arduino / ESP32 Hardware Sensor Bridge',
    code: `// Preset: Web Serial Physical Hardware Bridge (Slot 3 @ $C0B0)
// Connects real USB microcontrollers (Arduino / ESP32)
card.sensorValue = 72;

card.connectSerial = async () => {
  try {
    if ('serial' in navigator) {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600 });
      const reader = port.readable.getReader();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value && value.length > 0) card.sensorValue = value[0];
      }
    }
  } catch (err) {
    console.warn('Serial connection canceled or unavailable', err);
  }
};

card.onReadHandler = (offset) => {
  if (offset === 0x00) return card.sensorValue;
  return 0;
};`
  },
  crypto: {
    name: '📈 Live Bitcoin / Crypto Price Ticker (REST API)',
    code: `// Preset: Live Bitcoin / Crypto Price Ticker (Slot 3 @ $C0B0)
card.bitcoinPrice = 95000;

setInterval(async () => {
  try {
    const res = await fetch('https://api.coindesk.com/v1/bpi/currentprice.json');
    const data = await res.json();
    card.bitcoinPrice = Math.floor(data.bpi.USD.rate_float);
  } catch (e) {}
}, 30000);

card.onReadHandler = (offset) => {
  if (offset === 0x00) return card.bitcoinPrice & 0xFF;
  if (offset === 0x01) return (card.bitcoinPrice >> 8) & 0xFF;
  if (offset === 0x02) return (card.bitcoinPrice >> 16) & 0xFF;
  return 0x00;
};`
  },
  math: {
    name: '🧮 32-Bit Math Hardware Co-Processor (Fast Multiply & Divide)',
    code: `// Preset: 32-Bit Math Hardware Co-Processor (Slot 3 @ $C0B0)
card.opA = 0; card.opB = 0; card.result = 0;

card.onWriteHandler = (offset, val) => {
  if (offset === 0x00) card.opA = (card.opA & 0xFF00) | val;
  if (offset === 0x01) card.opA = (card.opA & 0x00FF) | (val << 8);
  if (offset === 0x02) card.opB = (card.opB & 0xFF00) | val;
  if (offset === 0x03) {
    card.opB = (card.opB & 0x00FF) | (val << 8);
    card.result = card.opA * card.opB;
  }
};

card.onReadHandler = (offset) => {
  if (offset === 0x04) return card.result & 0xFF;
  if (offset === 0x05) return (card.result >> 8) & 0xFF;
  if (offset === 0x06) return (card.result >> 16) & 0xFF;
  if (offset === 0x07) return (card.result >> 24) & 0xFF;
  return 0;
};`
  }
};

export const SlotStudio: React.FC<SlotStudioProps> = ({ emulator }) => {
  const [tick, setTick] = useState(0);
  const triggerRefresh = () => setTick(t => t + 1);

  const [printerPaper, setPrinterPaper] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('weather');
  const [customJsCode, setCustomJsCode] = useState(PRESET_SCRIPTS.weather.code);

  const [activeToolkit, setActiveToolkit] = useState<'printer' | 'custom' | 'clock'>('printer');

  useEffect(() => {
    const printer = emulator.slotManager.getCard(1) as PrinterCard;
    if (printer) {
      printer.onPrintChar = () => {
        setPrinterPaper(printer.paperBuffer);
      };
      setPrinterPaper(printer.paperBuffer);
    }
  }, [emulator]);

  const handleToggleSlot = (slotNum: number) => {
    emulator.slotManager.toggleCard(slotNum);
    triggerRefresh();
  };

  const handleClearPrinter = () => {
    const printer = emulator.slotManager.getCard(1) as PrinterCard;
    if (printer) {
      printer.clearPaper();
      setPrinterPaper('');
    }
  };

  const handleCopyPrinter = () => {
    navigator.clipboard.writeText(printerPaper);
  };

  const handleDownloadPrinter = () => {
    const blob = new Blob([printerPaper], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'apple2-printer-output.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSelectPreset = (key: string) => {
    setSelectedPreset(key);
    if (PRESET_SCRIPTS[key]) {
      setCustomJsCode(PRESET_SCRIPTS[key].code);
    }
  };

  const handleApplyCustomCard = () => {
    const card = emulator.slotManager.getCard(3) as CustomScriptableCard;
    if (card) {
      try {
        const fn = new Function('card', customJsCode);
        fn(card);
        alert('Custom Card Script successfully applied to Slot 3 ($C0B0)!');
      } catch (err: any) {
        alert('Script Error: ' + err.message);
      }
    }
  };

  const slots = emulator.slotManager.getAllSlots();

  return (
    <div className="bg-[#12161a] border border-[#2a3642] rounded-xl p-5 font-mono text-gray-200 space-y-6 text-xs">
      
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center border-b border-[#2a3642] pb-3 gap-2">
        <div>
          <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
            <Layers className="w-4 h-4" />
            MOTHERBOARD PERIPHERAL EXPANSION BAY (SLOTS 1–7)
          </h3>
          <p className="text-xs text-gray-400">
            Plug, unplug, inspect registers, or script custom hardware cards for the 50-pin Apple bus.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="docs/developer/custom-peripheral-cards.html"
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1 bg-[#1c222b] hover:bg-[#252e3b] text-amber-400 rounded border border-[#2a3642] transition"
          >
            📖 Card Developer Guide →
          </a>
        </div>
      </div>

      {/* 7-Slot Motherboard Rack */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {slots.map(({ slot, card }) => {
          if (!card) return null;
          const isPlugged = card.isPlugged;
          const diagnostics = card.getDiagnostics ? card.getDiagnostics() : {};

          return (
            <div
              key={slot}
              className={`p-3.5 rounded-lg border ${
                isPlugged ? 'bg-[#0d1117] border-[#2a3642]' : 'bg-[#080b0e] border-[#1a222c] opacity-60'
              } space-y-2.5 transition`}
            >
              <div className={`flex justify-between items-center border-b ${isPlugged ? 'border-[#2a3642]' : 'border-[#1a222c]'} pb-1.5`}>
                <div className={`flex items-center gap-1.5 font-bold ${isPlugged ? 'text-amber-400' : 'text-gray-500'}`}>
                  <span className="text-base">{card.icon}</span>
                  <span>SLOT {slot}: $C{slot}00 / $C0{8 + slot}0</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isPlugged
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-stone-900 text-stone-500 border border-stone-800'
                  }`}
                >
                  {isPlugged ? 'PLUGGED' : 'EMPTY'}
                </span>
              </div>

              <div>
                <div className={`font-bold ${isPlugged ? 'text-white' : 'text-gray-500'} text-xs`}>{card.name}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{card.description}</div>
              </div>

              {/* Live Diagnostics */}
              {isPlugged && Object.keys(diagnostics).length > 0 && (
                <div className="p-2 bg-[#06080b] rounded border border-[#161f2c] text-[10px] space-y-0.5">
                  {Object.entries(diagnostics).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-gray-400">
                      <span>{k}:</span>
                      <span className="text-cyan-300 font-bold">{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center pt-1">
                <span className={`text-[10px] font-mono ${isPlugged ? 'text-emerald-400' : 'text-stone-600'}`}>
                  {isPlugged ? '● Bus Connected' : '○ High-Z Float'}
                </span>
                <button
                  onClick={() => handleToggleSlot(slot)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                    isPlugged
                      ? 'bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800'
                      : 'bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-700'
                  }`}
                >
                  {isPlugged ? '⏏️ Unplug' : '🔌 Plug In'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Toolkits Navigation */}
      <div className="border-t border-[#2a3642] pt-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveToolkit('printer')}
            className={`px-3 py-1.5 rounded font-bold flex items-center gap-1.5 transition ${
              activeToolkit === 'printer' ? 'bg-amber-600 text-white' : 'bg-[#161b22] text-gray-400 hover:text-white'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            Virtual Printer Paper Console (Slot 1)
          </button>
          <button
            onClick={() => setActiveToolkit('custom')}
            className={`px-3 py-1.5 rounded font-bold flex items-center gap-1.5 transition ${
              activeToolkit === 'custom' ? 'bg-cyan-600 text-white' : 'bg-[#161b22] text-gray-400 hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            Custom JS Card Sandbox (Slot 3)
          </button>
          <button
            onClick={() => setActiveToolkit('clock')}
            className={`px-3 py-1.5 rounded font-bold flex items-center gap-1.5 transition ${
              activeToolkit === 'clock' ? 'bg-purple-600 text-white' : 'bg-[#161b22] text-gray-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            ProDOS Clock & Web MIDI (Slots 2 & 4)
          </button>
        </div>

        {/* Toolkit 1: Printer Console */}
        {activeToolkit === 'printer' && (
          <div className="p-4 bg-[#0d1117] rounded-lg border border-[#2a3642] space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-amber-400 font-bold block">Tractor-Feed Continuous Paper Feed:</span>
                <span className="text-gray-400 text-[11px]">Captures all characters sent via BASIC <code>PR#1</code> or machine code <code>JSR $C100</code>.</span>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={handleCopyPrinter}
                  className="px-2.5 py-1 bg-[#1f2633] hover:bg-[#2d3748] text-gray-200 rounded border border-[#3b475d] flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
                <button
                  onClick={handleDownloadPrinter}
                  className="px-2.5 py-1 bg-[#1f2633] hover:bg-[#2d3748] text-emerald-400 rounded border border-[#3b475d] flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> Download .txt
                </button>
                <button
                  onClick={handleClearPrinter}
                  className="px-2.5 py-1 bg-red-950/80 hover:bg-red-900 text-red-300 rounded border border-red-800 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              </div>
            </div>

            <textarea
              readOnly
              rows={8}
              value={printerPaper || '*** PRINTER IDLE: Type PR#1 in BASIC and print text to capture paper output ***'}
              className="w-full bg-[#05070a] border border-[#161f2c] rounded p-3 text-xs text-amber-300 font-mono focus:outline-none"
            />
          </div>
        )}

        {/* Toolkit 2: Custom JS Sandbox */}
        {activeToolkit === 'custom' && (
          <div className="p-4 bg-[#0d1117] rounded-lg border border-[#2a3642] space-y-3">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <div>
                <span className="text-cyan-400 font-bold block">JavaScript Custom Card Sandbox (Slot 3):</span>
                <span className="text-gray-400 text-[11px]">Script custom I/O registers ($C0B0-$C0BF) and slot ROM ($C300).</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedPreset}
                  onChange={e => handleSelectPreset(e.target.value)}
                  className="bg-[#161b22] text-amber-300 border border-[#2a3642] rounded px-2.5 py-1 text-xs font-mono"
                >
                  {Object.entries(PRESET_SCRIPTS).map(([k, v]) => (
                    <option key={k} value={k}>{v.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleApplyCustomCard}
                  className="px-3.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded shadow flex items-center gap-1"
                >
                  <Play className="w-3 h-3" /> Apply to Slot 3
                </button>
              </div>
            </div>

            <textarea
              rows={9}
              value={customJsCode}
              onChange={e => setCustomJsCode(e.target.value)}
              className="w-full bg-[#05070a] border border-[#161f2c] rounded p-3 text-xs text-cyan-300 font-mono focus:outline-none"
            />
          </div>
        )}

        {/* Toolkit 3: ProDOS Clock & Web MIDI */}
        {activeToolkit === 'clock' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#0d1117] rounded-lg border border-[#2a3642] space-y-2">
              <span className="text-purple-400 font-bold block">⏰ Thunderclock RTC (Slot 4):</span>
              <p className="text-gray-300 text-[11px]">
                Active clock driver serving current host computer time to ProDOS file creation timestamps.
              </p>
              <div className="p-2.5 bg-[#06080b] rounded border border-[#161f2c] space-y-1 text-gray-300 text-[11px]">
                <div>Current Time: <span className="text-purple-300 font-bold">{new Date().toLocaleTimeString()}</span></div>
                <div>Current Date: <span className="text-purple-300 font-bold">{new Date().toLocaleDateString()}</span></div>
                <div>ProDOS Vector: <span className="text-emerald-400 font-bold">$C400 (Signature $08,$28,$58,$70)</span></div>
              </div>
            </div>

            <div className="p-4 bg-[#0d1117] rounded-lg border border-[#2a3642] space-y-2">
              <span className="text-pink-400 font-bold block">🎹 Web MIDI Interface (Slot 2):</span>
              <p className="text-gray-300 text-[11px]">
                Connects 65C02 MIDI sequencers (e.g. Master Tracks) to modern USB MIDI keyboards and DAW software.
              </p>
              <div className="p-2.5 bg-[#06080b] rounded border border-[#161f2c] space-y-1 text-gray-300 text-[11px]">
                <div>Web MIDI API: <span className="text-emerald-400 font-bold">READY (6850 ACIA @ $C0A0)</span></div>
                <div>Transmission: <span className="text-cyan-300 font-bold">31.25 kBaud Serial Stream</span></div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
