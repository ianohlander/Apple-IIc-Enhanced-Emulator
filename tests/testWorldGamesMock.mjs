import fs from 'fs';

// Let's create a test suite for World Games engine
class MockEmulator {
  constructor() {
    this.ram = new Uint8Array(65536 * 2);
    this.charRom = new Uint8Array(1024);
    this.isGraphicsMode = false;
    this.mixedGraphics = false;
    this.isHires = false;
    this.isPage2 = false;
    this.isCol80 = false;
    this.hiresLines = [];
    this.audioNotes = [];
    this.keyQueue = [];
    this.worldGamesState = null;
    this.isRunningGame = false;
  }

  playBeep(freq, dur) {
    this.audioNotes.push({ freq, dur });
  }

  getHiresScanlineBase(y) {
    const pageOffset = (this.isPage2 ? 0x4000 : 0x2000);
    const box = Math.floor(y / 64);
    const row = Math.floor((y % 64) / 8);
    const sub = y % 8;
    return pageOffset + (sub * 0x400) + (row * 0x80) + (box * 0x28);
  }

  setHiresPixel(x, y, color = 3) {
    if (x < 0 || x >= 280 || y < 0 || y >= 192) return;
    const base = this.getHiresScanlineBase(y);
    const byteCol = Math.floor(x / 7);
    const bitInByte = x % 7;
    const addr = base + byteCol;
    let currentByte = this.ram[addr] || 0;
    if (color === 0) currentByte &= ~(1 << bitInByte);
    else currentByte |= (1 << bitInByte);
    this.ram[addr] = currentByte;
  }

  drawHiresLine(x1, y1, x2, y2, color = 3) {
    x1 = Math.round(x1); y1 = Math.round(y1);
    x2 = Math.round(x2); y2 = Math.round(y2);
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;
    while (true) {
      this.setHiresPixel(x1, y1, color);
      if (x1 === x2 && y1 === y2) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x1 += sx; }
      if (e2 < dx) { err += dx; y1 += sy; }
    }
  }

  drawHiresRect(x, y, w, h, color = 3, filled = false) {
    if (filled) {
      for (let dy = 0; dy < h; dy++) {
        this.drawHiresLine(x, y + dy, x + w, y + dy, color);
      }
    } else {
      this.drawHiresLine(x, y, x + w, y, color);
      this.drawHiresLine(x, y + h, x + w, y + h, color);
      this.drawHiresLine(x, y, x, y + h, color);
      this.drawHiresLine(x + w, y, x + w, y + h, color);
    }
  }

  drawHiresText(x, y, text, color = 3) {
    // Simple 5x7 bitmap font rendering
    for (let i = 0; i < text.length; i++) {
      const startX = x + i * 6;
      for (let dy = 0; dy < 7; dy++) {
        for (let dx = 0; dx < 5; dx++) {
          this.setHiresPixel(startX + dx, y + dy, color);
        }
      }
    }
  }

  clearHiresVram() {
    const base = this.isPage2 ? 0x4000 : 0x2000;
    for (let i = base; i < base + 0x2000; i++) this.ram[i] = 0;
  }
}

console.log('Mock emulator instantiated successfully.');
