import { ProdosDiskExporter } from '../../emulator/storage/diskExporter';
import React, { useRef } from 'react';
import { Apple2cUltra } from '../../emulator/apple2c';
import { FloppyDisk } from '../../emulator/storage/diskII';
import { SmartPortHardDrive } from '../../emulator/storage/smartport';
import { Disc, HardDrive, Upload, Download, PlusCircle, CheckCircle } from 'lucide-react';

interface StorageManagerProps {
  emulator: Apple2cUltra;
  onRefresh: () => void;
}

export const StorageManager: React.FC<StorageManagerProps> = ({ emulator, onRefresh }) => {
  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);
  const hdFileInputRef = useRef<HTMLInputElement>(null);

  const d1 = emulator.diskController.getStatus(1);
  const d2 = emulator.diskController.getStatus(2);
  const hd = emulator.smartPort.getStatus(1);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, driveNum: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (buffer) {
        const data = new Uint8Array(buffer);
        const disk = new FloppyDisk(file.name, data);
        emulator.diskController.mount(driveNum, disk);
        onRefresh();
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleHardDriveUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (buffer) {
        const data = new Uint8Array(buffer);
        const sizeMB = Math.round(data.length / (1024 * 1024)) || 32;
        const hardDrive = new SmartPortHardDrive(file.name, sizeMB, data);
        emulator.smartPort.mountHardDrive(1, hardDrive);
        onRefresh();
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleCreateBlankDisk = (driveNum: number) => {
    const disk = new FloppyDisk(`Blank_${Date.now()}.dsk`);
    emulator.diskController.mount(driveNum, disk);
    onRefresh();
  };

  const handleExportDisk = (driveNum: number) => {
    const disk = driveNum === 1 ? emulator.diskController.drive1 : emulator.diskController.drive2;
    if (!disk) return;

    const blob = new Blob([disk.rawData], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = disk.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  
  const handleExportProdosFloppy = (is2mg: boolean) => {
    const d1 = emulator.diskController.drive1;
    let data = d1.rawData;
    const name = (d1.name.replace(/\.[^/.]+$/, '') || 'FloppyEmu_Disk') + (is2mg ? '.2mg' : '.dsk');
    if (is2mg) {
      data = ProdosDiskExporter.wrapIn2MG(data, d1.name);
    }
    ProdosDiskExporter.triggerDownload(data, name);
  };

  const handleExportProdosHardDrive = (is2mg: boolean) => {
    const hd = emulator.smartPort.hardDrive1;
    let data = hd.blocks;
    const name = (hd.name.replace(/\.[^/.]+$/, '') || 'CFFA3000_HD') + (is2mg ? '.2mg' : '.hdv');
    if (is2mg) {
      data = ProdosDiskExporter.wrapIn2MG(data, hd.name);
    }
    ProdosDiskExporter.triggerDownload(data, name);
  };

  const handleExportHardDrive = () => {
    const hd = emulator.smartPort.hardDrive1;
    if (!hd) return;

    const blob = new Blob([hd.blocks], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = hd.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 font-mono text-stone-200 text-xs shadow-xl flex flex-col space-y-4">
      <div className="flex items-center justify-between border-b border-stone-800 pb-3">
        <div className="flex items-center space-x-2">
          <HardDrive className="w-4 h-4 text-amber-500" />
          <span className="text-amber-500 font-bold text-sm">STORAGE & VIRTUAL DRIVES</span>
        </div>
        <span className="text-stone-400 text-[11px]">5.25" Floppy Drives & 32MB SmartPort HD</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Drive 1 Slot */}
        <div className="bg-stone-950 p-3 rounded-lg border border-stone-800 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <Disc className="w-4 h-4" /> FLOPPY DRIVE 1 (Slot 6, D1)
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              d1.mounted ? 'bg-green-900 text-green-300' : 'bg-stone-800 text-stone-500'
            }`}>
              {d1.mounted ? 'MOUNTED' : 'EMPTY'}
            </span>
          </div>

          <div className="bg-stone-900 p-2.5 rounded border border-stone-800 flex flex-col space-y-1">
            <span className="font-bold text-stone-200 truncate">{d1.name}</span>
            <span className="text-[10px] text-stone-400">Track: {d1.track} | Sector: {d1.sector} | Motor: {d1.isMotorOn ? 'ON' : 'OFF'}</span>
          </div>

          <input
            type="file"
            ref={fileInputRef1}
            onChange={(e) => handleFileUpload(e, 1)}
            accept=".dsk,.po,.do,.nib,.woz"
            className="hidden"
          />

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => fileInputRef1.current?.click()}
              className="px-2 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold flex items-center justify-center gap-1 border border-stone-700"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" /> Mount Image
            </button>
            <button
              onClick={() => handleCreateBlankDisk(1)}
              className="px-2 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold flex items-center justify-center gap-1 border border-stone-700"
            >
              <PlusCircle className="w-3.5 h-3.5 text-green-400" /> New Blank
            </button>
          </div>

          {d1.mounted && (
            <button
              onClick={() => handleExportDisk(1)}
              className="w-full px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center gap-1 border border-stone-700 text-[11px]"
            >
              <Download className="w-3.5 h-3.5" /> Download .DSK Image
            </button>
          )}
        </div>

        {/* Drive 2 Slot */}
        <div className="bg-stone-950 p-3 rounded-lg border border-stone-800 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <Disc className="w-4 h-4" /> FLOPPY DRIVE 2 (Slot 6, D2)
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              d2.mounted ? 'bg-green-900 text-green-300' : 'bg-stone-800 text-stone-500'
            }`}>
              {d2.mounted ? 'MOUNTED' : 'EMPTY'}
            </span>
          </div>

          <div className="bg-stone-900 p-2.5 rounded border border-stone-800 flex flex-col space-y-1">
            <span className="font-bold text-stone-200 truncate">{d2.name}</span>
            <span className="text-[10px] text-stone-400">Track: {d2.track} | Sector: {d2.sector} | Motor: {d2.isMotorOn ? 'ON' : 'OFF'}</span>
          </div>

          <input
            type="file"
            ref={fileInputRef2}
            onChange={(e) => handleFileUpload(e, 2)}
            accept=".dsk,.po,.do,.nib,.woz"
            className="hidden"
          />

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => fileInputRef2.current?.click()}
              className="px-2 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold flex items-center justify-center gap-1 border border-stone-700"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" /> Mount Image
            </button>
            <button
              onClick={() => handleCreateBlankDisk(2)}
              className="px-2 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold flex items-center justify-center gap-1 border border-stone-700"
            >
              <PlusCircle className="w-3.5 h-3.5 text-green-400" /> New Blank
            </button>
          </div>

          {d2.mounted && (
            <button
              onClick={() => handleExportDisk(2)}
              className="w-full px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center gap-1 border border-stone-700 text-[11px]"
            >
              <Download className="w-3.5 h-3.5" /> Download .DSK Image
            </button>
          )}
        </div>

        {/* 32MB SmartPort Hard Drive */}
        <div className="bg-stone-950 p-3 rounded-lg border border-stone-800 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4" /> SMARTPORT HARD DISK
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-900 text-amber-300">
              32 MEGABYTES
            </span>
          </div>

          <div className="bg-stone-900 p-2.5 rounded border border-stone-800 flex flex-col space-y-1">
            <span className="font-bold text-stone-200 truncate">{hd.name}</span>
            <span className="text-[10px] text-stone-400">Total: {hd.totalBlocks.toLocaleString()} ProDOS Blocks (512B)</span>
          </div>

          <input
            type="file"
            ref={hdFileInputRef}
            onChange={handleHardDriveUpload}
            accept=".hdv,.2mg,.po"
            className="hidden"
          />

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => hdFileInputRef.current?.click()}
              className="px-2 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold flex items-center justify-center gap-1 border border-stone-700"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" /> Mount .HDV
            </button>
            <button
              onClick={handleExportHardDrive}
              className="px-2 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold flex items-center justify-center gap-1 border border-stone-700"
            >
              <Download className="w-3.5 h-3.5 text-green-400" /> Export 32MB
            </button>
          </div>

          <div className="flex items-center space-x-1.5 text-[10px] text-amber-300/80 pt-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Auto-persists changes to browser IndexedDB storage</span>
          </div>
        </div>
      </div>
    
      {/* 1-Click Physical Hardware Exporter Banner */}
      <div className="p-4 bg-[#0a141d] rounded-xl border border-[#1b3d54] space-y-3 font-mono text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1b3d54] pb-2">
          <div className="flex items-center gap-2">
            <span className="text-base">⚡</span>
            <span className="font-bold text-cyan-400">1-CLICK PHYSICAL HARDWARE EXPORTER (FLOPPY EMU / CFFA3000)</span>
          </div>
          <a
            href="docs/developer/physical-hardware-export.html"
            target="_blank"
            rel="noreferrer"
            className="text-[10px] text-cyan-400 underline hover:text-cyan-300"
          >
            Hardware Transfer Guide ↗
          </a>
        </div>
        <p className="text-[11px] text-gray-300 leading-relaxed font-sans">
          Export bootable disk images formatted specifically for physical Apple II hardware emulators (BMOW Floppy Emu, CFFA3000, wDrive, BOOTI, and FujiNet). Copy the downloaded file directly to your SD card or USB drive!
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => handleExportProdosFloppy(false)}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded shadow transition flex items-center gap-1.5"
          >
            💾 Export Drive 1 Floppy (.DSK / .PO)
          </button>
          <button
            onClick={() => handleExportProdosFloppy(true)}
            className="px-3 py-1.5 bg-[#1c222b] hover:bg-[#283240] text-cyan-300 rounded border border-[#2a3642] transition flex items-center gap-1.5"
          >
            📦 Export Drive 1 as Universal 2MG (.2MG)
          </button>
          <button
            onClick={() => handleExportProdosHardDrive(false)}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded shadow transition flex items-center gap-1.5"
          >
            💽 Export 32MB HD for CFFA3000 (.HDV / .PO)
          </button>
          <button
            onClick={() => handleExportProdosHardDrive(true)}
            className="px-3 py-1.5 bg-[#1c222b] hover:bg-[#283240] text-purple-300 rounded border border-[#2a3642] transition flex items-center gap-1.5"
          >
            📦 Export 32MB HD as 2MG (.2MG)
          </button>
        </div>
      </div>

    </div>
  );
};