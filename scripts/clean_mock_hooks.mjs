import fs from 'fs';
import path from 'path';

const htmlPath = path.resolve('index-standalone.html');
let content = fs.readFileSync(htmlPath, 'utf8');

// A. Remove acsEngine.updateFrame() from startEngineLoop
const targetA = `          if (this.acsEngine && typeof this.acsEngine.updateFrame === 'function') {
            this.acsEngine.updateFrame();
          }`;
if (!content.includes(targetA)) {
  console.log('Target A not found');
} else {
  content = content.replace(targetA, '');
  console.log('Target A removed');
}

// B. Remove acsEngine and worldGamesEngine from typeChar
const targetB = `        if (this.acsEngine) {
          const code = typeof ch === 'string' ? (ch.length === 1 ? ch.toUpperCase().charCodeAt(0) : ch.charCodeAt(0)) : Number(ch);
          this.acsEngine.handleKey(code);
          return;
        }
        if (this.worldGamesEngine) {
          const code = typeof ch === 'string' ? (ch.length === 1 ? ch.toUpperCase().charCodeAt(0) : ch.charCodeAt(0)) : Number(ch);
          this.worldGamesEngine.handleKey(code);
          return;
        }`;
if (!content.includes(targetB)) {
  console.log('Target B not found');
} else {
  content = content.replace(targetB, '');
  console.log('Target B removed');
}

// C. Remove acsEngine and worldGamesEngine from backspace
const targetC = `        if (this.acsEngine) {
          this.acsEngine.handleKey(8);
          return;
        }
        if (this.worldGamesEngine) {
          this.worldGamesEngine.handleKey(8);
          return;
        }`;
if (!content.includes(targetC)) {
  console.log('Target C not found');
} else {
  content = content.replace(targetC, '');
  console.log('Target C removed');
}

// D. Remove acsEngine and worldGamesEngine from handleReturn
const targetD = `        if (this.acsEngine) {
          this.acsEngine.handleKey(13);
          return;
        }
        if (this.worldGamesEngine) {
          this.worldGamesEngine.handleKey(13);
          return;
        }`;
if (!content.includes(targetD)) {
  console.log('Target D not found');
} else {
  content = content.replace(targetD, '');
  console.log('Target D removed');
}

// E. Remove acsEngine and worldGamesEngine from stopGame
const targetE = `        this.worldGamesEngine = null;
        this.acsEngine = null;`;
if (!content.includes(targetE)) {
  console.log('Target E not found');
} else {
  content = content.replace(targetE, '');
  console.log('Target E removed');
}

// F. Update launchAdventureConstructionSet and launchWorldGames
const targetF = `      launchAdventureConstructionSet(diskName = 'ADVCONSTSET1OF6.DSK') {
        this.stopBasic(false);
        this.stopGame();
        this.phosphor = 'color';
        this.acsEngine = new Apple2cAdventureConstructionSetEngine(this);
        this.acsEngine.init(diskName);
        this.isRunningGame = true;
        this.isGraphicsMode = true;
        this.mixedGraphics = false;
        this.isHires = true;
      }

      launchWorldGames(diskName = 'WORLD GAMES DISK 1A.WOZ') {
        this.stopBasic(false);
        this.stopGame();
        this.phosphor = 'color';
        this.worldGamesEngine = new Apple2cWorldGamesEngine(this);
        this.worldGamesEngine.init(diskName);
        this.isRunningGame = true;
        this.isGraphicsMode = true;
        this.mixedGraphics = false;
        this.isHires = true;

        if (this.gameTimerId) clearInterval(this.gameTimerId);
        this.gameTimerId = setInterval(() => {
          if (!this.isRunningGame || !this.worldGamesEngine) return;
          this.worldGamesEngine.updateFrame();
          this.renderScreen();
        }, 30);
      }`;

const replacementF = `      launchAdventureConstructionSet(diskName = 'ADVCONSTSET1OF6.DSK') {
        this.stopBasic(false);
        this.stopGame();
        this.phosphor = 'color';
        let parsed = (window.mountedDisks && window.mountedDisks[1]);
        if (!parsed && typeof window.mountAcsPresetDisk === 'function') {
          parsed = window.mountAcsPresetDisk();
        }
        if (parsed) {
          this.bootFloppy(parsed);
        }
        this.running = true;
      }

      launchWorldGames(diskName = 'WORLD GAMES DISK 1A.WOZ') {
        this.stopBasic(false);
        this.stopGame();
        this.phosphor = 'color';
        let parsed = (window.mountedDisks && window.mountedDisks[1]);
        if (parsed) {
          this.bootFloppy(parsed);
        }
        this.running = true;
      }`;

if (!content.includes(targetF)) {
  console.log('Target F not found');
} else {
  content = content.replace(targetF, replacementF);
  console.log('Target F replaced');
}

// G. Remove click handler references to acsEngine / worldGamesEngine
const targetG = `          if (window.emulator && window.emulator.acsEngine) {
            window.emulator.acsEngine.handleKey(32);
          } else if (window.emulator && window.emulator.worldGamesEngine) {
            window.emulator.worldGamesEngine.handleKey(32);
          }`;
if (!content.includes(targetG)) {
  console.log('Target G not found');
} else {
  content = content.replace(targetG, '');
  console.log('Target G removed');
}

// H. Remove escape handler references to acsEngine / worldGamesEngine
const targetH = `          if (window.emulator && window.emulator.acsEngine) {
            e.preventDefault();
            window.emulator.acsEngine.handleKey(27);
            return;
          }
          if (window.emulator && window.emulator.worldGamesEngine) {
            e.preventDefault();
            window.emulator.worldGamesEngine.handleKey(27);
            return;
          }`;
if (!content.includes(targetH)) {
  console.log('Target H not found');
} else {
  content = content.replace(targetH, '');
  console.log('Target H removed');
}

fs.writeFileSync(htmlPath, content, 'utf8');
console.log('Finished updating index-standalone.html');
