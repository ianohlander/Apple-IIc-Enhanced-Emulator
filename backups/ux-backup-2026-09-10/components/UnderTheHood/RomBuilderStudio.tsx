import React, { useState } from 'react';
import { Apple2cUltra } from '../../emulator/apple2c';
import { CustomRomBuilder, RomBuilderOptions } from '../../emulator/roms/romBuilder';
import { Cpu, Download, Play, CheckSquare, Square, Sparkles } from 'lucide-react';

interface RomBuilderStudioProps {
  emulator: Apple2cUltra;
}

export const RomBuilderStudio: React.FC<RomBuilderStudioProps> = ({ emulator }) => {
  const [options, setOptions] = useState<RomBuilderOptions>({
    name: 'Apple IIc Ultra ProDOS Master ROM',
    version: '2.4.2-ULTRA',
    bundleProDOS: true,
    bundleDOS33: true,
    bundleBasicSystem: true,
    bundleDiagnostics: true,
    autoBootDisk: true,
    customBannerText: 'APPLE //c ULTRA PRODOS 2.4.2 ROM'
  });

  const [lastBuiltRom, setLastBuiltRom] = useState<ReturnType<typeof CustomRomBuilder.buildRom> | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  const handleBuild = () => {
    const pkg = CustomRomBuilder.buildRom(options);
    setLastBuiltRom(pkg);
    setStatusMessage(`Successfully built 32KB Custom ROM: "${pkg.name}"`);
  };

  const handleHotLoad = () => {
    let pkg = lastBuiltRom;
    if (!pkg) {
      pkg = CustomRomBuilder.buildRom(options);
      setLastBuiltRom(pkg);
    }
    emulator.loadCustomRom(pkg.data);
    setStatusMessage(`Hot-Loaded "${pkg.name}" directly into Apple IIc System ROM! Booting...`);
  };

  const handleExport = () => {
    let pkg = lastBuiltRom;
    if (!pkg) {
      pkg = CustomRomBuilder.buildRom(options);
      setLastBuiltRom(pkg);
    }
    const blob = CustomRomBuilder.exportAsBin(pkg);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${options.name.replace(/\s+/g, '_')}.rom`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 font-mono text-stone-200 text-xs shadow-xl flex flex-col space-y-4">
      <div className="flex items-center justify-between border-b border-stone-800 pb-3">
        <div className="flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-amber-500" />
          <span className="text-amber-500 font-bold text-sm">CUSTOM ROM BUILDER STUDIO</span>
        </div>
        <span className="text-stone-400 text-[11px]">Bake ProDOS, DOS 3.3, and Autoboot into Internal ROM</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ROM Configuration Parameters */}
        <div className="bg-stone-950 p-3 rounded-lg border border-stone-800 flex flex-col space-y-3">
          <span className="font-bold text-amber-400 text-[11px] border-b border-stone-800 pb-1">
            ROM Image Properties
          </span>

          <div className="flex flex-col space-y-1">
            <span className="text-stone-400 text-[11px]">ROM Package Name:</span>
            <input
              type="text"
              value={options.name}
              onChange={(e) => setOptions({ ...options, name: e.target.value })}
              className="bg-stone-900 border border-stone-700 px-2 py-1 rounded text-stone-200"
            />
          </div>

          <div className="flex flex-col space-y-1">
            <span className="text-stone-400 text-[11px]">Custom Startup Banner Text:</span>
            <input
              type="text"
              value={options.customBannerText}
              onChange={(e) => setOptions({ ...options, customBannerText: e.target.value })}
              className="bg-stone-900 border border-stone-700 px-2 py-1 rounded text-amber-300 font-bold"
            />
          </div>

          {/* Module Toggles */}
          <div className="flex flex-col space-y-2 pt-2">
            {[
              { key: 'bundleProDOS', label: 'Bake ProDOS 2.4.2 into ROM space (Zero-Disk Boot)' },
              { key: 'bundleDOS33', label: 'Bake Apple DOS 3.3 runtime & command routines' },
              { key: 'bundleBasicSystem', label: 'Include BASIC.SYSTEM & Applesoft extensions' },
              { key: 'autoBootDisk', label: 'Autoboot primary drive on power-up' },
            ].map((opt) => {
              const checked = !!options[opt.key as keyof typeof options];
              return (
                <button
                  key={opt.key}
                  onClick={() => setOptions({ ...options, [opt.key]: !checked })}
                  className="flex items-center space-x-2 text-left hover:text-amber-300"
                >
                  {checked ? (
                    <CheckSquare className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Square className="w-4 h-4 text-stone-600" />
                  )}
                  <span className="text-stone-300 text-[11px]">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ROM Actions & Flash Operations */}
        <div className="bg-stone-950 p-3 rounded-lg border border-stone-800 flex flex-col justify-between space-y-3">
          <div className="flex flex-col space-y-2">
            <span className="font-bold text-amber-400 text-[11px] border-b border-stone-800 pb-1">
              Build & Flash Pipeline
            </span>
            <p className="text-stone-400 text-[11px] leading-relaxed">
              Construct a unified 32KB Apple IIc System ROM package. Hot-loading writes the binary directly into the virtual motherboard's address space ($C000-$FFFF) and performs an instant cold boot.
            </p>

            {statusMessage && (
              <div className="bg-amber-950/60 border border-amber-600/60 text-amber-200 p-2.5 rounded text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{statusMessage}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col space-y-2">
            <button
              onClick={handleHotLoad}
              className="w-full px-3 py-2 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center justify-center gap-1.5 shadow transition"
            >
              <Play className="w-4 h-4" /> Build & Hot-Load into Emulator
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleBuild}
                className="px-2 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold border border-stone-700 flex items-center justify-center gap-1"
              >
                Compile ROM
              </button>
              <button
                onClick={handleExport}
                className="px-2 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold border border-stone-700 flex items-center justify-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Export .ROM
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
