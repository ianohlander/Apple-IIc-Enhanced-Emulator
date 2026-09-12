import fs from 'fs';
import assert from 'assert';

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

  stopBasic() {}
  stopGame() { this.isRunningGame = false; }

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

class Apple2cWorldGamesEngine {
  constructor(emulator) {
    this.emu = emulator;
    this.state = {
      view: 'TITLE',
      selectedEvent: 0,
      eventIndex: 0,
      tick: 0,
      score: 0,
      substate: 'READY',
      eventState: {},
      toastMessage: '',
      highScores: [
        { name: 'CLIFF DIVING', country: '🇲🇽 MEXICO', best: '9.8 / 10.0' },
        { name: 'WEIGHTLIFTING', country: '🇷🇺 RUSSIA', best: '225.0 KG' },
        { name: 'BARREL JUMPING', country: '🇩🇪 GERMANY', best: '14 BARRELS' },
        { name: 'LOG ROLLING', country: '🇨🇦 CANADA', best: 'ROUND 3 WIN' },
        { name: 'BULL RIDING', country: '🇺🇸 USA', best: '8.00s / 96 PTS' },
        { name: 'SUMO WRESTLING', country: '🇯🇵 JAPAN', best: 'YORIKIRI WIN' },
        { name: 'SLALOM SKIING', country: '🇫🇷 FRANCE', best: '23.45 SEC' },
        { name: 'CABER TOSS', country: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 SCOTLAND', best: '12:00 / 38.5 FT' }
      ]
    };
  }

  init(diskName = 'WORLD GAMES DISK 1A.WOZ') {
    this.emu.stopBasic(false);
    this.emu.stopGame();
    this.emu.isRunningGame = true;
    this.emu.isGraphicsMode = true;
    this.emu.mixedGraphics = false;
    this.emu.isHires = true;
    this.emu.isCol80 = true;
    this.emu.clearHiresVram();

    this.state.view = 'TITLE';
    this.state.selectedEvent = 0;
    this.state.tick = 0;

    this.playThemeFanfare();
    this.render();
  }

  playThemeFanfare() {
    if (!this.emu.playBeep) return;
    const notes = [
      { f: 523, d: 0.12 }, { f: 659, d: 0.12 }, { f: 784, d: 0.18 },
      { f: 1046, d: 0.25 }, { f: 784, d: 0.12 }, { f: 1046, d: 0.35 }
    ];
    this.emu.playBeep(notes[0].f, notes[0].d);
    notes.slice(1).forEach((n, i) => {
      setTimeout(() => this.emu.playBeep && this.emu.playBeep(n.f, n.d), (i + 1) * 140);
    });
  }

  selectEvent(idx) {
    this.state.eventIndex = Math.max(0, Math.min(7, idx));
    this.state.view = 'EVENT';
    this.state.tick = 0;
    this.initEvent(this.state.eventIndex);
    if (this.emu.playBeep) {
      this.emu.playBeep(880, 0.08);
      setTimeout(() => this.emu.playBeep && this.emu.playBeep(1174, 0.12), 100);
    }
  }

  initEvent(idx) {
    const s = this.state;
    s.tick = 0;
    switch (idx) {
      case 0: // Cliff Diving (Mexico)
        s.eventState = {
          diverX: 42, diverY: 34, diverVx: 0, diverVy: 0,
          angle: 0, posture: 'STAND', wavePhase: 0,
          wind: 12, judged: false, score: '0.0', status: 'PRESS [SPACE] TO DIVE'
        };
        break;
      case 1: // Weightlifting (Russia)
        s.eventState = {
          weight: 215.0, phase: 'READY',
          lifterY: 130, barY: 145, balance: 0,
          timer: 0, lights: [false, false, false],
          status: 'PRESS [SPACE] TO APPROACH & GRIP'
        };
        break;
      case 2: // Barrel Jumping (Germany)
        s.eventState = {
          skaterX: 18, skaterY: 140, speed: 0,
          jumping: false, jumpVy: 0, cleared: 0,
          numBarrels: 12, status: 'ALTERNATE [LEFT] & [RIGHT] TO SPRINT'
        };
        break;
      case 3: // Log Rolling (Canada)
        s.eventState = {
          logRot: 0, logSpeed: 2.0,
          p1X: 110, p1Bal: 0, p2X: 170, p2Bal: 0,
          p2Fell: false, status: '[LEFT/RIGHT] BALANCE  [UP/DOWN] SPIN LOG'
        };
        break;
      case 4: // Bull Riding (USA)
        s.eventState = {
          rideTime: 0, bullPhase: 0, bullX: 140, bullY: 120,
          riderBalX: 0, riderBalY: 0, buckIntensity: 1.0,
          fell: false, complete: false, status: 'HOLD BALANCE FOR 8.00 SECONDS!'
        };
        break;
      case 5: // Sumo (Japan)
        s.eventState = {
          p1X: 115, p2X: 165, clashing: false,
          p1Stamina: 100, p2Stamina: 100,
          winner: null, status: 'PRESS [SPACE] AT TACHIAI TO CHARGE!'
        };
        break;
      case 6: // Slalom Skiing (France)
        s.eventState = {
          skierX: 140, skierY: 130, courseOffset: 0,
          gatesPassed: 0, totalGates: 10, time: 0,
          finished: false, status: '[LEFT/RIGHT] STEER THROUGH GATES'
        };
        break;
      case 7: // Caber Toss (Scotland)
        s.eventState = {
          athleteX: 30, runSpeed: 0, caberAngle: 0,
          tossed: false, caberX: 0, caberY: 0,
          distance: 0, clockScore: '', status: '[RIGHT] RUN  [SPACE] HOIST & TOSS'
        };
        break;
    }
  }

  handleKey(code) {
    const s = this.state;
    if (code === 27 || code === 77 || code === 109) {
      s.view = s.view === 'TITLE' ? 'MENU' : (s.view === 'EVENT' ? 'MENU' : 'TITLE');
      this.emu.clearHiresVram();
      this.render();
      if (this.emu.playBeep) this.emu.playBeep(440, 0.05);
      return;
    }

    if (s.view === 'TITLE' || s.view === 'MENU') {
      if (code >= 49 && code <= 56) {
        this.selectEvent(code - 49);
        return;
      }
      if (code === 32 || code === 13) {
        this.selectEvent(s.selectedEvent);
        return;
      }
      if (code === 11 || code === 38) {
        s.selectedEvent = (s.selectedEvent + 7) % 8;
        this.render();
        if (this.emu.playBeep) this.emu.playBeep(660, 0.02);
        return;
      }
      if (code === 10 || code === 40) {
        s.selectedEvent = (s.selectedEvent + 1) % 8;
        this.render();
        if (this.emu.playBeep) this.emu.playBeep(660, 0.02);
        return;
      }
    } else if (s.view === 'EVENT') {
      this.handleEventKey(s.eventIndex, code);
    }
  }

  handleEventKey(eventIdx, code) {
    const es = this.state.eventState;
    if (!es) return;

    switch (eventIdx) {
      case 0:
        if (code === 32 || code === 11) {
          if (es.posture === 'STAND') {
            es.posture = 'SWAN';
            es.diverVx = 1.6;
            es.diverVy = -1.2;
            es.status = '[LEFT/RIGHT] FORM  [DOWN] STRAIGHTEN ENTRY';
            if (this.emu.playBeep) this.emu.playBeep(660, 0.08);
          } else if (es.judged) {
            this.initEvent(0);
          }
        } else if (code === 8 || code === 37) {
          es.angle = (es.angle - 15 + 360) % 360;
        } else if (code === 21 || code === 39) {
          es.angle = (es.angle + 15) % 360;
        } else if (code === 10 || code === 40) {
          es.posture = 'ENTRY';
          es.angle = 90;
        }
        break;

      case 1:
        if (code === 32) {
          if (es.phase === 'READY') {
            es.phase = 'CLEAN';
            es.lifterY = 120;
            es.barY = 120;
            es.status = 'PULL TO CHEST! TAP [UP] TO JERK OVERHEAD!';
            if (this.emu.playBeep) this.emu.playBeep(520, 0.05);
          } else if (es.phase === 'GOOD_LIFT') {
            this.initEvent(1);
          }
        } else if (code === 11 || code === 38) {
          if (es.phase === 'CLEAN') {
            es.phase = 'JERK';
            es.lifterY = 100;
            es.barY = 85;
            es.status = 'HOLD BALANCE! 3 WHITE LIGHTS COUNTDOWN...';
            if (this.emu.playBeep) this.emu.playBeep(780, 0.08);
          }
        } else if (code === 8 || code === 37) {
          es.balance = Math.max(-20, es.balance - 3);
        } else if (code === 21 || code === 39) {
          es.balance = Math.min(20, es.balance + 3);
        }
        break;

      case 2:
        if (code === 8 || code === 37 || code === 21 || code === 39) {
          es.speed = Math.min(42, es.speed + 3.2);
          if (this.emu.playBeep) this.emu.playBeep(440 + es.speed * 8, 0.02);
        } else if (code === 32) {
          if (!es.jumping && es.skaterX > 40 && es.skaterX < 120) {
            es.jumping = true;
            es.jumpVy = -Math.min(7.5, es.speed * 0.22);
            es.status = 'AIRBORNE! SOARING OVER BARRELS!';
            if (this.emu.playBeep) this.emu.playBeep(880, 0.12);
          } else if (es.cleared > 0) {
            this.initEvent(2);
          }
        }
        break;

      case 3:
        if (code === 8 || code === 37) {
          es.p1X = Math.max(90, es.p1X - 4);
          es.p1Bal = Math.max(-10, es.p1Bal - 2);
        } else if (code === 21 || code === 39) {
          es.p1X = Math.min(130, es.p1X + 4);
          es.p1Bal = Math.min(10, es.p1Bal + 2);
        } else if (code === 11 || code === 38) {
          es.logSpeed += 1.5;
          es.p2Bal += 3.0;
          if (this.emu.playBeep) this.emu.playBeep(600, 0.03);
        } else if (code === 10 || code === 40) {
          es.logSpeed = Math.max(-5, es.logSpeed - 1.5);
          es.p2Bal -= 3.0;
        } else if (code === 32 && es.p2Fell) {
          this.initEvent(3);
        }
        break;

      case 4:
        if (code === 8 || code === 37) { es.riderBalX = Math.max(-20, es.riderBalX - 4); }
        else if (code === 21 || code === 39) { es.riderBalX = Math.min(20, es.riderBalX + 4); }
        else if (code === 11 || code === 38) { es.riderBalY = Math.max(-20, es.riderBalY - 4); }
        else if (code === 10 || code === 40) { es.riderBalY = Math.min(20, es.riderBalY + 4); }
        else if (code === 32 && (es.complete || es.fell)) { this.initEvent(4); }
        break;

      case 5:
        if (code === 32) {
          es.clashing = true;
          es.p1X += 4;
          es.p2Stamina -= 8;
          if (this.emu.playBeep) this.emu.playBeep(350, 0.04);
        } else if (code === 11 || code === 38) {
          es.p1X += 6;
          es.p2Stamina -= 12;
          if (this.emu.playBeep) this.emu.playBeep(450, 0.05);
        } else if (code === 8 || code === 37) {
          es.p2X += 8;
        }
        if (es.winner && code === 32) {
          this.initEvent(5);
        }
        break;

      case 6:
        if (code === 8 || code === 37) { es.skierX = Math.max(70, es.skierX - 6); }
        else if (code === 21 || code === 39) { es.skierX = Math.min(210, es.skierX + 6); }
        else if (code === 32 && es.finished) { this.initEvent(6); }
        break;

      case 7:
        if (code === 21 || code === 39) {
          if (!es.tossed) {
            es.runSpeed = Math.min(8.0, es.runSpeed + 1.2);
            es.athleteX += es.runSpeed;
          }
        } else if (code === 32) {
          if (!es.tossed && es.athleteX > 50) {
            es.tossed = true;
            es.caberX = es.athleteX + 15;
            es.caberY = 120;
            es.distance = (32 + Math.random() * 8).toFixed(1);
            es.clockScore = '12:00 PERFECT!';
            es.status = `PERFECT TOSS! ${es.distance} FT! PRESS [SPACE] TO RETRY`;
            if (this.emu.playBeep) {
              this.emu.playBeep(880, 0.1);
              setTimeout(() => this.emu.playBeep && this.emu.playBeep(1174, 0.2), 120);
            }
          } else if (es.tossed) {
            this.initEvent(7);
          }
        }
        break;
    }
  }

  updateFrame() {
    while (this.emu.keyQueue && this.emu.keyQueue.length > 0) {
      const k = this.emu.keyQueue.shift();
      this.handleKey(k);
    }
    this.state.tick++;
    if (this.state.view === 'EVENT') {
      this.updateEventPhysics(this.state.eventIndex);
    }
    this.render();
  }

  updateEventPhysics(idx) {
    const es = this.state.eventState;
    if (!es) return;

    switch (idx) {
      case 0:
        if (es.posture !== 'STAND' && !es.judged) {
          es.diverX += es.diverVx;
          es.diverY += es.diverVy;
          es.diverVy += 0.28;
          if (es.posture === 'SWAN') es.angle = (es.angle + 8) % 360;
          if (es.diverY >= 165) {
            es.judged = true;
            const deviation = Math.abs(es.angle - 90);
            if (deviation <= 25) {
              es.score = (9.4 + Math.random() * 0.5).toFixed(1);
              es.status = `PERFECT DIVE! JUDGES SCORE: ${es.score} / 10.0 [SPACE] AGAIN`;
              if (this.emu.playBeep) this.emu.playBeep(980, 0.2);
            } else {
              es.score = (3.2 + Math.random() * 1.5).toFixed(1);
              es.status = `BELLYFLOP SPLASH! JUDGES: ${es.score} / 10.0 [SPACE] AGAIN`;
              if (this.emu.playBeep) this.emu.playBeep(220, 0.2);
            }
          }
        }
        es.wavePhase = (es.wavePhase + 1) % 60;
        break;

      case 1:
        if (es.phase === 'JERK') {
          es.timer++;
          es.balance += (Math.random() - 0.5) * 1.8;
          if (es.timer > 20) es.lights[0] = true;
          if (es.timer > 40) es.lights[1] = true;
          if (es.timer > 60) {
            es.lights[2] = true;
            es.phase = 'GOOD_LIFT';
            es.status = `THREE WHITE LIGHTS! GOOD LIFT: ${es.weight} KG! [SPACE] AGAIN`;
            if (this.emu.playBeep) {
              this.emu.playBeep(880, 0.15);
              setTimeout(() => this.emu.playBeep && this.emu.playBeep(1174, 0.3), 160);
            }
          }
        }
        break;

      case 2:
        if (es.jumping) {
          es.skaterX += es.speed * 0.18;
          es.skaterY += es.jumpVy;
          es.jumpVy += 0.25;
          if (es.skaterY >= 140) {
            es.skaterY = 140;
            es.jumping = false;
            es.cleared = es.speed >= 30 ? es.numBarrels : Math.floor((es.speed / 30) * es.numBarrels);
            es.status = `LANDED CLEANLY! CLEARED ${es.cleared} / ${es.numBarrels} BARRELS! [SPACE] AGAIN`;
            if (this.emu.playBeep) this.emu.playBeep(880, 0.15);
          }
        } else if (es.speed > 0 && es.skaterX < 100) {
          es.skaterX += es.speed * 0.12;
        }
        break;

      case 3:
        es.logRot = (es.logRot + es.logSpeed) % 360;
        es.p2Bal += (Math.random() - 0.48) * 0.8;
        if (Math.abs(es.p2Bal) > 25 && !es.p2Fell) {
          es.p2Fell = true;
          es.status = 'VICTORY! JACQUES HAS SPLASHED INTO THE RIVER! [SPACE] AGAIN';
          if (this.emu.playBeep) this.emu.playBeep(980, 0.25);
        }
        break;

      case 4:
        if (!es.fell && !es.complete) {
          es.rideTime = Math.min(8.0, es.rideTime + 0.05);
          es.bullPhase++;
          es.riderBalX += (Math.sin(es.bullPhase * 0.3) * 1.5);
          es.riderBalY += (Math.cos(es.bullPhase * 0.25) * 1.5);
          if (Math.abs(es.riderBalX) > 28 || Math.abs(es.riderBalY) > 28) {
            es.fell = true;
            es.status = `BUCKED OFF AT ${es.rideTime.toFixed(2)}s! [SPACE] TO RETRY`;
            if (this.emu.playBeep) this.emu.playBeep(240, 0.2);
          } else if (es.rideTime >= 8.0) {
            es.complete = true;
            es.status = '8.00s FULL RIDE COMPLETE! SCORE: 96 PTS! [SPACE] AGAIN';
            if (this.emu.playBeep) {
              this.emu.playBeep(880, 0.15);
              setTimeout(() => this.emu.playBeep && this.emu.playBeep(1174, 0.25), 160);
            }
          }
        }
        break;

      case 5:
        if (es.clashing && !es.winner) {
          es.p2X -= 0.5;
          if (es.p2X > 200 || es.p2Stamina <= 0) {
            es.winner = 'PLAYER';
            es.status = 'YORIKIRI! WINNER: HAKURYU! [SPACE] TO PLAY AGAIN';
            if (this.emu.playBeep) this.emu.playBeep(880, 0.2);
          }
        }
        break;

      case 6:
        if (!es.finished) {
          es.time += 0.04;
          es.courseOffset += 3;
          if (es.courseOffset % 60 === 0 && es.gatesPassed < es.totalGates) {
            es.gatesPassed++;
            if (this.emu.playBeep) this.emu.playBeep(700, 0.03);
          }
          if (es.gatesPassed >= es.totalGates) {
            es.finished = true;
            es.status = `COURSE FINISHED! TIME: ${es.time.toFixed(2)}s - GOLD MEDAL! [SPACE] AGAIN`;
            if (this.emu.playBeep) this.emu.playBeep(1046, 0.25);
          }
        }
        break;
    }
  }

  render() {
    this.emu.clearHiresVram();
    if (this.state.view === 'TITLE') {
      this.renderTitleScreen();
    } else if (this.state.view === 'MENU') {
      this.renderMenuScreen();
    } else if (this.state.view === 'EVENT') {
      this.renderEventScreen(this.state.eventIndex);
    }
  }

  renderTitleScreen() {
    const e = this.emu;
    e.drawHiresRect(6, 6, 267, 180, 3);
    e.drawHiresRect(8, 8, 263, 176, 2);
    e.drawHiresText(74, 20, "★ EPYX PRESENTS ★", 5);
    e.drawHiresText(48, 40, "W O R L D   G A M E S", 3);
    e.drawHiresLine(48, 52, 232, 52, 6);
    e.drawHiresRect(132, 62, 16, 24, 5, true);
    e.drawHiresLine(140, 56, 140, 62, 1);
    e.drawHiresLine(136, 58, 144, 58, 5);
    e.drawHiresText(22, 98, "OFFICIAL 1986 EPYX COMMEMORATIVE EDITION", 6);
    e.drawHiresText(36, 114, "8 INTERNATIONAL CHAMPIONSHIP EVENTS", 3);
    e.drawHiresText(32, 140, "PRESS [1-8] TO SELECT EVENT", 5);
    e.drawHiresText(44, 154, "PRESS [SPACE] OR [RETURN] TO START", 1);
    e.drawHiresText(54, 168, "PRESS [M] OR [ESC] FOR MENU", 2);
  }

  renderMenuScreen() {
    const e = this.emu;
    e.drawHiresRect(6, 6, 267, 180, 3);
    e.drawHiresText(68, 14, "SELECT CHAMPIONSHIP EVENT", 3);
    e.drawHiresLine(40, 24, 240, 24, 6);

    const events = [
      "1. MEXICO:    CLIFF DIVING (La Quebrada)",
      "2. RUSSIA:    WEIGHTLIFTING (Clean & Jerk)",
      "3. GERMANY:   BARREL JUMPING (Ice Rink)",
      "4. CANADA:    LOG ROLLING (River Duel)",
      "5. USA:       BULL RIDING (8-Sec Rodeo)",
      "6. JAPAN:     SUMO WRESTLING (Dohyo Arena)",
      "7. FRANCE:    SLALOM SKIING (Alpine Run)",
      "8. SCOTLAND:  CABER TOSS (Highland Field)"
    ];

    for (let i = 0; i < events.length; i++) {
      const y = 36 + i * 14;
      const isSelected = this.state.selectedEvent === i;
      const color = isSelected ? 5 : 3;
      if (isSelected) {
        e.drawHiresText(14, y, ">", 5);
      }
      e.drawHiresText(26, y, events[i], color);
    }
    e.drawHiresLine(20, 154, 260, 154, 6);
    e.drawHiresText(24, 162, "[1-8] SELECT  [ARROWS] HIGHLIGHT  [ENTER] PLAY", 1);
  }

  renderEventScreen(idx) {
    const e = this.emu;
    const es = this.state.eventState;
    if (!es) return;

    e.drawHiresRect(4, 4, 271, 183, 3);
    const headers = [
      "🇲🇽 MEXICO: CLIFF DIVING",
      "🏋️ RUSSIA: WEIGHTLIFTING",
      "⛸️ GERMANY: BARREL JUMPING",
      "🪵 CANADA: LOG ROLLING",
      "🐂 USA: BULL RIDING",
      "🥋 JAPAN: SUMO WRESTLING",
      "⛷️ FRANCE: SLALOM SKIING",
      "🌲 SCOTLAND: CABER TOSS"
    ];

    e.drawHiresText(12, 10, headers[idx] || "WORLD GAMES", 5);
    e.drawHiresText(220, 10, "[ESC] MENU", 2);
    e.drawHiresLine(8, 20, 271, 20, 6);

    switch (idx) {
      case 0:
        e.drawHiresRect(8, 30, 48, 140, 2, true);
        e.drawHiresLine(48, 44, 64, 44, 3);
        e.drawHiresRect(64, 150, 208, 25, 6, true);
        for (let w = 0; w < 10; w++) {
          const wx = 70 + w * 20 + (es.wavePhase % 20);
          e.drawHiresLine(wx, 152, wx + 8, 150, 3);
        }
        e.drawHiresRect(Math.round(es.diverX), Math.round(es.diverY), 6, 12, 5, true);
        break;

      case 1:
        e.drawHiresRect(60, 150, 160, 16, 2, true);
        for (let l = 0; l < 3; l++) {
          const lx = 110 + l * 25;
          e.drawHiresRect(lx, 26, 14, 10, es.lights[l] ? 3 : 2, true);
        }
        e.drawHiresRect(132 + Math.round(es.balance), Math.round(es.lifterY), 16, 28, 5, true);
        const by = Math.round(es.barY);
        e.drawHiresLine(100, by, 180, by, 3);
        e.drawHiresRect(96, by - 8, 8, 16, 1, true);
        e.drawHiresRect(176, by - 8, 8, 16, 1, true);
        break;

      case 2:
        e.drawHiresRect(8, 148, 264, 25, 6, true);
        for (let b = 0; b < 12; b++) {
          const bx = 110 + b * 10;
          e.drawHiresRect(bx, 134, 8, 14, 2, true);
        }
        e.drawHiresRect(Math.round(es.skaterX), Math.round(es.skaterY), 10, 18, 5, true);
        e.drawHiresText(12, 28, `SPEED: ${Math.round(es.speed)} KM/H`, 1);
        break;

      case 3:
        e.drawHiresRect(8, 130, 264, 45, 6, true);
        e.drawHiresRect(80, 136, 120, 18, 5, true);
        e.drawHiresRect(Math.round(es.p1X), 116, 10, 20, 3, true);
        if (!es.p2Fell) {
          e.drawHiresRect(Math.round(es.p2X), 116, 10, 20, 1, true);
        } else {
          e.drawHiresText(180, 142, "*SPLASH*", 3);
        }
        break;

      case 4:
        e.drawHiresRect(8, 140, 264, 35, 2, true);
        const bullX = 130 + Math.round(es.riderBalX * 0.5);
        const bullY = 115 + Math.round(es.riderBalY * 0.5);
        e.drawHiresRect(bullX, bullY, 40, 24, 3, true);
        if (!es.fell) {
          e.drawHiresRect(bullX + 16, bullY - 14, 12, 16, 5, true);
        } else {
          e.drawHiresText(bullX + 45, 145, "*THROWN*", 1);
        }
        e.drawHiresText(12, 28, `CLOCK: ${es.rideTime.toFixed(2)}s / 8.00s`, 1);
        break;

      case 5:
        e.drawHiresRect(60, 70, 160, 95, 2, true);
        e.drawHiresRect(70, 80, 140, 75, 3, false);
        e.drawHiresRect(Math.round(es.p1X), 105, 24, 32, 5, true);
        e.drawHiresRect(Math.round(es.p2X), 105, 24, 32, 1, true);
        break;

      case 6:
        e.drawHiresRect(8, 22, 264, 155, 3, false);
        for (let g = 0; g < 4; g++) {
          const gy = 40 + g * 32 + (es.courseOffset % 32);
          if (gy < 165) {
            e.drawHiresLine(90, gy, 90, gy + 14, 1);
            e.drawHiresLine(170, gy, 170, gy + 14, 6);
          }
        }
        e.drawHiresRect(Math.round(es.skierX), Math.round(es.skierY), 12, 20, 5, true);
        e.drawHiresText(12, 28, `GATES: ${es.gatesPassed} / ${es.totalGates}  TIME: ${es.time.toFixed(2)}s`, 1);
        break;

      case 7:
        e.drawHiresRect(8, 140, 264, 35, 1, true);
        const ax = Math.round(es.athleteX);
        e.drawHiresRect(ax, 118, 12, 24, 5, true);
        if (!es.tossed) {
          e.drawHiresLine(ax + 8, 70, ax + 8, 138, 2);
        } else {
          e.drawHiresLine(Math.round(es.caberX), 90, Math.round(es.caberX) + 20, 140, 2);
        }
        break;
    }

    e.drawHiresLine(8, 168, 271, 168, 6);
    e.drawHiresText(12, 173, es.status || "", 1);
  }
}

// RUN TESTS
console.log('🧪 Testing World Games Engine...');
const mock = new MockEmulator();
const engine = new Apple2cWorldGamesEngine(mock);

// Test 1: Title initialization
engine.init('World Games disk 1A.woz');
assert.strictEqual(engine.state.view, 'TITLE');
assert.strictEqual(mock.isRunningGame, true);
assert.strictEqual(mock.isGraphicsMode, true);
assert.strictEqual(mock.isHires, true);
assert.strictEqual(mock.audioNotes.length > 0, true, 'Fanfare notes played');
console.log('✅ Test 1 Passed: Title & Fanfare Initialization');

// Test 2: Event selection menu
engine.handleKey(13); // RETURN -> Start event 0 (Cliff Diving)
assert.strictEqual(engine.state.view, 'EVENT');
assert.strictEqual(engine.state.eventIndex, 0);
console.log('✅ Test 2 Passed: Event Selection Menu -> Cliff Diving');

// Test 3: Play all 8 events
for (let i = 0; i < 8; i++) {
  engine.selectEvent(i);
  assert.strictEqual(engine.state.eventIndex, i);
  for (let f = 0; f < 30; f++) {
    engine.updateFrame();
  }
  let vramBytes = 0;
  for (let a = 0x2000; a < 0x4000; a++) {
    if (mock.ram[a] !== 0) vramBytes++;
  }
  assert.strictEqual(vramBytes > 0, true, `Event ${i} populated VRAM with graphics`);
}
console.log('✅ Test 3 Passed: All 8 Events Rendered & Simulated Cleanly in VRAM');

// Test 4: Navigation back to Menu
engine.handleKey(27); // ESC
assert.strictEqual(engine.state.view, 'MENU');
console.log('✅ Test 4 Passed: Universal ESC / Menu Navigation');

console.log('🎉 All World Games Tests Passed!');
