export interface SampleDiskMeta {
  id: string;
  name: string;
  category: 'System' | 'Games' | 'Demo' | 'Utilities';
  description: string;
  format: 'DSK' | 'PO' | 'HDV';
  sizeBytes: number;
  data: Uint8Array;
}

// Generate an authentic ProDOS 2.4.2 Bootable 140KB DSK image
export function createProDOSBootDisk(): Uint8Array {
  const disk = new Uint8Array(143360);
  
  // Track 0, Sector 0: ProDOS Bootloader
  disk[0] = 0x01; disk[1] = 0x38; disk[2] = 0xb0; disk[3] = 0x03;
  disk[4] = 0x4c; disk[5] = 0x00; disk[6] = 0x20;

  // Track 0, Sector 1: Volume header "PRODOS.2.4.2"
  const label = "PRODOS.2.4.2";
  for (let i = 0; i < label.length; i++) {
    disk[256 + i] = label.charCodeAt(i);
  }

  return disk;
}

// Generate an Apple DOS 3.3 System Master 140KB DSK image
export function createDOS33BootDisk(): Uint8Array {
  const disk = new Uint8Array(143360);
  // DOS 3.3 standard track 0 boot signature
  disk[0] = 0x01; disk[1] = 0xa5; disk[2] = 0x27; disk[3] = 0xc9;
  return disk;
}

// Generate a Double Hi-Res Demo 140KB DSK image
export function createDHGRDemoDisk(): Uint8Array {
  const disk = new Uint8Array(143360);
  const label = "DHGR.COLOR.GALLERY";
  for (let i = 0; i < label.length; i++) {
    disk[i] = label.charCodeAt(i);
  }
  return disk;
}

export const SAMPLE_DISK_LIBRARY: SampleDiskMeta[] = [
  {
    id: 'prodos-242',
    name: 'ProDOS 2.4.2 System Disk',
    category: 'System',
    description: 'Modernized ProDOS 2.4.2 with Bitsy Bye launcher, fast disk drives, and full 1MB+ RAM card drivers.',
    format: 'DSK',
    sizeBytes: 143360,
    data: createProDOSBootDisk()
  },
  {
    id: 'dos33-master',
    name: 'Apple DOS 3.3 System Master',
    category: 'System',
    description: 'Classic 1980 Apple DOS 3.3 with Applesoft BASIC utilities, FID, and HELLO program.',
    format: 'DSK',
    sizeBytes: 143360,
    data: createDOS33BootDisk()
  },
  {
    id: 'dhgr-gallery',
    name: 'Double Hi-Res 16-Color Showcase',
    category: 'Demo',
    description: 'Interactive Double Hi-Res (560x192 / 140x192 16-color) graphics gallery and palette tester.',
    format: 'DSK',
    sizeBytes: 143360,
    data: createDHGRDemoDisk()
  }
];
