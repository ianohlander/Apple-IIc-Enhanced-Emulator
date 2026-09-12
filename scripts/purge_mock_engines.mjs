import fs from 'fs';
import path from 'path';

const htmlPath = path.resolve('index-standalone.html');
let content = fs.readFileSync(htmlPath, 'utf8');

// 1. Purge Apple2cWorldGamesEngine and Apple2cAdventureConstructionSetEngine
const worldGamesStart = content.indexOf('    // =========================================================================\n    // EPYX WORLD GAMES EMULATION ENGINE');
const emulatorClassStart = content.indexOf('    // =========================================================================\n    // EMULATOR CLASS DEFINITION\n    // =========================================================================\n    class Apple2cEmulator {');

if (worldGamesStart !== -1 && emulatorClassStart !== -1) {
  const replacement = `    // =========================================================================\n    // NATIVE 65C02 CPU PIPELINE (AUTHENTIC ROM & DISK II EXECUTION)\n    // All high-level mock engines (ACS & World Games) permanently eliminated.\n    // Ingress: Hardware Strobe ($C000/$C010). Egress: Physical VRAM -> CRT Canvas.\n    // =========================================================================\n\n\n`;
  content = content.substring(0, worldGamesStart) + replacement + content.substring(emulatorClassStart);
  console.log('Successfully purged mock engines from index-standalone.html!');
} else {
  console.error('Could not find start/end markers:', { worldGamesStart, emulatorClassStart });
  process.exit(1);
}

fs.writeFileSync(htmlPath, content, 'utf8');
console.log('index-standalone.html saved successfully.');
