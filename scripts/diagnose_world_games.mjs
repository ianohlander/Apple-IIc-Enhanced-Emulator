import fs from 'fs';

function parseFloppyDiskImage(data, filename) {
  let uint8 = data;
  if (uint8.length >= 64 && uint8[0] === 0x32 && uint8[1] === 0x49 && uint8[2] === 0x4D && uint8[3] === 0x47) {
    uint8 = uint8.subarray(64);
  }
  const isWoz = uint8.length >= 8 && uint8[0] === 0x57 && uint8[1] === 0x4f;
  const tracks = [];
  const rawData = new Uint8Array(143360);

  if (isWoz) {
    const isWoz2 = uint8[3] === 0x32;
    let offset = 12;
    let tmapOffset = -1, trksOffset = -1;
    while (offset + 8 <= uint8.length) {
      const chunkId = String.fromCharCode(uint8[offset], uint8[offset + 1], uint8[offset + 2], uint8[offset + 3]);
      const chunkSize = (uint8[offset + 4] | (uint8[offset + 5] << 8) | (uint8[offset + 6] << 16) | (uint8[offset + 7] << 24)) >>> 0;
      const dataOffset = offset + 8;
      if (chunkId === 'TMAP') tmapOffset = dataOffset;
      if (chunkId === 'TRKS') trksOffset = dataOffset;
      offset = dataOffset + chunkSize;
    }

    if (tmapOffset !== -1 && trksOffset !== -1) {
      const DISK_BYTE_TO_NIBBLE = [
        0x96, 0x97, 0x9A, 0x9B, 0x9D, 0x9E, 0x9F, 0xA6,
        0xA7, 0xAB, 0xAC, 0xAD, 0xAE, 0xAF, 0xB2, 0xB3,
        0xB4, 0xB5, 0xB6, 0xB7, 0xB9, 0xBA, 0xBB, 0xBC,
        0xBD, 0xBE, 0xBF, 0xCB, 0xCD, 0xCE, 0xCF, 0xD3,
        0xD6, 0xD7, 0xD9, 0xDA, 0xDB, 0xDC, 0xDD, 0xDE,
        0xDF, 0xE5, 0xE6, 0xE7, 0xE9, 0xEA, 0xEB, 0xEC,
        0xED, 0xEE, 0xEF, 0xF2, 0xF3, 0xF4, 0xF5, 0xF6,
        0xF7, 0xF9, 0xFA, 0xFB, 0xFC, 0xFD, 0xFE, 0xFF
      ];
      const nibbleToByte = new Uint8Array(256);
      DISK_BYTE_TO_NIBBLE.forEach((nib, byte) => { nibbleToByte[nib] = byte; });

      for (let trackNum = 0; trackNum < 35; trackNum++) {
        const trkEntryIdx = uint8[tmapOffset + trackNum * 4];
        let nibbles = [];
        if (trkEntryIdx !== 255) {
          if (isWoz2) {
            const entryOffset = trksOffset + trkEntryIdx * 8;
            const startBlock = uint8[entryOffset] | (uint8[entryOffset + 1] << 8);
            const blockCount = uint8[entryOffset + 2] | (uint8[entryOffset + 3] << 8);
            const bitCount = (uint8[entryOffset + 4] | (uint8[entryOffset + 5] << 8) | (uint8[entryOffset + 6] << 16) | (uint8[entryOffset + 7] << 24)) >>> 0;
            if (startBlock > 0 && blockCount > 0 && bitCount > 0) {
              const fileOffset = startBlock * 512;
              let shiftReg = 0;
              for (let b = 0; b < bitCount; b++) {
                const byte = uint8[fileOffset + (b >> 3)];
                const bit = (byte >> (7 - (b & 7))) & 1;
                shiftReg = ((shiftReg << 1) | bit) & 0xff;
                if ((shiftReg & 0x80) !== 0) {
                  nibbles.push(shiftReg);
                  shiftReg = 0;
                }
              }
            }
          }
        }
        const trackBuf = new Uint8Array(6656);
        if (nibbles.length === 0) trackBuf.fill(0xff);
        else for (let i = 0; i < 6656; i++) trackBuf[i] = nibbles[i % nibbles.length];
        tracks.push(trackBuf);

        // Extract sectors
        const L = nibbles.length;
        if (L > 0) {
          const getAt = (idx) => nibbles[((idx % L) + L) % L];
          for (let i = 0; i < L; i++) {
            if (getAt(i) === 0xd5 && getAt(i + 1) === 0xaa && getAt(i + 2) === 0x96) {
              const trk = (((getAt(i + 5) << 1) | 1) & getAt(i + 6));
              const sec = (((getAt(i + 7) << 1) | 1) & getAt(i + 8));
              if (trk === trackNum && sec >= 0 && sec < 16) {
                for (let j = i + 10; j < i + 60; j++) {
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
                    function reconstruct6and2UserSector(aux, primary) {
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
                    const user = reconstruct6and2UserSector(aux, primary);
                    const secOffset = (trackNum * 16 + sec) * 256;
                    if (secOffset + 256 <= rawData.length) rawData.set(user, secOffset);
                    break;
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return { tracks, rawData };
}

const wozBuf = fs.readFileSync('disks/World Games/World Games disk 1A.woz');
const parsed = parseFloppyDiskImage(new Uint8Array(wozBuf), 'World Games disk 1A.woz');

console.log('Track 0 length:', parsed.tracks[0] ? parsed.tracks[0].length : 0);
if (parsed.tracks[0]) {
  console.log('Track 0 first 32 nibbles:');
  console.log(Array.from(parsed.tracks[0].subarray(0, 32)).map(x => x.toString(16).padStart(2, '0')).join(' '));
  // Count how many address headers D5 AA 96 are on track 0:
  let headers = 0;
  for (let i = 0; i < parsed.tracks[0].length; i++) {
    if (parsed.tracks[0][i] === 0xd5 && parsed.tracks[0][(i+1)%parsed.tracks[0].length] === 0xaa && parsed.tracks[0][(i+2)%parsed.tracks[0].length] === 0x96) {
      headers++;
    }
  }
  console.log('Track 0 standard headers (D5 AA 96) count:', headers);
}

const sec0 = parsed.rawData.subarray(0, 256);
const sec2 = parsed.rawData.subarray(2 * 256, 3 * 256);

console.log('Testing 6502 CPU boot of Sector 0:');
const ram = new Uint8Array(65536);
ram.set(sec0, 0x0800);
ram.set(sec2, 0x0900);

ram[0x2b] = 0x60;
ram[0x43] = 0x60;

// Disk II track 0
const track0 = parsed.tracks[0];
let trackBytePointer = 0;
let lastDeliveredCycle = -32;
let totalCycles = 0;

function readDiskLatch() {
  const elapsed = totalCycles - lastDeliveredCycle;
  if (elapsed < 32) {
    return 0x00;
  }
  const steps = Math.max(1, Math.min(100, Math.floor(elapsed / 32)));
  trackBytePointer = (trackBytePointer + steps) % track0.length;
  lastDeliveredCycle = totalCycles;
  return track0[trackBytePointer];
}

console.log('Disk latch test: reading first 10 delivered bytes:');
const sample = [];
for (let i = 0; i < 10; i++) {
  totalCycles += 32;
  sample.push(readDiskLatch().toString(16).padStart(2, '0'));
}
console.log('Delivered sample:', sample.join(' '));


