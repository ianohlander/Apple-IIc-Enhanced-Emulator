import { DiskDriveStatus } from '../../types/emulator';

export class FloppyDisk {
  public name: string = 'Untitled.dsk';
  public rawData: Uint8Array = new Uint8Array(143360);
  public tracks: Uint8Array[] = [];
  public isWriteProtected: boolean = false;
  public isProDosOrder: boolean = false;

  public static readonly DOS33_SKEW = [0, 7, 14, 6, 13, 5, 12, 4, 11, 3, 10, 2, 9, 1, 8, 15];
  public static readonly PRODOS_SKEW = [0, 8, 1, 9, 2, 10, 3, 11, 4, 12, 5, 13, 6, 14, 7, 15];
  public static readonly EA_SKEW = [0x0f, 0x02, 0x04, 0x06, 0x08, 0x0a, 0x0c, 0x0e, 0x01, 0x03, 0x05, 0x07, 0x09, 0x0b, 0x0d, 0x00];

  // 64 Standard 6-and-2 GCR Disk Nibbles
  public static readonly DISK_BYTE_TO_NIBBLE: number[] = [
    0x96, 0x97, 0x9A, 0x9B, 0x9D, 0x9E, 0x9F, 0xA6,
    0xA7, 0xAB, 0xAC, 0xAD, 0xAE, 0xAF, 0xB2, 0xB3,
    0xB4, 0xB5, 0xB6, 0xB7, 0xB9, 0xBA, 0xBB, 0xBC,
    0xBD, 0xBE, 0xBF, 0xCB, 0xCD, 0xCE, 0xCF, 0xD3,
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

  private isEaFastloaderDisk(data: Uint8Array): boolean {
    const sec3Offset = FloppyDisk.DOS33_SKEW[3] * 256;
    if (data.length < sec3Offset + 256) return false;
    return (
      data[sec3Offset + 3] === 0x96 &&
      data[sec3Offset + 7] === 0x97 &&
      data[sec3Offset + 255] === 0xff
    );
  }

  private initEaTables(data: Uint8Array): {
    tableB: Uint8Array;
    nibbles: number[];
    bitsToOffset: Map<number, number>;
  } {
    const sec3Offset = FloppyDisk.DOS33_SKEW[3] * 256;
    const tableB = data.subarray(sec3Offset, sec3Offset + 256);
    const nibbles: number[] = [];
    for (let i = 0; i < 64; i++) {
      nibbles.push(tableB[i * 4 + 3]);
    }
    const bitsToOffset = new Map<number, number>();
    for (let offset = 0; offset < 256; offset += 4) {
      const key = (tableB[offset] << 16) | (tableB[offset + 1] << 8) | tableB[offset + 2];
      bitsToOffset.set(key, offset);
    }
    return { tableB, nibbles, bitsToOffset };
  }

  private nibblizeStandardDisk(data: Uint8Array): void {
    const isEa = this.isEaFastloaderDisk(data);
    const standardSkew = this.isProDosOrder ? FloppyDisk.PRODOS_SKEW : FloppyDisk.DOS33_SKEW;
    const eaParams = isEa ? this.initEaTables(data) : null;

    for (let track = 0; track < 35; track++) {
      if (isEa && track > 0 && eaParams) {
        this.tracks.push(this.createEaTrackBuffer(track, data, eaParams));
      } else {
        this.tracks.push(this.createTrackBuffer(track, data, standardSkew));
      }
    }
  }

  private createEaTrackBuffer(
    track: number,
    data: Uint8Array,
    eaParams: { tableB: Uint8Array; nibbles: number[]; bitsToOffset: Map<number, number> }
  ): Uint8Array {
    const trackBuf = new Uint8Array(6656);
    let ptr = 0;

    for (let sec = 0; sec < 16; sec++) {
      const physSector = sec;
      const fileSec = FloppyDisk.DOS33_SKEW[physSector];
      const secOffset = (track * 16 + fileSec) * 256;
      const secData = data.slice(secOffset, secOffset + 256);

      ptr = this.writeAddressHeader(trackBuf, ptr, track, physSector);
      ptr = this.writeEaDataField(trackBuf, ptr, secData, eaParams);
    }
    return trackBuf;
  }

  private writeEaDataField(
    buf: Uint8Array,
    ptr: number,
    secData: Uint8Array,
    eaParams: { tableB: Uint8Array; nibbles: number[]; bitsToOffset: Map<number, number> }
  ): number {
    for (let i = 0; i < 5; i++) buf[ptr++] = 0xff;
    buf[ptr++] = 0xd5; buf[ptr++] = 0xaa; buf[ptr++] = 0xad;

    const nibbles = this.encodeSectorEa(secData, eaParams);
    buf.set(nibbles, ptr);
    ptr += nibbles.length;

    buf[ptr++] = 0xde; buf[ptr++] = 0xaa; buf[ptr++] = 0xeb;
    return ptr;
  }

  private getEaDiff(secData: Uint8Array, i: number, base: number): number {
    if (i === 0) {
      const prevMask = base === 0 ? 0 : (secData[base - 1] & 0xfc);
      return (secData[base] ^ prevMask) & 3;
    }
    return (secData[base + i] ^ secData[base + i - 1]) & 3;
  }

  private computeEaAuxOffsets(
    secData: Uint8Array,
    bitsToOffset: Map<number, number>
  ): { auxX: Uint8Array; chkPass1: number } {
    const auxX = new Uint8Array(86);
    let chkPass1 = 0;

    for (let i = 0; i < 86; i++) {
      const d0 = this.getEaDiff(secData, i, 0);
      const d1 = this.getEaDiff(secData, i, 86);
      const d2 = i < 84 ? this.getEaDiff(secData, i, 172) : 0;
      const key = (d0 << 16) | (d1 << 8) | d2;
      const offset = bitsToOffset.get(key) || 0;
      auxX[i] = offset;
      chkPass1 ^= offset;
    }
    return { auxX, chkPass1 };
  }

  private encodeEaPagePass(
    diskNibbles: Uint8Array,
    ptr: number,
    secData: Uint8Array,
    offset: number,
    count: number,
    initialPrevA: number,
    tBOffset: number,
    tableB: Uint8Array,
    auxX: Uint8Array,
    nibbles: number[]
  ): { nextPtr: number; finalPrevA: number } {
    let prevA = initialPrevA;
    for (let i = 0; i < count; i++) {
      const targetA = secData[offset + i];
      const b = tableB[auxX[i] + tBOffset];
      const neededTableA = (targetA ^ prevA ^ b) & 0xfc;
      diskNibbles[ptr++] = nibbles[neededTableA >> 2];
      prevA = targetA;
    }
    return { nextPtr: ptr, finalPrevA: prevA };
  }

  private encodeSectorEa(
    secData: Uint8Array,
    eaParams: { tableB: Uint8Array; nibbles: number[]; bitsToOffset: Map<number, number> }
  ): Uint8Array {
    const { tableB, nibbles, bitsToOffset } = eaParams;
    const { auxX, chkPass1 } = this.computeEaAuxOffsets(secData, bitsToOffset);
    const diskNibbles = new Uint8Array(343);
    let ptr = 0;

    for (let i = 0; i < 86; i++) {
      diskNibbles[ptr++] = nibbles[auxX[i] >> 2];
    }

    const r1 = this.encodeEaPagePass(diskNibbles, ptr, secData, 0, 86, chkPass1, 0, tableB, auxX, nibbles);
    const r2 = this.encodeEaPagePass(diskNibbles, r1.nextPtr, secData, 86, 86, secData[85] & 0xfc, 1, tableB, auxX, nibbles);
    const r3 = this.encodeEaPagePass(diskNibbles, r2.nextPtr, secData, 172, 84, secData[171] & 0xfc, 2, tableB, auxX, nibbles);

    diskNibbles[r3.nextPtr] = nibbles[(r3.finalPrevA & 0xfc) >> 2];
    return diskNibbles;
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

  private parseWoz(data: Uint8Array): void {
    if (data.length < 80) return;
    const isWoz2 = data[3] === 0x32;
    const { infoOffset, tmapOffset, trksOffset } = this.findWozChunks(data);

    if (tmapOffset === -1 || trksOffset === -1) {
      this.initBlankTracks();
      return;
    }

    if (infoOffset !== -1) {
      this.isWriteProtected = data[infoOffset + 2] === 1;
    }

    this.parseWozTracks(data, tmapOffset, trksOffset, isWoz2);
  }

  private findWozChunks(data: Uint8Array): { infoOffset: number; tmapOffset: number; trksOffset: number } {
    let offset = 12;
    let infoOffset = -1;
    let tmapOffset = -1;
    let trksOffset = -1;

    while (offset + 8 <= data.length) {
      const chunkId = String.fromCharCode(data[offset], data[offset + 1], data[offset + 2], data[offset + 3]);
      const chunkSize = (data[offset + 4] | (data[offset + 5] << 8) | (data[offset + 6] << 16) | (data[offset + 7] << 24)) >>> 0;
      const dataOffset = offset + 8;
      if (chunkId === 'INFO') infoOffset = dataOffset;
      if (chunkId === 'TMAP') tmapOffset = dataOffset;
      if (chunkId === 'TRKS') trksOffset = dataOffset;
      offset = dataOffset + chunkSize;
    }
    return { infoOffset, tmapOffset, trksOffset };
  }

  private initBlankTracks(): void {
    this.tracks = [];
    for (let t = 0; t < 35; t++) {
      const trackBuf = new Uint8Array(6656);
      trackBuf.fill(0xff);
      this.tracks.push(trackBuf);
    }
  }

  private parseWozTracks(data: Uint8Array, tmapOffset: number, trksOffset: number, isWoz2: boolean): void {
    this.tracks = [];
    this.rawData = new Uint8Array(143360);
    const nibbleToByte = new Uint8Array(256);
    FloppyDisk.DISK_BYTE_TO_NIBBLE.forEach((nib, byte) => { nibbleToByte[nib] = byte; });

    for (let trackNum = 0; trackNum < 35; trackNum++) {
      const trkEntryIdx = data[tmapOffset + trackNum * 4];
      const nibbles = trkEntryIdx !== 255 ? this.readTrackNibbles(data, trksOffset, trkEntryIdx, isWoz2) : [];
      this.tracks.push(this.createPaddedTrack(nibbles));
      this.extractSectorsToRawData(nibbles, trackNum, nibbleToByte);
    }
  }

  private readTrackNibbles(data: Uint8Array, trksOffset: number, trkEntryIdx: number, isWoz2: boolean): number[] {
    if (isWoz2) {
      return this.readWoz2TrackNibbles(data, trksOffset, trkEntryIdx);
    }
    return this.readWoz1TrackNibbles(data, trksOffset, trkEntryIdx);
  }

  private readWoz2TrackNibbles(data: Uint8Array, trksOffset: number, trkEntryIdx: number): number[] {
    const entryOffset = trksOffset + trkEntryIdx * 8;
    const startBlock = data[entryOffset] | (data[entryOffset + 1] << 8);
    const blockCount = data[entryOffset + 2] | (data[entryOffset + 3] << 8);
    const bitCount = (data[entryOffset + 4] | (data[entryOffset + 5] << 8) | (data[entryOffset + 6] << 16) | (data[entryOffset + 7] << 24)) >>> 0;

    if (startBlock === 0 || blockCount === 0 || bitCount === 0) return [];

    const fileOffset = startBlock * 512;
    const nibbles: number[] = [];
    let shiftReg = 0;
    for (let b = 0; b < bitCount; b++) {
      const byte = data[fileOffset + (b >> 3)];
      const bit = (byte >> (7 - (b & 7))) & 1;
      shiftReg = ((shiftReg << 1) | bit) & 0xff;
      if ((shiftReg & 0x80) !== 0) {
        nibbles.push(shiftReg);
        shiftReg = 0;
      }
    }
    return nibbles;
  }

  private readWoz1TrackNibbles(data: Uint8Array, trksOffset: number, trkEntryIdx: number): number[] {
    const trackDataOffset = trksOffset + trkEntryIdx * 6656;
    const bytesUsed = data[trackDataOffset + 6646] | (data[trackDataOffset + 6647] << 8);
    const bitCount = data[trackDataOffset + 6648] | (data[trackDataOffset + 6649] << 8);
    const count = bitCount > 0 ? bitCount : bytesUsed * 8;

    const nibbles: number[] = [];
    let shiftReg = 0;
    for (let b = 0; b < count; b++) {
      const byte = data[trackDataOffset + (b >> 3)];
      const bit = (byte >> (7 - (b & 7))) & 1;
      shiftReg = ((shiftReg << 1) | bit) & 0xff;
      if ((shiftReg & 0x80) !== 0) {
        nibbles.push(shiftReg);
        shiftReg = 0;
      }
    }
    return nibbles;
  }

  private createPaddedTrack(nibbles: number[]): Uint8Array {
    const trackBuf = new Uint8Array(6656);
    if (nibbles.length === 0) {
      trackBuf.fill(0xff);
      return trackBuf;
    }
    for (let i = 0; i < 6656; i++) {
      trackBuf[i] = nibbles[i % nibbles.length];
    }
    return trackBuf;
  }

  private extractSectorsToRawData(nibbles: number[], trackNum: number, nibbleToByte: Uint8Array): void {
    const L = nibbles.length;
    if (L === 0) return;
    const getAt = (idx: number) => nibbles[((idx % L) + L) % L];

    for (let i = 0; i < L; i++) {
      if (getAt(i) === 0xd5 && getAt(i + 1) === 0xaa && getAt(i + 2) === 0x96) {
        this.processTrackSectorHeader(nibbles, i, trackNum, nibbleToByte, getAt);
      }
    }
  }

  private processTrackSectorHeader(
    nibbles: number[],
    i: number,
    trackNum: number,
    nibbleToByte: Uint8Array,
    getAt: (idx: number) => number
  ): void {
    const trk = (((getAt(i + 5) << 1) | 1) & getAt(i + 6));
    const sec = (((getAt(i + 7) << 1) | 1) & getAt(i + 8));
    if (trk !== trackNum || sec < 0 || sec >= 16) return;

    const user = this.tryExtractSectorData(nibbles, i, nibbleToByte, getAt);
    if (user) {
      this.storeSectorRawData(trackNum, sec, user);
    }
  }

  private tryExtractSectorData(
    nibbles: number[],
    startPos: number,
    nibbleToByte: Uint8Array,
    getAt: (idx: number) => number
  ): Uint8Array | null {
    for (let j = startPos + 10; j < startPos + 60; j++) {
      if (getAt(j) === 0xd5 && getAt(j + 1) === 0xaa && getAt(j + 2) === 0xad) {
        const aux = new Uint8Array(86);
        const primary = new Uint8Array(256);
        let last = 0;
        let dataPos = j + 3;
        for (let y = 85; y >= 0; y--) {
          const val = nibbleToByte[getAt(dataPos++)] ^ last;
          aux[y] = val;
          last = val;
        }
        for (let y = 0; y < 256; y++) {
          const val = nibbleToByte[getAt(dataPos++)] ^ last;
          primary[y] = val;
          last = val;
        }
        return this.reconstruct6and2UserSector(aux, primary);
      }
    }
    return null;
  }

  private reconstruct6and2UserSector(aux: Uint8Array, primary: Uint8Array): Uint8Array {
    const user = new Uint8Array(256);
    let X = 86;
    for (let Y = 0; Y < 256; Y++) {
      X--;
      if (X < 0) X = 85;
      let A = primary[Y];
      const carry1 = aux[X] & 1;
      aux[X] >>= 1;
      A = ((A << 1) & 0xff) | carry1;
      const carry2 = aux[X] & 1;
      aux[X] >>= 1;
      A = ((A << 1) & 0xff) | carry2;
      user[Y] = A;
    }
    return user;
  }

  private storeSectorRawData(trackNum: number, sec: number, user: Uint8Array): void {
    const secOffset = (trackNum * 16 + sec) * 256;
    if (secOffset + 256 <= this.rawData.length) {
      this.rawData.set(user, secOffset);
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
  public cycleProvider?: () => number;

  private softswitchHandlers: Array<() => void>;
  private lastReadByteIndex: number = -1;

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

  public insertDisk(driveNum: 1 | 2, data: Uint8Array, name: string = 'Untitled.dsk'): FloppyDisk {
    const disk = new FloppyDisk(name, data);
    this.mount(driveNum, disk);
    return disk;
  }

  public eject(driveNum: 1 | 2): void {
    if (driveNum === 1) this.drive1 = null;
    else this.drive2 = null;
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

    if (this.q7) {
      return drive.isWriteProtected ? 0x80 : 0x00;
    }

    if ((offset & 0x0f) === 0x0c) {
      return this.readTrackByte(drive);
    }
    return 0x00;
  }

  private readTrackByte(drive: FloppyDisk): number {
    const trackIdx = Math.min(34, Math.max(0, Math.floor(this.trackQuarterSteps / 4)));
    const trackData = drive.tracks[trackIdx];
    if (!trackData || trackData.length === 0) return 0x00;

    if (this.cycleProvider) {
      const cycles = this.cycleProvider();
      const byteIndex = Math.floor(cycles / 32) % trackData.length;
      if (byteIndex === this.lastReadByteIndex) {
        return 0x00;
      }
      this.lastReadByteIndex = byteIndex;
      return trackData[byteIndex];
    }

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
