import React from 'react';
import { Apple2cUltra } from '../emulator/apple2c';
import { SAMPLE_DISK_LIBRARY, SampleDiskMeta } from '../samples/sampleDisks';
import { FloppyDisk } from '../emulator/storage/diskII';
import { Disc, X, Play, HardDrive } from 'lucide-react';

interface DiskLibraryModalProps {
  emulator: Apple2cUltra;
  isOpen: boolean;
  onClose: () => void;
  onMountSuccess: () => void;
}

export const DiskLibraryModal: React.FC<DiskLibraryModalProps> = ({
  emulator,
  isOpen,
  onClose,
  onMountSuccess
}) => {
  if (!isOpen) return null;

  const handleMount = (sample: SampleDiskMeta, driveNum: number) => {
    const disk = new FloppyDisk(sample.name, sample.data);
    emulator.diskController.mount(driveNum, disk);
    onMountSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl font-mono text-stone-200 flex flex-col space-y-4">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center space-x-2">
            <Disc className="w-5 h-5 text-amber-500" />
            <span className="text-base font-bold text-amber-500">APPLE II SOFTWARE & DISK LIBRARY</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col space-y-3 max-h-96 overflow-y-auto pr-1">
          {SAMPLE_DISK_LIBRARY.map((disk) => (
            <div
              key={disk.id}
              className="bg-stone-950 border border-stone-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:border-amber-700/60 transition"
            >
              <div className="flex flex-col space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-amber-400 text-sm">{disk.name}</span>
                  <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-400 text-[10px] font-bold">
                    {disk.category}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 text-[10px] font-bold">
                    {disk.format} (140KB)
                  </span>
                </div>
                <p className="text-xs text-stone-400 leading-relaxed">{disk.description}</p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => handleMount(disk, 1)}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1 shadow transition"
                >
                  <Play className="w-3.5 h-3.5" /> Mount Drive 1
                </button>
                <button
                  onClick={() => handleMount(disk, 2)}
                  className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold border border-stone-700 transition"
                >
                  Drive 2
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
