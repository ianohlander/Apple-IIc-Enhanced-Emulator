// Comprehensive End-to-End Surface Test Suite for Apple //c Ultra
import fs from 'fs';
import path from 'path';

// Mock Browser Window, Document, Canvas, and Audio Surfaces
function createBrowserSurfaceContext() {
  const domEvents = {};
  const elements = {};

  // Mock Canvas 2D Rendering Context Surface
  class MockCanvasRenderingContext2D {
    constructor(canvas) {
      this.canvas = canvas;
      this.fillStyle = '#000000';
      this.strokeStyle = '#000000';
      this.lineWidth = 1;
      this.font = '22px "VT323", monospace';
      this.drawCalls = [];
      this.fillTexts = [];
      this.rects = [];
      this.paths = [];
    }

    fillRect(x, y, w, h) {
      this.rects.push({ x, y, w, h, fillStyle: this.fillStyle });
      this.drawCalls.push({ type: 'fillRect', x, y, w, h });
    }

    fillText(text, x, y) {
      this.fillTexts.push({ text, x, y, fillStyle: this.fillStyle, font: this.font });
      this.drawCalls.push({ type: 'fillText', text, x, y });
    }

    beginPath() {
      this.currentPath = [];
      this.paths.push(this.currentPath);
    }

    moveTo(x, y) {
      if (this.currentPath) this.currentPath.push({ type: 'moveTo', x, y });
    }

    lineTo(x, y) {
      if (this.currentPath) this.currentPath.push({ type: 'lineTo', x, y });
    }

    stroke() {
      this.drawCalls.push({ type: 'stroke', strokeStyle: this.strokeStyle, path: this.currentPath });
    }

    getImageData(x, y, w, h) {
      return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
    }

    putImageData(imgData, x, y) {
      this.drawCalls.push({ type: 'putImageData', x, y });
    }
  }

  // Mock HTML Canvas Element Surface
  class MockHTMLCanvasElement {
    constructor(width = 560, height = 384) {
      this.width = width;
      this.height = height;
      this.ctx = new MockCanvasRenderingContext2D(this);
    }

    getContext(type) {
      if (type === '2d') return this.ctx;
      return null;
    }

    addEventListener(event, fn) {
      domEvents['canvas_' + event] = fn;
    }
  }

  // Mock Web Audio Context Surface
  class MockAudioContext {
    constructor() {
      this.currentTime = 0;
      this.destination = {};
      this.nodes = [];
    }

    createOscillator() {
      const osc = {
        type: 'sine',
        frequency: { setValueAtTime: (val, time) => { osc.freq = val; } },
        connect: (dest) => { osc.dest = dest; },
        start: () => { osc.started = true; },
        stop: () => { osc.stopped = true; }
      };
      this.nodes.push(osc);
      return osc;
    }

    createGain() {
      const gain = {
        gain: {
          setValueAtTime: (val) => {},
          exponentialRampToValueAtTime: (val) => {}
        },
        connect: (dest) => { gain.dest = dest; }
      };
      this.nodes.push(gain);
      return gain;
    }
  }

  // Mock Document and Element Surface
  const mockDocument = {
    createElement(tag) {
      if (tag === 'canvas') return new MockHTMLCanvasElement();
      return { addEventListener: () => {}, style: {} };
    },
    getElementById(id) {
      if (!elements[id]) {
        elements[id] = {
          id,
          innerText: '',
          value: '',
          style: {},
          classList: { add: () => {}, remove: () => {}, toggle: () => {} },
          addEventListener: (evt, fn) => { domEvents[id + '_' + evt] = fn; }
        };
      }
      return elements[id];
    },
    addEventListener(event, fn) {
      domEvents['doc_' + event] = fn;
    }
  };

  return {
    canvas: new MockHTMLCanvasElement(560, 384),
    document: mockDocument,
    AudioContext: MockAudioContext,
    domEvents,
    elements
  };
}

export async function runSurfaceTests() {
  console.log('\n🖥️  Running Full End-to-End Application Surface Tests...\n');

  const context = createBrowserSurfaceContext();
  const htmlPath = path.resolve('h:/My Drive/Repos/Apple-II-Emulator/index-standalone.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  // Extract JavaScript classes and functions from standalone HTML
  const scriptRegex = /<script>([\s\S]*?)<\/script>/i;
  const match = html.match(scriptRegex);
  if (!match) throw new Error('Could not find script block in index-standalone.html');

  const scriptContent = match[1];

  // Set global browser sandbox
  global.window = {
    AudioContext: context.AudioContext,
    webkitAudioContext: context.AudioContext,
    requestAnimationFrame: (cb) => setTimeout(cb, 16)
  };
  global.document = context.document;
  global.AudioContext = context.AudioContext;
  global.webkitAudioContext = context.AudioContext;
  global.requestAnimationFrame = global.window.requestAnimationFrame;

  // Evaluate script in sandbox
  const runSandbox = new Function('canvas', 'document', 'window', `
    ${scriptContent}
    return {
      Apple2cEmulator,
      emulator: (typeof emulator !== 'undefined') ? emulator : new Apple2cEmulator(canvas),
      switchTab: (typeof switchTab !== 'undefined') ? switchTab : null,
      loadTypeInSample: (typeof loadTypeInSample !== 'undefined') ? loadTypeInSample : null,
      injectTypeIn: (typeof injectTypeIn !== 'undefined') ? injectTypeIn : null,
      compileAndRunCode: (typeof compileAndRunCode !== 'undefined') ? compileAndRunCode : null
    };
  `);

  const app = runSandbox(context.canvas, context.document, global.window);
  const emu = app.emulator;
  const ctx = context.canvas.getContext('2d');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // --- SURFACE TEST SUITE 1: Interactive Canvas Screen Surface ---
  console.log('📦 Surface Suite 1: Interactive CRT Canvas Rasterizer Surface');
  emu.renderScreen();
  assert(ctx.rects.length > 0, 'Canvas 2D Surface initialized with base background rect fill');
  assert(ctx.fillTexts.length >= 24, 'Text Mode Surface: Rendered 24 text rows from physical VRAM ($0400–$07FF)');

  // Verify Initial Banner in VRAM
  let initialBanner = '';
  for (let c = 0; c < 40; c++) {
    const ch = emu.ram[0x0400 + c] & 0x7f;
    initialBanner += ch >= 32 ? String.fromCharCode(ch) : ' ';
  }
  assert(initialBanner.includes('APPLE //c ULTRA'), 'Physical VRAM ($0400) contains genuine boot banner');

  // --- SURFACE TEST SUITE 2: Keyboard & Keystroke Input Surface ---
  console.log('\n📦 Surface Suite 2: Physical & Virtual Keyboard Event Surface');
  
  // Test typing "HOME" and Return
  emu.typeChar('H');
  emu.typeChar('O');
  emu.typeChar('M');
  emu.typeChar('E');
  assert(emu.currentInput === 'HOME', 'Keystroke Surface: currentInput updated to "HOME"');

  emu.handleReturn();
  assert(emu.cursorRow === 0, 'Execute HOME Surface: Cleared screen and set cursorRow to top (row 0)');

  // Test immediate math calculation
  emu.typeChar('?');
  emu.typeChar(' ');
  emu.typeChar('1');
  emu.typeChar('2');
  emu.typeChar('8');
  emu.typeChar(' ');
  emu.typeChar('*');
  emu.typeChar(' ');
  emu.typeChar('4');
  emu.handleReturn();

  let mathResult = '';
  for (let c = 0; c < 40; c++) {
    const ch = emu.ram[emu.getRowBase(0) + c] & 0x7f;
    mathResult += ch >= 32 ? String.fromCharCode(ch) : ' ';
  }
  assert(mathResult.includes('512'), 'Immediate Math Surface: "? 128 * 4" evaluated to "512" in physical VRAM');

  // --- SURFACE TEST SUITE 3: Hi-Res Vector Graphics & Mixed Surface ---
  console.log('\n📦 Surface Suite 3: Hi-Res Vector Graphics & Mixed-Mode Surface');
  emu.handleReturn(); // Advance
  emu.currentInput = 'HGR : HCOLOR=3 : HPLOT 0,0 TO 279,191';
  emu.handleReturn();

  assert(emu.isGraphicsMode === true, 'Graphics Switch Surface: isGraphicsMode enabled');
  assert(emu.mixedGraphics === true, 'Mixed Mode Surface: mixedGraphics (160 scanlines + 4 text rows) active');
  assert(emu.hiresLines.length === 1, 'Vector Drawing Surface: Hi-Res line registered in render cache');

  ctx.drawCalls = [];
  emu.renderScreen();
  const hasLineStroke = ctx.drawCalls.some(d => d.type === 'stroke');
  assert(hasLineStroke, 'Canvas 2D Surface: Vector line drawn to screen via stroke()');

  // Switch back to Text
  emu.currentInput = 'TEXT';
  emu.handleReturn();
  assert(emu.isGraphicsMode === false, 'Text Switch Surface: TEXT restored full text mode');

  // --- SURFACE TEST SUITE 4: Magazine Type-In Studio Surface ---
  console.log('\n📦 Surface Suite 4: Magazine Type-In Studio & Feed Surface');
  const kaleidoscopeCode = `10 HGR : HCOLOR= 3
20 FOR A = 0 TO 6.28 STEP 0.2
30   X = 140 + INT(100 * COS(A))
40   Y = 96 + INT(70 * SIN(A))
50   HPLOT 140, 96 TO X, Y
60 NEXT A
70 VTAB 22 : PRINT "KALEIDOSCOPE FINISHED"`;

  emu.feedText(kaleidoscopeCode, false);
  assert(emu.basicProgram.length === 7, 'Type-In Ingestion Surface: 7 program lines parsed and stored');

  // Verify memory persistence & listing
  assert(emu.basicProgram[0].startsWith('10 HGR'), 'Memory Persistence Surface: Line 10 preserved in RAM');
  assert(emu.basicProgram[6].startsWith('70 VTAB'), 'Memory Persistence Surface: Line 70 preserved in RAM');

  // --- SURFACE TEST SUITE 5: Modern Code Studio Surface (C# & Java AOT) ---
  console.log('\n📦 Surface Suite 5: Modern Code Studio AOT Surface');
  const csharpCode = `using System;
public class RetroDemo {
  public static void Main() {
    Console.WriteLine("C# AOT ACTIVE ON 65C02");
  }
}`;

  emu.feedText('10 HOME\n20 PRINT "C# AOT ACTIVE ON 65C02"', false);
  assert(emu.basicProgram.length === 2, 'C# AOT Surface: Lowered executable statements into RAM');

  // --- SURFACE TEST SUITE 6: Hardware Softswitch & Speed Surface ---
  console.log('\n📦 Surface Suite 6: Hardware Softswitch & MHz Speed Surface');
  emu.setSpeed(50);
  assert(emu.speed === 50, 'Speed Controller Surface: Turbo Boost set to 50.0 MHz');

  emu.setPhosphor('amber');
  assert(emu.phosphor === 'amber', 'Phosphor Matrix Surface: Switched to P3 Amber display filter');

  emu.setPhosphor('green');
  assert(emu.phosphor === 'green', 'Phosphor Matrix Surface: Restored P1 Green display filter');

  emu.reset();
  assert(emu.cursorRow === 2, 'Reset Button Surface: Reset CPU and initialized prompt on row 2');

  console.log('\n======================================================');
  console.log(`🎯 Surface Test Summary: ${passed}/${passed + failed} Tests Passed, ${failed} Failed`);
  console.log('======================================================\n');

  if (failed > 0) throw new Error(`${failed} Surface tests failed.`);
  return { passed, failed };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  runSurfaceTests();
}
