import React, { useState, useEffect } from 'react';
import { Apple2cUltra } from '../../emulator/apple2c';
import { PrinterCard } from '../../emulator/slots/cards/PrinterCard';
import { Printer, FileText, Download, Copy, Trash2, Zap, Check } from 'lucide-react';

interface PrinterStudioProps {
  emulator: Apple2cUltra;
}

export const PrinterStudio: React.FC<PrinterStudioProps> = ({ emulator }) => {
  const [printMode, setPrintMode] = useState<'dotmatrix' | 'clean'>('dotmatrix');
  const [paperStock, setPaperStock] = useState<'blank' | 'greenbar' | 'white' | 'plain-ivory' | 'ivory'>('blank');
  const [paperContent, setPaperContent] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const getPrinterCard = (): PrinterCard | null => {
    return emulator.slotManager.getCard(1) as PrinterCard | null;
  };

  useEffect(() => {
    const card = getPrinterCard();
    if (card) {
      setPaperContent(card.paperBuffer);
      card.onPrintChar = () => {
        setPaperContent(card.paperBuffer);
      };
    }
  }, [emulator]);

  const handleClear = () => {
    const card = getPrinterCard();
    if (card) {
      card.clearPaper();
      setPaperContent('');
    }
  };

  const handleCopy = async () => {
    if (paperContent) {
      await navigator.clipboard.writeText(paperContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([paperContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `imagewriter-output-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFormFeed = () => {
    const card = getPrinterCard();
    if (card) {
      card.receiveByte(0x0c); // Form Feed
      setPaperContent(card.paperBuffer);
    }
  };

  const handleSelfTest = () => {
    const card = getPrinterCard();
    if (card) {
      const banner = `\n=======================================================\n` +
        `   6502 ULTRA IMAGEWRITER II CENTRONICS SELF-TEST      \n` +
        `=======================================================\n` +
        `DATE: ${new Date().toLocaleDateString()}  TIME: ${new Date().toLocaleTimeString()}\n` +
        `SLOT: 1 (CENTRONICS PARALLEL LATCH @ $C090)\n` +
        `EMULATION: 9-PIN IMPACT DOT MATRIX (72 DPI HORIZONTAL)\n` +
        `-------------------------------------------------------\n` +
        `ASCII CHARACTER SET TEST PATTERN:\n` +
        ` !"#$%&'()*+,-./0123456789:;<=>?@\n` +
        `ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_` +
        `\nabcdefghijklmnopqrstuvwxyz{|}~\n` +
        `-------------------------------------------------------\n` +
        `[ SELF-TEST PASSED: READY FOR PR#1 DATA STREAM ]\n\n`;
      for (let i = 0; i < banner.length; i++) {
        card.receiveByte(banner.charCodeAt(i));
      }
      setPaperContent(card.paperBuffer);
    }
  };

  const handlePrintPhysical = () => {
    window.print();
  };

  const getStockClass = () => {
    switch (paperStock) {
      case 'greenbar': return 'paper-greenbar';
      case 'white': return 'paper-white';
      case 'plain-ivory': return 'paper-plain-ivory';
      case 'ivory': return 'paper-ivory';
      default: return 'paper-blank';
    }
  };

  return (
    <div className="bg-[#12161f] border-2 border-[#2b374a] rounded-xl p-5 font-mono text-gray-200 space-y-5 shadow-2xl">
      {/* Header & Status */}
      <div className="flex flex-wrap justify-between items-center border-b border-[#2b374a] pb-3 gap-2">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 flex items-center justify-center font-bold text-lg shadow-inner">
            🖨️
          </div>
          <div>
            <h4 className="text-sm font-bold text-emerald-400">IMAGEWRITER II TRACTOR-FEED PRINTER (SLOT 1)</h4>
            <p className="text-xs text-gray-400">9-Pin Impact Dot-Matrix Simulation • Continuous Perforated Fanfold Paper • Real 65C02 Centronics Output</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold flex items-center gap-1.5 shadow">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> ONLINE (PR#1 @ $C100)
        </span>
      </div>

      {/* Controls: Mode Switch, Paper Stock & Hardware Self-Test */}
      <div className="p-4 bg-[#0a0d14] rounded-xl border border-[#232d3d] space-y-3 shadow-inner">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* 9-Pin Dot-Matrix vs Clean Line Print Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-stone-400 text-[11px] font-bold">PRINT RASTER:</span>
            <div className="flex bg-[#05070c] p-0.5 rounded-lg border border-[#1b2535]">
              <button
                onClick={() => setPrintMode('dotmatrix')}
                className={`px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1 ${
                  printMode === 'dotmatrix'
                    ? 'bg-emerald-700 text-white shadow'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                🔘 9-Pin Dot-Matrix
              </button>
              <button
                onClick={() => setPrintMode('clean')}
                className={`px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1 ${
                  printMode === 'clean'
                    ? 'bg-emerald-700 text-white shadow'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                ⚪ Clean Line
              </button>
            </div>
          </div>

          {/* Paper Stock Selector */}
          <div className="flex items-center gap-2">
            <span className="text-stone-400 text-[11px] font-bold">FANFOLD STOCK:</span>
            <select
              value={paperStock}
              onChange={(e) => setPaperStock(e.target.value as any)}
              className="bg-[#141a24] text-emerald-300 border border-[#2a3642] rounded-lg px-3 py-1 text-xs font-mono focus:outline-none shadow"
            >
              <option value="blank">⚪ Pure Blank White (Plain Fanfold)</option>
              <option value="greenbar">🟢 Green-Bar Fanfold (1/2" Bands)</option>
              <option value="white">📏 Ruled Lined White Fanfold</option>
              <option value="plain-ivory">📜 Pure Blank Ivory (No Lines)</option>
              <option value="ivory">📜 Lined Ivory Parchment</option>
            </select>
          </div>

          {/* 65C02 Hardware Self-Test Button */}
          <button
            onClick={handleSelfTest}
            className="px-3.5 py-1 bg-amber-600/80 hover:bg-amber-600 text-white font-bold rounded-lg border border-amber-500/40 text-xs transition flex items-center gap-1 shadow"
          >
            <Zap className="w-3.5 h-3.5" /> Centronics Self-Test
          </button>
        </div>

        <div className="border-t border-[#1c2432] pt-2 text-[11px] text-stone-400">
          <strong className="text-amber-400">Live 65C02 Centronics Stream:</strong> Output from Print Shop, Print Master, AppleWorks, or BASIC via <code className="text-emerald-300">PR#1</code> streams directly onto this continuous tractor paper.
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={handlePrintPhysical}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg shadow-lg transition text-xs flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> Print (Paper / PDF)
          </button>
          <button
            onClick={handleFormFeed}
            className="px-3 py-1.5 bg-[#1b2330] hover:bg-[#283447] text-gray-200 rounded-lg border border-[#37455d] text-xs transition flex items-center gap-1 font-bold"
          >
            <FileText className="w-3.5 h-3.5" /> Form Feed (FF)
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 bg-[#1b2330] hover:bg-[#283447] text-gray-200 rounded-lg border border-[#37455d] text-xs transition flex items-center gap-1 font-bold"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 bg-[#1b2330] hover:bg-[#283447] text-emerald-400 rounded-lg border border-[#37455d] text-xs transition flex items-center gap-1 font-bold"
          >
            <Download className="w-3.5 h-3.5" /> Download .txt
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 rounded-lg border border-red-800 text-xs transition flex items-center gap-1 font-bold"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
      </div>

      {/* Authentic Continuous Tractor Feed Paper Area */}
      <div className="tractor-container border-2 border-[#b8b1a0] rounded-xl shadow-2xl">
        {/* Left Sprocket Guide Margin */}
        <div className="sprocket-margin sprocket-left">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="sprocket-pin" />
          ))}
        </div>

        {/* Printable Continuous Fanfold Paper Area */}
        <div className={`flex-1 p-4 ${getStockClass()} overflow-x-auto min-h-[280px]`}>
          <textarea
            value={paperContent}
            onChange={(e) => {
              setPaperContent(e.target.value);
              const card = getPrinterCard();
              if (card) card.paperBuffer = e.target.value;
            }}
            rows={12}
            className={`w-full bg-transparent border-0 resize-y p-0 focus:outline-none ${
              printMode === 'dotmatrix' ? 'print-font-dotmatrix' : 'print-font-clean'
            }`}
            spellCheck={false}
            placeholder="[ ImageWriter II 9-pin dot-matrix tractor-feed paper is online. Real-time 65C02 printer stream via PR#1 or $C090 will appear here... ]"
          />
        </div>

        {/* Right Sprocket Guide Margin */}
        <div className="sprocket-margin sprocket-right">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="sprocket-pin" />
          ))}
        </div>
      </div>

      <div className="p-3 bg-[#0a0d14] rounded-lg border border-[#1c2432] text-[11px] text-gray-400 font-mono flex items-center justify-between">
        <span><strong className="text-amber-400">Centronics Parallel Bus:</strong> Data latch at <code className="text-emerald-300">$C090</code>, Driver at <code className="text-emerald-300">$C100</code>.</span>
        <span className="text-stone-300 font-bold">{paperContent.length} Bytes</span>
      </div>
    </div>
  );
};
