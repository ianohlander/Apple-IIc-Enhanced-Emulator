import { BrowserRunner } from './cdpClient.mjs';
import path from 'path';
import fs from 'fs';

async function testWorldGamesNative() {
  const { proc, client } = await BrowserRunner.launch();
  try {
    const fileUrl = 'file:///' + path.resolve('index-standalone.html').replace(/\\/g, '/');
    await client.send('Page.navigate', { url: fileUrl });
    for (let i = 0; i < 50; i++) {
      await new Promise(r => setTimeout(r, 100));
      const check = await client.send('Runtime.evaluate', { expression: 'Boolean(window.emulator && window.parseFloppyDiskImage)' });
      if (check.result.value) break;
    }

    const wozBuf = fs.readFileSync('disks/World Games/World Games disk 1A.woz');
    const base64Woz = wozBuf.toString('base64');

    const result = await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          try {

            const rawB64 = "${base64Woz}";
            const bin = atob(rawB64);
            const uint8 = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) uint8[i] = bin.charCodeAt(i);

            const parsed = window.parseFloppyDiskImage(uint8, 'World Games disk 1A.woz');
            window.emulator.bootFloppy(parsed);
            
            const r0800 = Array.from(window.emulator.ram.subarray(0x0800, 0x0820)).map(x => x.toString(16).padStart(2, '0')).join(' ');

            // Pre-load ProDOS Block 0 (Sector 0 to $0800, Sector 2 to $0900)
            const sec0 = parsed.rawData.subarray(0, 256);
            const sec2 = parsed.rawData.subarray(2 * 256, 3 * 256);
            window.emulator.ram.set(sec0, 0x0800);
            window.emulator.ram.set(sec2, 0x0900);
            window.emulator.ram[0x26] = 0x00;
            window.emulator.ram[0x27] = 0x0a;
            window.emulator.ram[0x3d] = 0x02;
            window.emulator.ram[0x2b] = 0x60;
            window.emulator.ram[0x43] = 0x60;
            window.emulator.a = 0x00;
            window.emulator.x = 0x60;
            window.emulator.y = 0x00;
            window.emulator.pc = 0x0801;

            window.emulator.runCycles(500000);
            const p1 = window.emulator.pc.toString(16);
            const g1 = window.emulator.isGraphicsMode;
            const h1 = window.emulator.isHires;

            window.emulator.runCycles(2000000);
            const p2 = window.emulator.pc.toString(16);
            const g2 = window.emulator.isGraphicsMode;
            const h2 = window.emulator.isHires;

            const nonBlankRows = [];
            for (let r = 0; r < 24; r++) {
              const base = window.emulator.getRowBase(r);
              let s = '';
              for (let c = 0; c < 40; c++) {
                const b = window.emulator.ram[base + c];
                const ch = b & 0x7f;
                s += (ch >= 32 && ch <= 126) ? String.fromCharCode(ch) : ' ';
              }
              if (s.trim()) nonBlankRows.push({ r, text: s.trim() });
            }

            return {
              p1, g1, h1,
              p2, g2, h2,
              totalCycles: window.emulator.totalCycles,
              nonBlankRows,
              hiresNonZero: Array.from(window.emulator.ram.subarray(0x2000, 0x4000)).filter(x=>x!==0).length
            };
          } catch(e) {
            return { error: e.message, stack: e.stack };
          }
        })()
      `,
      returnByValue: true
    });

    console.log('Result:', JSON.stringify(result.result.value, null, 2));

  } finally {
    try { await client.close(); } catch(e){}
    try { proc.kill(); } catch(e){}
  }
}

testWorldGamesNative();
