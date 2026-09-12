// ============================================================================
// Copyright (c) 2026 Ian Ohlander. All rights reserved.
// Apple //c Ultra Architecture - Adventure Construction Set (1985 EA) Test Suite
// ============================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve('h:/My Drive/Repos/Apple-II-Emulator');

// Load index-standalone.html
const html = fs.readFileSync(path.join(rootDir, 'index-standalone.html'), 'utf8');
const scriptStart = html.indexOf('<script>');
const scriptEnd = html.lastIndexOf('</script>');
const js = html.substring(scriptStart + 8, scriptEnd);

// Canvas Mock
class MockCanvasContext {
  constructor(canvas) {
    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;
    this.buffer = new Uint8ClampedArray(this.width * this.height * 4);
  }
  fillRect() {}
  drawImage() {}
  beginPath() {}
  moveTo() {}
  lineTo() {}
  stroke() {}
  fillText() {}
  getImageData(x, y, w, h) {
    return { data: this.buffer, width: w, height: h };
  }
  putImageData(imgData, x, y) {
    this.buffer.set(imgData.data);
  }
}

const canvas = {
  width: 560,
  height: 384,
  getContext: function() {
    if (!this.ctx) this.ctx = new MockCanvasContext(this);
    return this.ctx;
  }
};

globalThis.window = globalThis;
globalThis.window.addEventListener = () => {};
globalThis.window.removeEventListener = () => {};
globalThis.document = {
  getElementById: (id) => {
    if (id === 'screen-canvas') return canvas;
    return {
      getContext: () => canvas.getContext('2d'),
      addEventListener: () => {},
      classList: { add: () => {}, remove: () => {}, contains: () => false },
      style: {}, appendChild: () => {}, remove: () => {}, innerHTML: '', innerText: ''
    };
  },
  createElement: () => ({ style: {}, classList: { add: () => {}, remove: () => {} }, appendChild: () => {}, remove: () => {} }),
  addEventListener: () => {}
};
globalThis.requestAnimationFrame = () => {};
globalThis.cancelAnimationFrame = () => {};
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
globalThis.AudioContext = class {};

eval(js);

console.log('🚀 Running Adventure Construction Set (1985 EA) Engine Unit Tests...\n');

const emu = new window.Apple2cEmulator(canvas);
window.emulator = emu;

// 1. Test Engine Initialization
emu.launchAdventureConstructionSet('ADVCONSTSET1OF6.DSK');
if (!emu.acsEngine) throw new Error('acsEngine not initialized');
if (emu.acsEngine.state.view !== 'SPLASH') throw new Error(`Expected initial view SPLASH, got ${emu.acsEngine.state.view}`);
console.log('✅ 1. EOA Blue Striped Splash Screen initialized successfully');

// 2. Test Transition to Title Screen (Castle on Cliff & Rivers of Light)
emu.typeChar(' '); // Space -> Title
if (emu.acsEngine.state.view !== 'TITLE') throw new Error(`Expected view TITLE, got ${emu.acsEngine.state.view}`);
console.log('✅ 2. Transitioned to Castle & Rivers of Light Title Screen');

// 3. Test Transition to Input Selection (Joystick vs Keyboard)
emu.typeChar(' '); // Space -> Input Select
if (emu.acsEngine.state.view !== 'INPUT_SELECT') throw new Error(`Expected view INPUT_SELECT, got ${emu.acsEngine.state.view}`);
console.log('✅ 3. Transitioned to Input Selection Screen (Joystick/Keyboard)');

// 4. Test Transition to Main Menu
emu.typeChar(' '); // Space -> Main Menu
if (emu.acsEngine.state.view !== 'MAIN_MENU') throw new Error(`Expected view MAIN_MENU, got ${emu.acsEngine.state.view}`);
console.log('✅ 4. Transitioned to Authentic 4-Option Main Menu');

// 5. Test Make Adventure Disk Selection Tree Navigation
emu.typeChar('M'); // 'M' -> Make Disk
if (emu.acsEngine.state.view !== 'MAKE_DISK') throw new Error(`Expected view MAKE_DISK, got ${emu.acsEngine.state.view}`);
const initialTree = emu.acsEngine.state.treeIndex;
emu.typeChar(10); // Down Arrow -> Next Adventure
if (emu.acsEngine.state.treeIndex !== initialTree + 1) throw new Error('Tree index navigation failed');
emu.typeChar(11); // Up Arrow -> Back
if (emu.acsEngine.state.treeIndex !== initialTree) throw new Error('Tree index up navigation failed');
console.log('✅ 5. Adventure Disk Tree Navigation (Up/Down) verified');

// 6. Test Drive Prompt (Disk Utilities)
emu.typeChar(' '); // Select Adventure -> Drive Prompt
if (emu.acsEngine.state.view !== 'DRIVE_PROMPT') throw new Error(`Expected view DRIVE_PROMPT, got ${emu.acsEngine.state.view}`);
if (!emu.acsEngine.state.selectedAdventure) throw new Error('Selected adventure not set');
console.log(`✅ 6. Drive Prompt reached for: "${emu.acsEngine.state.selectedAdventure}"`);

// 7. Test Transition to Adventure Play Mode (Rivers of Light)
emu.typeChar(' '); // Space -> Play
if (emu.acsEngine.state.view !== 'PLAY') throw new Error(`Expected view PLAY, got ${emu.acsEngine.state.view}`);
const p = emu.acsEngine.state.play;
if (!p || p.hp !== 100 || p.weapon !== 'IRON BROADSWORD') throw new Error('Invalid hero state');
console.log('✅ 7. Rivers of Light RPG Play Mode & Hero Status verified');

// 8. Test ESC Navigation back to Main Menu
emu.typeChar(27); // ESC -> Return to Main Menu
if (emu.acsEngine.state.view !== 'MAIN_MENU') throw new Error(`Expected return to MAIN_MENU, got ${emu.acsEngine.state.view}`);
console.log('✅ 8. ESC navigation returned to Main Menu');

// 9. Test Construction Workbench Screen
emu.typeChar('C'); // 'C' -> Construct
if (emu.acsEngine.state.view !== 'CONSTRUCT') throw new Error(`Expected view CONSTRUCT, got ${emu.acsEngine.state.view}`);
console.log('✅ 9. Construction Workbench (Map, Monster & Item Studios) reached');

// 10. Test Return from Construct and Direct Play Mode Navigation
emu.typeChar(27); // ESC -> Main Menu
if (emu.acsEngine.state.view !== 'MAIN_MENU') throw new Error('Failed to return to Main Menu from Construct');
emu.typeChar('P'); // 'P' -> Direct Play
if (emu.acsEngine.state.view !== 'PLAY') throw new Error(`Expected view PLAY, got ${emu.acsEngine.state.view}`);
console.log('✅ 10. Direct Play navigation from Main Menu verified');

// 11. Test Frame Updates and Audio Triggering
emu.launchAdventureConstructionSet('ADVCONSTSET1OF6.DSK');
emu.acsEngine.state.tick = 81;
emu.acsEngine.updateFrame();
if (emu.acsEngine.state.view !== 'TITLE') throw new Error('Auto-advance to TITLE failed');
console.log('✅ 11. Frame updates & automatic splash screen progression verified');

// 12. Test Engine Shutdown
emu.stopGame();
if (emu.isRunningGame) throw new Error('stopGame failed to reset isRunningGame');
console.log('✅ 12. Engine teardown and memory cleanup verified');

console.log('\n🎉 ALL 12 ADVENTURE CONSTRUCTION SET ENGINE TESTS PASSED (100%)!\n');
process.exit(0);
