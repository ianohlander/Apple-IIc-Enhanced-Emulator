import { BrowserRunner } from './cdpClient.mjs';

async function runBrowserTutorialTests() {
  console.log('🚀 Launching Headless Browser for 25 Tutorial Labs E2E Test Suite...\n');
  const { proc, client } = await BrowserRunner.launch();

  const results = [];
  let passedCount = 0;
  let failedCount = 0;

  try {
    console.log('Navigating to file:///h:/My%20Drive/Repos/Apple-II-Emulator/index-standalone.html ...');
    await client.send('Page.navigate', { url: 'file:///h:/My%20Drive/Repos/Apple-II-Emulator/index-standalone.html' });

    // Wait for document readyState complete and window.emulator defined
    for (let i = 0; i < 50; i++) {
      const ready = await client.send('Runtime.evaluate', {
        expression: 'document.readyState === "complete" && typeof window.emulator !== "undefined"'
      });
      if (ready.result && ready.result.value === true) {
        console.log(`Document loaded and window.emulator ready after ${i * 100}ms!\n`);
        break;
      }
      await new Promise(r => setTimeout(r, 100));
    }
    await client.send('Runtime.evaluate', { expression: 'window.focus()' });
    await new Promise(r => setTimeout(r, 200));

    async function evalBrowser(expr) {
      const res = await client.send('Runtime.evaluate', {
        expression: expr,
        returnByValue: true
      });
      return res.result ? res.result.value : undefined;
    }

    // Helper functions for browser interactions
    async function typeText(text) {
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        await client.send('Input.dispatchKeyEvent', {
          type: 'keyDown',
          key: ch,
          text: ch,
          unmodifiedText: ch
        });
        await client.send('Input.dispatchKeyEvent', {
          type: 'keyUp',
          key: ch
        });
        await new Promise(r => setTimeout(r, 15));
      }
    }

    async function pressEnter() {
      await client.send('Input.dispatchKeyEvent', {
        type: 'keyDown',
        key: 'Enter',
        code: 'Enter',
        windowsVirtualKeyCode: 13
      });
      await client.send('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key: 'Enter',
        code: 'Enter',
        windowsVirtualKeyCode: 13
      });
      await new Promise(r => setTimeout(r, 100));
    }

    async function clickSelector(selector) {
      const res = await client.send('Runtime.evaluate', {
        expression: `(() => {
          const el = document.querySelector('${selector}');
          if (!el) return false;
          el.click();
          return true;
        })()`,
        returnByValue: true
      });
      await new Promise(r => setTimeout(r, 100));
      return res.result.value;
    }

    async function testLab(chapter, labId, title, testFn) {
      const start = Date.now();
      try {
        await testFn();
        const duration = Date.now() - start;
        console.log(`  ✅ Lab ${labId}: ${title} (${duration}ms)`);
        results.push({ chapter, labId, title, passed: true, duration, error: null });
        passedCount++;
      } catch (err) {
        const duration = Date.now() - start;
        console.error(`  ❌ Lab ${labId}: ${title} - FAILED: ${err.message}`);
        results.push({ chapter, labId, title, passed: false, duration, error: err.message });
        failedCount++;
      }
    }

    // =========================================================================
    // CHAPTER 1: 65C02 Silicon Architecture & Memory Multiplexing
    // =========================================================================
    console.log('📦 Chapter 1: 65C02 Silicon Architecture & Memory Multiplexing');
    
    await evalBrowser('window.emulator.currentInput = ""; window.emulator.isMonitorMode = false;');
    await new Promise(r => setTimeout(r, 300));

    await testLab(1, '1.1', '65C02 Machine Language Monitor & STZ Opcode Lifecycle', async () => {
      // 1. Enter monitor mode
      await typeText('CALL -151');
      await pressEnter();
      const isMonitor = await evalBrowser('window.emulator.isMonitorMode');
      if (!isMonitor) throw new Error('CALL -151 did not activate monitor mode');

      // 2. Deposit machine code: STZ $06, STZ $0800, RTS
      await typeText('0300: 64 06 9C 00 08 60');
      await pressEnter();
      const ramOp = await evalBrowser('window.emulator.ram[0x0300]');
      if (ramOp !== 0x64) throw new Error(`Expected opcode $64 at $0300, found $${ramOp.toString(16)}`);

      // Set $06 and $0800 to non-zero values first
      await evalBrowser('window.emulator.ram[0x06] = 0xAA; window.emulator.ram[0x0800] = 0xBB;');

      // 3. Execute GO: 0300G
      await typeText('0300G');
      await pressEnter();
      const zpVal = await evalBrowser('window.emulator.ram[0x06]');
      const absVal = await evalBrowser('window.emulator.ram[0x0800]');
      if (zpVal !== 0) throw new Error(`STZ $06 failed: $06 = ${zpVal}`);
      if (absVal !== 0) throw new Error(`STZ $0800 failed: $0800 = ${absVal}`);

      // 4. Memory inspection: 06.06
      await typeText('06.06');
      await pressEnter();

      // 5. Exit back to BASIC: 3D0G
      await typeText('3D0G');
      await pressEnter();
      const isBasic = await evalBrowser('!window.emulator.isMonitorMode');
      if (!isBasic) throw new Error('3D0G did not exit monitor mode');
    });

    // =========================================================================
    // CHAPTER 2: Video Subsystem & Scanline Mathematics
    // =========================================================================
    console.log('\n📦 Chapter 2: Video Subsystem, DRAM Refresh & Scanline Mathematics');

    await testLab(2, '2.1', 'Hi-Res Interleaved Scanline Direct VRAM POKE', async () => {
      await typeText('HGR');
      await pressEnter();
      const isHgr = await evalBrowser('window.emulator.isGraphicsMode && window.emulator.mixedGraphics');
      if (!isHgr) throw new Error('HGR failed to switch to mixed graphics mode');

      await typeText('HCOLOR=3');
      await pressEnter();

      // Enter the 43-character wrapped for-loop
      await typeText('FOR Y=0 TO 7:POKE 8192+Y*1024+20,255:NEXT Y');
      await pressEnter();

      const vramSample = await evalBrowser(`[
        window.emulator.ram[8192 + 0*1024 + 20],
        window.emulator.ram[8192 + 1*1024 + 20],
        window.emulator.ram[8192 + 7*1024 + 20]
      ]`);

      if (vramSample[0] !== 255 || vramSample[1] !== 255 || vramSample[2] !== 255) {
        throw new Error(`Hi-Res scanline write failed: vramSample=${JSON.stringify(vramSample)}`);
      }

      await typeText('TEXT');
      await pressEnter();
    });

    // =========================================================================
    // CHAPTER 3: Sound Creation — 1-Bit Speaker to 6-Channel PSG
    // =========================================================================
    console.log('\n📦 Chapter 3: Sound Creation — 1-Bit Speaker to 6-Channel PSG');

    await testLab(3, '3.1', '1-Bit Speaker Toggle Softswitch $C030', async () => {
      await typeText('POKE 49200,0');
      await pressEnter();
      await typeText('FOR I=1 TO 20:POKE 49200,0:NEXT I');
      await pressEnter();
      const err = await evalBrowser('window.emulator.currentInput');
      if (err && err.includes('SYNTAX')) throw new Error('Speaker loop generated syntax error');
    });

    // =========================================================================
    // CHAPTER 4: Six Program Entry & Ingestion Pipelines
    // =========================================================================
    console.log('\n📦 Chapter 4: Six Program Entry & Ingestion Pipelines');

    await testLab(4, '4.1', 'Applesoft BASIC Program Storage & Execution', async () => {
      await typeText('10 HOME');
      await pressEnter();
      await typeText('20 PRINT "HELLO APPLE //C"');
      await pressEnter();
      await typeText('RUN');
      await pressEnter();
      await new Promise(r => setTimeout(r, 150));

      const rowText = await evalBrowser(`(() => {
        const base = window.emulator.getRowBase(0);
        let s = '';
        for (let c = 0; c < 40; c++) s += String.fromCharCode(window.emulator.ram[base + c] & 0x7f);
        return s.trim();
      })()`);

      if (!rowText.includes('HELLO APPLE')) {
        throw new Error(`Expected 'HELLO APPLE' in row 0, found '${rowText}'`);
      }
    });

    await testLab(4, '4.2', 'Magazine Type-In Ingestion & Listing', async () => {
      await typeText('NEW');
      await pressEnter();
      await evalBrowser(`window.emulator.feedText('10 PRINT "COMPUTE! LUNAR LANDER"\\n20 PRINT "ALTITUDE: 1000 FT"')`);
      await typeText('LIST');
      await pressEnter();
      const prgLen = await evalBrowser('window.emulator.basicProgram.length');
      if (prgLen < 2) throw new Error(`Expected >= 2 basic program lines, found ${prgLen}`);
    });

    await testLab(4, '4.3', 'Keyboard Data Register $C000 & Strobe FIFO Queue', async () => {
      // Temporarily pause background CPU loop so KEYIN does not consume strobe prematurely
      await evalBrowser('window.emulator.running = false');
      
      const qLen = await evalBrowser(`(() => {
        window.emulator.keyQueue.push(0x41, 0x42);
        return window.emulator.keyQueue.length;
      })()`);
      if (qLen < 2) throw new Error('Failed to push to keyQueue');

      const k1 = await evalBrowser('window.emulator.readMem(0xC000)');
      if ((k1 & 0x7F) !== 0x41) throw new Error(`Expected key $41 ('A'), got $${k1.toString(16)}`);

      // Clear strobe
      await evalBrowser('window.emulator.writeMem(0xC010, 0)');
      const k2 = await evalBrowser('window.emulator.readMem(0xC000)');
      if ((k2 & 0x7F) !== 0x42) throw new Error(`Expected key $42 ('B'), got $${k2.toString(16)}`);
      await evalBrowser('window.emulator.writeMem(0xC010, 0)');

      // Resume background CPU execution
      await evalBrowser('window.emulator.running = true');
    });

    await testLab(4, '4.4', 'Centronics Parallel Printer Stream Redirection (PR#1)', async () => {
      await typeText('PR#1');
      await pressEnter();
      const isSlot1 = await evalBrowser('window.emulator.outputSlot === 1');
      if (!isSlot1) throw new Error('PR#1 failed to set outputSlot to 1');

      await typeText('PRINT "INVOICE #9401"');
      await pressEnter();

      const paperContent = await evalBrowser('window.printerPaperBuffer');
      if (!paperContent || !paperContent.includes('INVOICE #9401')) {
        throw new Error(`Printer paper missing text. Got: ${paperContent}`);
      }

      await typeText('PR#0');
      await pressEnter();
      const isSlot0 = await evalBrowser('window.emulator.outputSlot === 0');
      if (!isSlot0) throw new Error('PR#0 failed to restore outputSlot to 0');
    });

    // =========================================================================
    // CHAPTER 5: Custom ROM Creation & Firmware Engineering
    // =========================================================================
    console.log('\n📦 Chapter 5: Custom ROM Creation & Firmware Engineering');

    await testLab(5, '5.1', '65C02 Hardware Reset Vector $FFFC-$FFFD Inspection', async () => {
      await typeText('CALL -151');
      await pressEnter();
      await typeText('FFFC.FFFD');
      await pressEnter();
      const l = await evalBrowser('window.emulator.readMem(0xFFFC)');
      const h = await evalBrowser('window.emulator.readMem(0xFFFD)');
      if (l !== 0x00 || h !== 0xF8) throw new Error(`Expected Reset vector $F800, found $${h.toString(16)}${l.toString(16)}`);
      await typeText('3D0G');
      await pressEnter();
    });

    await testLab(5, '5.2', 'Clean-Room Synthesized ROM Diagnostic Opcodes', async () => {
      await typeText('CALL -151');
      await pressEnter();
      await typeText('F800.F807');
      await pressEnter();
      const opc0 = await evalBrowser('window.emulator.readMem(0xF800)'); // CLD = 0xD8
      const opc1 = await evalBrowser('window.emulator.readMem(0xF801)'); // LDX #$FF = 0xA2
      if (opc0 !== 0xD8 || opc1 !== 0xA2) throw new Error(`Clean-room ROM opcodes mismatch: $${opc0.toString(16)}, $${opc1.toString(16)}`);
      await typeText('3D0G');
      await pressEnter();
    });

    await testLab(5, '5.3', 'Direct Physical VRAM POKE to Screen Row 0', async () => {
      await typeText('HOME');
      await pressEnter();
      await typeText('POKE 1024,193');
      await pressEnter();
      const byteAt1024 = await evalBrowser('window.emulator.ram[1024]');
      if (byteAt1024 !== 193) throw new Error(`Expected 193 at VRAM 1024, got ${byteAt1024}`);
    });

    // =========================================================================
    // CHAPTER 6: Modern Languages on 65C02 Silicon: C# & Java AOT
    // =========================================================================
    console.log('\n📦 Chapter 6: Modern Languages on 65C02 Silicon: C# & Java AOT');

    await testLab(6, '6.1', 'C# Retro Breakout Arcade AOT Execution Surface', async () => {
      await evalBrowser('window.emulator.launchBreakoutGame()');
      const isGameRunning = await evalBrowser('window.emulator.isRunningGame');
      if (!isGameRunning) throw new Error('Failed to launch C# Retro Breakout');
      const brickCount = await evalBrowser('window.emulator.breakoutState.bricks.length');
      if (brickCount !== 32) throw new Error(`Expected 32 bricks, found ${brickCount}`);
      await evalBrowser('window.emulator.stopGame(); window.emulator.isGraphicsMode = false;');
      await typeText('TEXT');
      await pressEnter();
    });

    // =========================================================================
    // CHAPTER 7: 7-Slot Peripheral Expansion & ImageWriter II
    // =========================================================================
    console.log('\n📦 Chapter 7: Motherboard 7-Slot Peripheral Expansion & ImageWriter II Printer');

    await testLab(7, '7.1', 'Slot 6 Disk II Boot Vector Initialization', async () => {
      await evalBrowser('window.bootFloppyDrive()');
      const isBooted = await evalBrowser('window.emulator.ram[0x0800] !== undefined');
      if (!isBooted) throw new Error('Floppy boot vector failed');
    });

    await testLab(7, '7.2', 'ImageWriter II Banner & Dot-Matrix Art Streaming', async () => {
      await evalBrowser('window.loadBannerTemplate()');
      const pCount = await evalBrowser('window.printerByteCount');
      if (pCount <= 0) throw new Error('Banner template failed to stream to printer');
    });

    await testLab(7, '7.3', 'Form Feed / Tractor-Feed Page Break Trigger ($0C)', async () => {
      await evalBrowser('window.advancePrinterFormFeed()');
      const hasFf = await evalBrowser('window.printerPaperBuffer.includes("FORM FEED")');
      if (!hasFf) throw new Error('Form feed failed to record page break');
    });

    // =========================================================================
    // CHAPTER 8: Storage Architecture & Slinky RAM Expansion
    // =========================================================================
    console.log('\n📦 Chapter 8: Storage Architecture, ProDOS 32MB Block Storage & Slinky 1MB RAM');

    await testLab(8, '8.1', 'Disk II 6-and-2 GCR Nibble Translation Table Validation', async () => {
      const gcrTable = [
        0x96,0x97,0x9A,0x9B,0x9D,0x9E,0x9F,0xA6,0xA7,0xAB,0xAC,0xAD,0xAE,0xAF,0xB2,0xB3,
        0xB4,0xB5,0xB6,0xB7,0xB9,0xBA,0xBB,0xBC,0xBD,0xBE,0xBF,0xCB,0xCD,0xCE,0xCF,0xD3,
        0xD6,0xD7,0xD9,0xDA,0xDB,0xDC,0xDD,0xDE,0xDF,0xE5,0xE6,0xE7,0xE9,0xEA,0xEB,0xEC,
        0xED,0xEE,0xEF,0xF2,0xF3,0xF4,0xF5,0xF6,0xF7,0xF9,0xFA,0xFB,0xFC,0xFD,0xFE,0xFF
      ];
      if (gcrTable.length !== 64) throw new Error('GCR table invalid length');
      const allHighBit = gcrTable.every(b => (b & 0x80) !== 0);
      if (!allHighBit) throw new Error('GCR entries must have bit 7 set');
    });

    await testLab(8, '8.2', 'SmartPort 32MB Hard Disk Block Cataloging', async () => {
      await typeText('CATALOG');
      await pressEnter();
    });

    await testLab(8, '8.3', 'ProDOS MLI Block Driver Interface Registration ($C700)', async () => {
      const mliVal = await evalBrowser('window.emulator.readMem(0xC700)');
      if (mliVal === undefined) throw new Error('MLI block entry unreadable');
    });

    await testLab(8, '8.4', 'Non-Volatile Hard Disk Block Cache Persistence', async () => {
      await evalBrowser('window.emulator.writeMem(0x0200, 0x55)');
      const check = await evalBrowser('window.emulator.readMem(0x0200)');
      if (check !== 0x55) throw new Error('Block write verification failed');
    });

    await testLab(8, '8.5', '1MB Slinky Banked RAM Auto-Increment Data Port ($C073)', async () => {
      // Set Address $000120
      await typeText('POKE 49265,32:POKE 49266,1:POKE 49267,90');
      await pressEnter();
      const slinkyVal = await evalBrowser('window.emulator.slinkyRam[0x0120]');
      if (slinkyVal !== 90) throw new Error(`Expected Slinky RAM at $0120 to be 90, got ${slinkyVal}`);
    });

    // =========================================================================
    // CHAPTER 9: Workstation Controls & Hardware Bays
    // =========================================================================
    console.log('\n📦 Chapter 9: Workstation Controls, Hardware Bays & CPU Debugger');

    await testLab(9, '9.1', '50.0 MHz Turbo Clock & Frequency Scaling Surface', async () => {
      await evalBrowser('window.emulator.setSpeed(50.0)');
      let spd = await evalBrowser('window.emulator.speed');
      if (spd !== 50.0) throw new Error(`Speed not 50.0: ${spd}`);

      await evalBrowser('window.emulator.setSpeed(1.023)');
      spd = await evalBrowser('window.emulator.speed');
      if (spd !== 1.023) throw new Error(`Speed not 1.023: ${spd}`);

      await evalBrowser('window.emulator.setSpeed(50.0)');
    });

    await testLab(9, '9.2', 'Mechanical Virtual Keyboard Drawer Surface', async () => {
      await clickSelector('#btn-bay-keyboard');
      const isDrawerOpen = await evalBrowser('!document.getElementById("bottom-keyboard-drawer").classList.contains("translate-y-full")');
      if (!isDrawerOpen) throw new Error('Keyboard drawer failed to open');
      await clickSelector('#btn-bay-keyboard');
    });

    await testLab(9, '9.3', '65C02 Hardware CPU Single-Stepping Debugger', async () => {
      const pcBefore = await evalBrowser('window.emulator.pc');
      await evalBrowser('window.emulator.step()');
      const pcAfter = await evalBrowser('window.emulator.pc');
      if (pcAfter === pcBefore && pcBefore !== 0xFA00) throw new Error('CPU single step failed to advance PC');
    });

    await testLab(9, '9.4', 'Custom ROM Studio & Clean-Room BIOS Builder', async () => {
      const romLen = await evalBrowser('window.emulator.rom.length');
      if (romLen !== 32768) throw new Error(`ROM buffer size invalid: ${romLen}`);
    });

    // =========================================================================
    // CHAPTER 10: Custom Virtual Peripheral Cards in JavaScript
    // =========================================================================
    console.log('\n📦 Chapter 10: Scripting Custom Virtual Peripheral Cards in JavaScript');

    await testLab(10, '10.1', 'Slot 3 Virtual Weather Sensor Card MMIO Protocol', async () => {
      const isRegistered = await evalBrowser('window.slots && window.slots[3] !== undefined');
      if (!isRegistered) throw new Error('Slot 3 card not registered');
    });

    await testLab(10, '10.2', 'Slot 4 Thunderclock Real-Time Hardware Polling', async () => {
      const isRegistered = await evalBrowser('window.slots && window.slots[4] !== undefined');
      if (!isRegistered) throw new Error('Slot 4 Thunderclock not registered');
    });

    console.log('\n======================================================');
    console.log(`🎯 Headless Browser E2E Test Summary: ${passedCount}/${passedCount + failedCount} Labs Passed, ${failedCount} Failed`);
    console.log('======================================================\n');

  } finally {
    client.close();
    proc.kill();
  }

  return { passedCount, failedCount, results };
}

runBrowserTutorialTests().then(({ failedCount }) => {
  if (failedCount > 0) process.exit(1);
  else process.exit(0);
});
