import { DiskDriveStatus } from '../../types/emulator';

export class FloppyDisk {
  public name: string = 'Untitled.dsk';
  public rawData: Uint8Array = new Uint8Array(143360);
  public tracks: Uint8Array[] = [];
  public isWriteProtected: boolean = false;
  public isProDosOrder: boolean = false;

  public static readonly DOS33_SKEW = [0, 7, 14, 6, 13, 5, 12, 4, 11, 3, 10, 2, 9, 1, 8, 15];
  public static readonly PRODOS_SKEW = [0, 8, 1, 9, 2, 10, 3, 11, 4, 12, 5, 13, 6, 14, 7, 15];

  // 64 Standard 6-and-2 GCR Disk Nibbles
  public static readonly DISK_BYTE_TO_NIBBLE: number[] = [
    0x96, 0x97, 0x9A, 0x9B, 0x9D, 0x9E, 0x9F, 0xA6,
    0xA7, 0xAB, 0xAC, 0xAD, 0xAE, 0xAF, 0xB2, 0xB3,
    0xB4, 0xB5, 0xB6, 0xB7, 0xB9, 0xBA, 0xBC, 0xBD,
    0xBE, 0xBF, 0xCB, 0xCD, 0xCE, 0xCF, 0xD2, 0xD3,
    0xD6, 0xD7, 0xD9, 0xDA, 0xDB, 0xDC, 0xDD, 0xDE,
    0xDF, 0xE5, 0xE6, 0xE7, 0xE9, 0xEA, 0xEB, 0xEC,
    0xED, 0xEE, 0xEF, 0xF2, 0xF3, 0xF4, 0xF5, 0xF6,
    0xF7, 0xF9, 0xFA, 0xFB, 0xFC, 0xFD, 0xFE, 0xFF
  ];

  constructor(name: string = 'Untitled.dsk', data?: Uint8Array) {
    this.name = name;
    if (data) this.loadData(data);
    else this.formatBlank();
  }

  public loadData(data: Uint8Array): void {
    this.rawData = data;
    this.tracks = [];

    const isWoz = data.length >= 8 && data[0] === 0x57 && data[1] === 0x4f;
    if (isWoz) {
      this.parseWoz(data);
    } else if (data.length === 232960) {
      this.parseNib(data);
    } else {
      this.isProDosOrder = this.name.toLowerCase().endsWith('.po');
      this.nibblizeStandardDisk(data);
    }
  }

  private parseNib(data: Uint8Array): void {
    for (let t = 0; t < 35; t++) {
      this.tracks.push(data.slice(t * 6656, (t + 1) * 6656));
    }
  }

  public formatBlank(): void {
    this.rawData = new Uint8Array(143360);
    this.tracks = [];
    this.nibblizeStandardDisk(this.rawData);
  }

  private nibblizeStandardDisk(data: Uint8Array): void {
    const skew = this.isProDosOrder ? FloppyDisk.PRODOS_SKEW : FloppyDisk.DOS33_SKEW;
    for (let track = 0; track < 35; track++) {
      this.tracks.push(this.createTrackBuffer(track, data, skew));
    }
  }

  private createTrackBuffer(track: number, data: Uint8Array, skew: number[]): Uint8Array {
    const trackBuf = new Uint8Array(6656);
    let ptr = 0;

    for (let sec = 0; sec < 16; sec++) {
      const physSector = skew[sec];
      const secOffset = (track * 16 + sec) * 256;
      const secData = data.slice(secOffset, secOffset + 256);

      ptr = this.writeAddressHeader(trackBuf, ptr, track, physSector);
      ptr = this.writeDataField(trackBuf, ptr, secData);
    }
    return trackBuf;
  }

  private writeAddressHeader(buf: Uint8Array, ptr: number, track: number, sec: number): number {
    for (let i = 0; i < 14; i++) buf[ptr++] = 0xff;
    buf[ptr++] = 0xd5; buf[ptr++] = 0xaa; buf[ptr++] = 0x96;

    const vol = 254;
    const chk = vol ^ track ^ sec;
    this.write4and4(buf, ptr, vol); ptr += 2;
    this.write4and4(buf, ptr, track); ptr += 2;
    this.write4and4(buf, ptr, sec); ptr += 2;
    this.write4and4(buf, ptr, chk); ptr += 2;

    buf[ptr++] = 0xde; buf[ptr++] = 0xaa; buf[ptr++] = 0xeb;
    return ptr;
  }

  private writeDataField(buf: Uint8Array, ptr: number, secData: Uint8Array): number {
    for (let i = 0; i < 5; i++) buf[ptr++] = 0xff;
    buf[ptr++] = 0xd5; buf[ptr++] = 0xaa; buf[ptr++] = 0xad;

    const nibbles = this.encode6and2(secData);
    buf.set(nibbles, ptr);
    ptr += nibbles.length;

    buf[ptr++] = 0xde; buf[ptr++] = 0xaa; buf[ptr++] = 0xeb;
    return ptr;
  }

  private write4and4(buf: Uint8Array, ptr: number, val: number): void {
    buf[ptr] = ((val >> 1) & 0x55) | 0xaa;
    buf[ptr + 1] = (val & 0x55) | 0xaa;
  }

  private encode6and2(secData: Uint8Array): Uint8Array {
    const out = new Uint8Array(343);
    const nibbles = new Uint8Array(342);
    const user = new Uint8Array(256);
    user.set(secData);

    const aux = new Uint8Array(86);
    for (let i = 0; i < 84; i++) {
      aux[i] = ((user[i] & 1) << 1) | ((user[i] & 2) >> 1)
             | ((user[i + 86] & 1) << 3) | ((user[i + 86] & 2) << 1)
             | ((user[i + 172] & 1) << 5) | ((user[i + 172] & 2) << 3);
    }

    let idx = 0;
    for (let i = 85; i >= 0; i--) nibbles[idx++] = aux[i] & 0x3f;
    for (let i = 0; i < 256; i++) nibbles[idx++] = (user[i] >> 2) & 0x3f;

    let last = 0;
    for (let i = 0; i < 342; i++) {
      const cur = nibbles[i];
      out[i] = FloppyDisk.DISK_BYTE_TO_NIBBLE[cur ^ last];
      last = cur;
    }
    out[342] = FloppyDisk.DISK_BYTE_TO_NIBBLE[last];
    return out;
  }

  private parseWoz(_data: Uint8Array): void {
    for (let t = 0; t < 35; t++) {
      const trackBuf = new Uint8Array(6656);
      trackBuf.fill(0xff);
      this.tracks.push(trackBuf);
    }
  }
}

export class DiskIIController {
  public drive1: FloppyDisk | null = null;
  public drive2: FloppyDisk | null = null;
  public activeDriveNumber: number = 1;
  public motorOn: boolean = false;
  public phases: boolean[] = [false, false, false, false];
  public trackQuarterSteps: number = 0;
  public trackBytePointer: number = 0;
  public q6: boolean = false;
  public q7: boolean = false;
  public onStepSound?: (track: number) => void;

  private softswitchHandlers: Array<() => void>;

  constructor() {
    this.softswitchHandlers = this.buildSoftswitchHandlers();
  }

  private buildSoftswitchHandlers(): Array<() => void> {
    const handlers: Array<() => void> = [];
    for (let i = 0; i <= 7; i++) {
      const phase = (i >> 1) & 3;
      const on = (i & 1) !== 0;
      handlers.push(() => { this.phases[phase] = on; if (on) this.stepHead(phase); });
    }
    handlers[8] = () => { this.motorOn = false; };
    handlers[9] = () => { this.motorOn = true; };
    handlers[10] = () => { this.activeDriveNumber = 1; };
    handlers[11] = () => { this.activeDriveNumber = 2; };
    handlers[12] = () => { this.q6 = false; };
    handlers[13] = () => { this.q6 = true; };
    handlers[14] = () => { this.q7 = false; };
    handlers[15] = () => { this.q7 = true; };
    return handlers;
  }

  public mount(driveNum: number, disk: FloppyDisk): void {
    if (driveNum === 1) this.drive1 = disk;
    else this.drive2 = disk;
  }

  public getActiveDrive(): FloppyDisk | null {
    return this.activeDriveNumber === 1 ? this.drive1 : this.drive2;
  }

  public getStatus(driveNum: number): DiskDriveStatus {
    const disk = this.getDriveDisk(driveNum);
    const isThisDriveActive = Boolean(this.motorOn && this.activeDriveNumber === driveNum);
    return this.buildStatus(disk, isThisDriveActive);
  }

  private getDriveDisk(driveNum: number): FloppyDisk | null {
    return driveNum === 1 ? this.drive1 : this.drive2;
  }

  private buildStatus(disk: FloppyDisk | null, isMotorActive: boolean): DiskDriveStatus {
    return {
      mounted: disk !== null,
      name: disk ? disk.name : 'Empty Drive',
      track: Math.floor(this.trackQuarterSteps / 4),
      sector: Math.floor((this.trackBytePointer / 6656) * 16) % 16,
      isMotorOn: isMotorActive,
      isWriteProtected: disk ? disk.isWriteProtected : true,
      isReading: isMotorActive && !this.q7,
      isWriting: isMotorActive && this.q7,
      type: '5.25',
      sizeBytes: disk ? disk.rawData.length : 0
    };
  }

  public read(offset: number): number {
    this.handleSoftswitch(offset);
    if (!this.motorOn) return 0x00;

    const drive = this.getActiveDrive();
    if (!drive) return 0x00;

    const trackIdx = Math.min(34, Math.max(0, Math.floor(this.trackQuarterSteps / 4)));
    const trackData = drive.tracks[trackIdx];
    if (!trackData) return 0x00;

    const byte = trackData[this.trackBytePointer % trackData.length];
    this.trackBytePointer = (this.trackBytePointer + 1) % trackData.length;
    return byte;
  }

  public write(offset: number, value: number): void {
    this.handleSoftswitch(offset);
    if (this.motorOn && this.q7) {
      const drive = this.getActiveDrive();
      if (drive && !drive.isWriteProtected) {
        const trackIdx = Math.min(34, Math.max(0, Math.floor(this.trackQuarterSteps / 4)));
        const trackData = drive.tracks[trackIdx];
        if (trackData) {
          trackData[this.trackBytePointer % trackData.length] = value;
          this.trackBytePointer = (this.trackBytePointer + 1) % trackData.length;
        }
      }
    }
  }

  private handleSoftswitch(offset: number): void {
    const handler = this.softswitchHandlers[offset & 0x0f];
    if (handler) handler();
  }

  private stepHead(phase: number): void {
    const currentPhase = (this.trackQuarterSteps / 2) % 4;
    const diff = (phase - currentPhase + 4) % 4;

    if (diff === 1) this.trackQuarterSteps = Math.min(140, this.trackQuarterSteps + 2);
    else if (diff === 3) this.trackQuarterSteps = Math.max(0, this.trackQuarterSteps - 2);

    if (this.onStepSound) {
      this.onStepSound(Math.floor(this.trackQuarterSteps / 4));
    }
  }
}
