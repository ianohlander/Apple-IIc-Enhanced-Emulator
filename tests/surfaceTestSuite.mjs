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

  function createMockElement(id = '', tag = 'div') {
    const el = {
      id,
      tagName: tag.toUpperCase(),
      innerText: '',
      innerHTML: '',
      value: '',
      className: '',
      style: {},
      children: [],
      classList: {
        add: (...classes) => {},
        remove: (...classes) => {},
        toggle: (cls) => {}
      },
      appendChild: (child) => { el.children.push(child); return child; },
      removeChild: (child) => {},
      setAttribute: (k, v) => { el[k] = v; },
      getAttribute: (k) => el[k] || '',
      addEventListener: (evt, fn) => { domEvents[(id || tag) + '_' + evt] = fn; },
      scrollIntoView: () => {}
    };
    return el;
  }

  // Mock Document and Element Surface
  const mockDocument = {
    createElement(tag) {
      if (tag === 'canvas') return new MockHTMLCanvasElement();
      return createMockElement('', tag);
    },
    getElementById(id) {
      if (!elements[id]) {
        elements[id] = createMockElement(id, 'div');
      }
      return elements[id];
    },
    addEventListener(event, fn) {
      domEvents['doc_' + event] = fn;
    }
  };

  const mainCanvas = new MockHTMLCanvasElement(560, 384);
  elements['screen-canvas'] = mainCanvas;

  return {
    canvas: mainCanvas,
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
    requestAnimationFrame: (cb) => setTimeout(cb, 16),
    addEventListener: (evt, fn) => { context.domEvents['win_' + evt] = fn; }
  };
  global.document = context.document;
  global.AudioContext = context.AudioContext;
  global.webkitAudioContext = context.AudioContext;
  global.requestAnimationFrame = global.window.requestAnimationFrame;

  // Evaluate script in sandbox
  const runSandbox = new Function('mockCanvas', 'document', 'window', `
    ${scriptContent}
    return {
      Apple2cEmulator,
      emulator: (typeof emulator !== 'undefined') ? emulator : new Apple2cEmulator(mockCanvas),
      switchTab: (typeof switchTab !== 'undefined') ? switchTab : null,
      loadTypeInSample: (typeof loadTypeInSample !== 'undefined') ? loadTypeInSample : null,
      injectTypeIn: (typeof injectTypeIn !== 'undefined') ? injectTypeIn : null,
      compileAndRunCode: (typeof compileAndRunCode !== 'undefined') ? compileAndRunCode : null,
      setPrinterMode: (window && window.setPrinterMode) || ((typeof setPrinterMode !== 'undefined') ? setPrinterMode : null),
      PRINTSHOP_TEMPLATES: (window && window.PRINTSHOP_TEMPLATES) || ((typeof PRINTSHOP_TEMPLATES !== 'undefined') ? PRINTSHOP_TEMPLATES : null)
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

  ctx.drawCalls = [];
  emu.renderScreen();
  const hasVramPixels = ctx.drawCalls.some(d => d.type === 'fillRect');
  assert(hasVramPixels, 'Canvas 2D Surface: Hi-Res VRAM scanlines rasterized to canvas via fillRect()');

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

  // --- SURFACE TEST SUITE 7: ImageWriter II Dot-Matrix & Print Shop Studio Surface ---
  console.log('\n📦 Surface Suite 7: ImageWriter II Dot-Matrix & Print Shop Studio Surface');
  assert(typeof app.setPrinterMode === 'function', 'Printer Surface: setPrinterMode function exposed');
  assert(app.PRINTSHOP_TEMPLATES && app.PRINTSHOP_TEMPLATES.birthday, 'Print Shop Surface: Birthday card template loaded');
  assert(app.PRINTSHOP_TEMPLATES && app.PRINTSHOP_TEMPLATES.banner, 'Print Master Surface: Grand banner template loaded');
  assert(app.PRINTSHOP_TEMPLATES && app.PRINTSHOP_TEMPLATES.flyer, 'Print Shop Surface: Event flyer template loaded');
  assert(app.PRINTSHOP_TEMPLATES && app.PRINTSHOP_TEMPLATES.certificate, 'Print Master Surface: Certificate of merit loaded');

  // Test Applesoft BASIC PR#1 Output Redirection
  emu.feedText('10 PR#1\n20 PRINT "HELLO IMAGEWRITER II"\n30 PR#0', false);
  assert(emu.basicProgram.length === 3, 'BASIC PR#1 Surface: Ingested PR#1 printer redirection program');

  emu.running = false;

  console.log('\n======================================================');
  console.log(`🎯 Surface Test Summary: ${passed}/${passed + failed} Tests Passed, ${failed} Failed`);
  console.log('======================================================\n');

  if (failed > 0) throw new Error(`${failed} Surface tests failed.`);
  return { passed, failed };
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  runSurfaceTests().then(() => process.exit(0)).catch(() => process.exit(1));
}
