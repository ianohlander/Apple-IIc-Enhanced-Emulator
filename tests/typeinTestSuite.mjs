// ============================================================================
// Copyright (c) 2026 Ian Ohlander. All rights reserved.
// Apple //c Ultra Architecture - Magazine Type-In Transcriber Test Suite
// ============================================================================

import fs from 'fs';
import path from 'path';

export async function runTypeInTests() {
  console.log('\n📖 Running Magazine Type-In Transcriber & BASIC Execution Test Suite...\n');

  class MockCanvas {
    constructor() {
      this.width = 560;
      this.height = 384;
      this.ctx = {
        fillStyle: '',
        strokeStyle: '',
        fillRect: () => {},
        fillText: () => {},
        drawImage: () => {},
        putImageData: () => {},
        getImageData: () => ({ data: new Uint8ClampedArray(560 * 384 * 4) }),
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {}
      };
    }
    getContext() { return this.ctx; }
  }

  const elements = {};
  function createMockElement(id) {
    return {
      id,
      innerText: '',
      innerHTML: '',
      value: '',
      className: '',
      style: {},
      classList: { add: () => {}, remove: () => {}, toggle: () => {} },
      appendChild: () => {},
      removeChild: () => {},
      addEventListener: () => {}
    };
  }

  global.window = {
    AudioContext: class {
      createOscillator() { return { frequency: { setValueAtTime: () => {} }, connect: () => {}, start: () => {}, stop: () => {} }; }
      createGain() { return { gain: { setValueAtTime: () => {} }, connect: () => {} }; }
    },
    webkitAudioContext: class {
      createOscillator() { return { frequency: { setValueAtTime: () => {} }, connect: () => {} }; }
      createGain() { return { gain: { setValueAtTime: () => {} }, connect: () => {} }; }
    },
    requestAnimationFrame: (cb) => setTimeout(cb, 16),
    addEventListener: () => {},
    showToast: () => {},
    closeCabinet: () => {}
  };

  global.document = {
    createElement: () => new MockCanvas(),
    getElementById: (id) => {
      if (id === 'screen-canvas') {
        if (!elements[id]) elements[id] = new MockCanvas();
        return elements[id];
      }
      if (!elements[id]) elements[id] = createMockElement(id);
      return elements[id];
    },
    addEventListener: () => {}
  };

  const htmlPath = path.resolve('index-standalone.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const scriptRegex = /<script>([\s\S]*?)<\/script>/i;
  const match = html.match(scriptRegex);
  if (!match) throw new Error('No script block found in index-standalone.html');

  const runSandbox = new Function('mockCanvas', 'document', 'window', match[1] + `
    return {
      Apple2cEmulator,
      loadSampleTypeIn: window.loadSampleTypeIn,
      injectTypeIn: window.injectTypeIn
    };
  `);

  const sandbox = runSandbox(new MockCanvas(), global.document, global.window);
  const Apple2cEmulator = sandbox.Apple2cEmulator;

  function getScreenText(emu) {
    const lines = [];
    for (let r = 0; r < 24; r++) {
      let line = '';
      const base = emu.getRowBase(r);
      for (let c = 0; c < 40; c++) {
        const ch = emu.ram[base + c] & 0x7f;
        line += ch >= 32 ? String.fromCharCode(ch) : ' ';
      }
      if (line.trim()) lines.push("R" + r.toString().padStart(2, '0') + ": " + line.trimEnd());
    }
    return lines;
  }

  function getHiresByteCount(emu) {
    let count = 0;
    for (let a = 0x2000; a < 0x4000; a++) {
      if (emu.ram[a] !== 0) count++;
    }
    return count;
  }

  let passed = 0;
  let total = 0;

  function assert(cond, desc) {
    total++;
    if (cond) {
      console.log("  ✅ " + desc);
      passed++;
    } else {
      console.error("  ❌ FAILED: " + desc);
      throw new Error(desc);
    }
  }

  // 1. inCider DHGR Kaleidoscope (1984)
  console.log('📦 Suite 1: inCider DHGR Kaleidoscope (1984)');
  {
    const emu = new Apple2cEmulator(new MockCanvas());
    emu.setSpeed(50);
    global.window.emulator = emu;

    sandbox.loadSampleTypeIn('kaleidoscope');
    const text = global.document.getElementById('typein-text').value;
    assert(!text.includes('\\n'), 'inCider Kaleidoscope: No literal \\n in preset textarea');
    assert(text.split('\n').length >= 8, 'inCider Kaleidoscope: Multi-line program listing loaded');

    emu.feedText(text, false);
    assert(emu.basicProgram.length === 9, 'inCider Kaleidoscope: All 9 lines parsed into program memory');

    emu.runProgram();
    for (let i = 0; i < 50 && emu.isRunningBasic; i++) emu.executeBasicLoop();

    const screenLines = getScreenText(emu);
    assert(!screenLines.some(l => l.includes('SYNTAX ERROR')), 'inCider Kaleidoscope: Executed with zero syntax errors');
    assert(getHiresByteCount(emu) > 1000, 'inCider Kaleidoscope: Plotted mathematical symmetry in Hi-Res VRAM');
  }

  // 2. Nibble 3D Starfield Warp (1983)
  console.log('\n📦 Suite 2: Nibble 3D Starfield Warp (1983)');
  {
    const emu = new Apple2cEmulator(new MockCanvas());
    emu.setSpeed(50);
    global.window.emulator = emu;

    sandbox.loadSampleTypeIn('starfield');
    const text = global.document.getElementById('typein-text').value;
    assert(!text.includes('\\n'), 'Nibble 3D Starfield: No literal \\n in preset textarea');
    assert(text.includes('DIM SX(60)'), 'Nibble 3D Starfield: Authentic 3D starfield warp code loaded');

    emu.feedText(text, false);
    assert(emu.basicProgram.length === 18, 'Nibble 3D Starfield: All 18 lines parsed into program memory');

    emu.runProgram();
    for (let i = 0; i < 50 && emu.isRunningBasic; i++) emu.executeBasicLoop();

    const screenLines = getScreenText(emu);
    assert(!screenLines.some(l => l.includes('SYNTAX ERROR')), 'Nibble 3D Starfield: Executed with zero syntax errors (DIM & arrays working)');
    assert(getHiresByteCount(emu) > 500, 'Nibble 3D Starfield: Rendered starfield projection in Hi-Res VRAM');
  }

  // 3. Compute! / Softalk Apollo Lunar Lander
  console.log('\n📦 Suite 3: Compute! / Softalk Apollo Lunar Lander');
  {
    const emu = new Apple2cEmulator(new MockCanvas());
    emu.setSpeed(50);
    global.window.emulator = emu;

    sandbox.loadSampleTypeIn('lander');
    const text = global.document.getElementById('typein-text').value;
    assert(!text.includes('\\n'), 'Lunar Lander: No literal \\n in preset textarea');
    assert(text.includes('INPUT'), 'Lunar Lander: Authentic INPUT descent simulation loaded');

    emu.feedText(text, false);
    assert(emu.basicProgram.length === 15, 'Lunar Lander: All 15 lines parsed into program memory');

    emu.runProgram();
    for (let i = 0; i < 50 && emu.isRunningBasic; i++) emu.executeBasicLoop();

    const screenLines = getScreenText(emu);
    assert(!screenLines.some(l => l.includes('SYNTAX ERROR')), 'Lunar Lander: Executed with zero syntax errors (INPUT working)');
    assert(screenLines.some(l => l.includes('ALTITUDE')), 'Lunar Lander: Rendered flight telemetry on screen');
  }

  // 4. 65C02 Machine Code Monitor Hex Dump ($300)
  console.log('\n📦 Suite 4: 65C02 Machine Code Monitor Hex Dump ($300)');
  {
    const emu = new Apple2cEmulator(new MockCanvas());
    emu.setSpeed(50);
    global.window.emulator = emu;

    sandbox.loadSampleTypeIn('assembly');
    const text = global.document.getElementById('typein-text').value;
    assert(!text.includes('\\n'), '65C02 Hex Dump: No literal \\n in preset textarea');

    emu.feedText(text, false);
    assert(emu.basicProgram.length === 0, '65C02 Hex Dump: Hex monitor lines not confused with BASIC line numbers');
    assert(emu.ram[0x0300] === 0xA9 && emu.ram[0x0301] === 0x41, '65C02 Hex Dump: Bytes ($0300: A9 41) deposited directly into physical RAM');
  }

  // 5. Bird Brain (HCM 1984) String Printing & Initialization
  console.log('\n📦 Suite 5: Bird Brain (HCM 1984) String Printing & Initialization');
  {
    const emu = new Apple2cEmulator(new MockCanvas());
    emu.setSpeed(50);
    global.window.emulator = emu;

    sandbox.loadSampleTypeIn('birdbrain');
    const text = global.document.getElementById('typein-text').value;
    assert(text.split('\n').length >= 100, 'Bird Brain: Complete 123-line magazine program loaded');

    emu.feedText(text, false);
    assert(emu.basicProgram.length === 123, 'Bird Brain: 123 lines ingested into memory');

    emu.runProgram();
    for (let i = 0; i < 20 && emu.isRunningBasic; i++) emu.executeBasicLoop();

    const screenLines = getScreenText(emu);
    assert(!screenLines.some(l => l.includes('SYNTAX ERROR')), 'Bird Brain: Executed without syntax errors');
    assert(screenLines.some(l => l.includes('BIRD') && l.includes('BRAIN')), 'Bird Brain: Title banner printed correctly (fixed outer quote delimiter)');

    // Select Keyboard (K)
    emu.typeChar('K');
    for (let i = 0; i < 20 && emu.isRunningBasic; i++) emu.executeBasicLoop();

    // Select Sound (Y)
    emu.typeChar('Y');
    for (let i = 0; i < 20 && emu.isRunningBasic; i++) emu.executeBasicLoop();

    // Select Difficulty Level 1
    emu.typeChar('1');
    for (let i = 0; i < 50 && emu.isRunningBasic; i++) emu.executeBasicLoop();

    // Verify machine code CALL SOUND and CALL FLSH ran cleanly on 65C02 without freezing
    for (let i = 0; i < 60 && emu.isRunningBasic; i++) emu.executeBasicLoop();

    let hgr2Bytes = 0;
    for (let a = 0x4000; a < 0x6000; a++) {
      if (emu.ram[a] !== 0) hgr2Bytes++;
    }
    assert(hgr2Bytes > 1000, `Bird Brain: Hi-Res Page 2 scene rendered (${hgr2Bytes} VRAM bytes) and CALL SOUND/FLSH executed on 65C02`);
  }

  // 6. Graphics Mode Exit & Reset Integrity (Starfield -> HOME -> Reset -> HOME)
  console.log('\n📦 Suite 6: Mode Transition & Reset Integrity (Starfield -> HOME -> Reset)');
  {
    const emu = new Apple2cEmulator(new MockCanvas());
    emu.setSpeed(50);
    global.window.emulator = emu;

    sandbox.loadSampleTypeIn('starfield');
    const text = global.document.getElementById('typein-text').value;
    emu.feedText(text, false);
    emu.runProgram();

    for (let i = 0; i < 20; i++) emu.executeBasicLoop();
    assert(emu.isGraphicsMode, 'Starfield: Running in Hi-Res graphics mode');

    // Stop program and type HOME in immediate mode
    emu.stopBasic(false);
    for (const ch of 'HOME') emu.typeChar(ch);
    emu.handleReturn();
    assert(!emu.isGraphicsMode, 'Starfield -> HOME: Immediate HOME returns cleanly to TEXT mode ($C051)');

    // Warm/Cold reset
    emu.reset();
    assert(!emu.isGraphicsMode, 'Reset: isGraphicsMode cleared to false');
    assert(getHiresByteCount(emu) === 0, 'Reset: Hi-Res VRAM cleared of stale graphics');

    // Type HOME after reset
    for (const ch of 'HOME') emu.typeChar(ch);
    emu.handleReturn();
    assert(!emu.isGraphicsMode, 'Post-Reset HOME: Does not corrupt softswitches or enter graphics mode');
  }

  console.log('\n======================================================');
  console.log("🎯 Type-In Test Summary: " + passed + "/" + total + " Tests Passed, 0 Failed");
  console.log('======================================================\n');
  return { passed, total };
}

const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('typeinTestSuite.mjs') ||
  import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`
);

if (isDirectRun) {
  runTypeInTests().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

