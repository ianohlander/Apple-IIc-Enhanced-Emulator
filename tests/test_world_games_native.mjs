import { BrowserRunner } from './cdpClient.mjs';
import path from 'path';
import fs from 'fs';

async function testWorldGamesNative() {
  const { proc, client } = await BrowserRunner.launch();
  try {
    const fileUrl = 'file:///' + path.resolve('index-standalone.html').replace(/\\/g, '/');
    await client.send('Page.navigate', { url: fileUrl });
    for (let i = 0; i < 100; i++) {
      await new Promise(r => setTimeout(r, 200));
      const check = await client.send('Runtime.evaluate', { 
        expression: 'Boolean(window.emulator && typeof window.parseFloppyDiskImage === "function")',
        returnByValue: true 
      });
      if (check?.result?.value === true) {
        console.log(`Emulator ready after ${(i + 1) * 200}ms`);
        break;
      }
    }

    const wozBuf = fs.readFileSync('disks/World Games/World Games disk 1A.woz');
    const base64Woz = wozBuf.toString('base64');

    // Boot directly with unmodified emulator engine at 50MHz
    await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const bin = atob("${base64Woz}");
          const uint8 = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) uint8[i] = bin.charCodeAt(i);
          const parsed = window.parseFloppyDiskImage(uint8, 'World Games disk 1A.woz');
          window.emulator.bootFloppy(parsed);
          window.emulator.setSpeed(50);
        })()
      `
    });

    console.log('Booted World Games on native engine. Waiting 12s for full ProDOS + DHGR menu load...');
    await new Promise(r => setTimeout(r, 12000));

    const status = await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const emu = window.emulator;
          emu.renderScreen();
          const canvas = document.getElementById('screen-canvas');
          const dataUrl = canvas ? canvas.toDataURL('image/png') : null;

          return {
            pc: emu.pc.toString(16),
            cycles: emu.totalCycles,
            track: emu.diskDrive.track,
            motorOn: emu.diskDrive.motorOn,
            isGraphicsMode: emu.isGraphicsMode,
            isHires: emu.isHires,
            dhires: emu.dhires,
            isPage2: emu.isPage2,
            isCol80: emu.isCol80,
            hiresMain: Array.from(emu.ram.subarray(0x2000, 0x4000)).filter(x=>x!==0).length,
            hiresAux: Array.from(emu.ram.subarray(0x12000, 0x14000)).filter(x=>x!==0).length,
            dataUrl
          };
        })()
      `,
      returnByValue: true
    });

    const val = status.result.value;
    console.log('Clean Native Run Status:', JSON.stringify({
      pc: val.pc,
      cycles: val.cycles,
      track: val.track,
      motorOn: val.motorOn,
      isGraphicsMode: val.isGraphicsMode,
      isHires: val.isHires,
      dhires: val.dhires,
      isPage2: val.isPage2,
      isCol80: val.isCol80,
      hiresMain: val.hiresMain,
      hiresAux: val.hiresAux
    }, null, 2));

    if (val.dataUrl) {
      const b64 = val.dataUrl.replace(/^data:image\/png;base64,/, '');
      fs.writeFileSync('C:/Users/ianoh/.gemini/antigravity/brain/aba576ae-a625-466a-a6fd-0e7cf3fc10a3/world_games_boot_result.png', Buffer.from(b64, 'base64'));
      console.log('Screenshot saved to world_games_boot_result.png');
    }

    if (val.isGraphicsMode && val.isHires && val.dhires && val.hiresMain > 500 && val.hiresAux > 500) {
      console.log('PASS: World Games booted cleanly to Double Hi-Res menu!');
    } else {
      console.error('FAIL: Unexpected status flags', val);
      process.exit(1);
    }

  } finally {
    try { await client.close(); } catch(e){}
    try { proc.kill(); } catch(e){}
  }
}

testWorldGamesNative();
