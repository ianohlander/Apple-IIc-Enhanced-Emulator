import fs from 'fs';
import path from 'path';

function findFiles(dir, extList = ['.html', '.md', '.mjs', '.ts', '.tsx']) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    if (file === 'node_modules' || file === 'backups' || file === '.git') return;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findFiles(fullPath, extList));
    } else {
      const ext = path.extname(file).toLowerCase();
      if (extList.includes(ext)) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

const docFiles = findFiles('./docs').concat(findFiles('./qa'));
const uniqueFiles = Array.from(new Set(docFiles));

console.log(`Processing ${uniqueFiles.length} files...`);

let totalReplacements = 0;

for (const file of uniqueFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // 1. Watermarks & Generators
  content = content.replace(/Watermark:\s*Copyright\s*\(c\)\s*2026\s*Ian\s*Ohlander\.\s*All\s*rights\s*reserved\.\s*Apple\s*\/\/c\s*Ultra\s*Architecture\./g,
    'Watermark: Copyright (c) 2026 Ian Ohlander. All rights reserved. 65C02 Ultra Workstation.');
  content = content.replace(/<meta name="generator" content="Apple \/\/c Ultra([^"]*)">/g,
    '<meta name="generator" content="65C02 Ultra Workstation$1">');
  content = content.replace(/<meta name="generator" content="Apple IIc Ultra([^"]*)">/g,
    '<meta name="generator" content="65C02 Ultra Workstation$1">');

  // 2. Titles & Brand Headers
  content = content.replace(/<title>Apple \/\/c Ultra/g, '<title>6502 Ultra');
  content = content.replace(/<title>Apple IIc Ultra/g, '<title>6502 Ultra');
  content = content.replace(/Apple \/\/c Ultra Architecture/g, '65C02 Ultra Workstation');
  content = content.replace(/Apple IIc Ultra Architecture/g, '65C02 Ultra Workstation');
  content = content.replace(/Apple \/\/c Ultra Workstation/g, '6502 Ultra Workstation');
  content = content.replace(/APPLE \/\/c ULTRA/g, '6502 ULTRA');
  content = content.replace(/APPLE IIC ULTRA/g, '6502 ULTRA');
  content = content.replace(/Apple \/\/c Ultra/g, '6502 Ultra');
  content = content.replace(/Apple IIc Ultra/g, '6502 Ultra');
  content = content.replace(/Apple \/\/c/g, '6502 Ultra');
  content = content.replace(/Apple IIc/g, '6502 Ultra');

  // 3. UI Actions & Buttons
  content = content.replace(/Feed into Apple II &amp; Run/g, 'Feed into 6502 Ultra &amp; Run');
  content = content.replace(/Feed into Apple II & Run/g, 'Feed into 6502 Ultra & Run');
  content = content.replace(/Feed into Apple II/g, 'Feed into 6502 Ultra');
  content = content.replace(/Feed into Apple \/\/c/g, 'Feed into 6502 Ultra');
  content = content.replace(/Switch to the Apple II screen/g, 'Switch to the 6502 Ultra screen');
  content = content.replace(/Switch to the Apple II display/g, 'Switch to the 6502 Ultra display');
  content = content.replace(/Apple II display/g, '6502 Ultra display');

  // 4. Memory, Video, Audio & Hardware Subsystems
  content = content.replace(/Apple II Memory Expansion Card \(Slinky\)/g, 'Slinky 1MB Memory Expansion Card');
  content = content.replace(/Apple II Memory Expansion Card/g, 'Slinky 1MB Memory Expansion Card');
  content = content.replace(/Apple II Memory Expansion/g, 'Slinky 1MB Memory Expansion');
  content = content.replace(/Apple II memory-mapped architecture/g, '65C02 memory-mapped architecture');
  content = content.replace(/Apple II memory/g, '6502 Ultra memory');
  content = content.replace(/Apple \/\/c memory/g, '6502 Ultra memory');
  content = content.replace(/Apple II Video RAM/g, '6502 Ultra Video RAM');
  content = content.replace(/Apple II Video Generation/g, '6502 Ultra Video Generation');
  content = content.replace(/Apple II video generator/g, '6502 Ultra video generator');
  content = content.replace(/Apple II video RAM/g, '6502 Ultra video RAM');
  content = content.replace(/Apple II video/g, '6502 Ultra video');
  content = content.replace(/Apple II VRAM/g, '6502 Ultra VRAM');
  content = content.replace(/Apple II graphics/g, '6502 Ultra graphics');
  content = content.replace(/Apple II speaker/g, '1-bit audio speaker');
  content = content.replace(/Apple II sound/g, '65C02 sound synthesis');
  content = content.replace(/Apple II keyboard/g, '63-key matrix keyboard');
  content = content.replace(/Apple II character generator ROM/g, 'System character generator ROM');
  content = content.replace(/Apple II character generator/g, 'System character generator');
  content = content.replace(/Apple II High-Bit ASCII/g, 'Standard High-Bit ASCII ($80)');
  content = content.replace(/Apple II high-bit ASCII/g, 'high-bit ASCII ($80)');
  content = content.replace(/Apple II ASCII/g, 'High-Bit ASCII ($80)');
  content = content.replace(/Apple II COUT vector/g, 'System COUT vector ($FDED)');
  content = content.replace(/Apple Monitor ROM/g, '65C02 System Monitor ROM');
  content = content.replace(/Apple IIc System Monitor ROM/g, '65C02 System Monitor ROM');
  content = content.replace(/Apple IIc System Monitor/g, '65C02 System Monitor');
  content = content.replace(/Apple II System Monitor/g, '65C02 System Monitor');
  content = content.replace(/Apple IIc ROM terminal/g, '65C02 ROM terminal');
  content = content.replace(/Apple II system ROM/g, '65C02 system ROM');
  content = content.replace(/Apple II ROM/g, '65C02 system ROM');
  content = content.replace(/Apple II Integer BASIC ROM/g, 'Integer BASIC ROM');
  content = content.replace(/Apple II Integer BASIC/g, 'Classic Integer BASIC');
  content = content.replace(/Apple II Pascal system/g, 'UCSD Pascal p-System');
  content = content.replace(/Apple II Pascal/g, 'UCSD Pascal p-System');
  content = content.replace(/Apple II peripheral cards/g, '50-pin expansion cards');
  content = content.replace(/Apple II peripheral card/g, '50-pin expansion card');
  content = content.replace(/Apple II cards/g, '50-pin expansion cards');
  content = content.replace(/Apple II card/g, '50-pin expansion card');
  content = content.replace(/Apple II slot bus/g, '50-pin expansion bus');
  content = content.replace(/Apple II expansion bus/g, '50-pin expansion bus');
  content = content.replace(/Apple II bus/g, '50-pin expansion bus');
  content = content.replace(/Apple II slots/g, '50-pin expansion slots');
  content = content.replace(/Apple II slot/g, '50-pin expansion slot');
  content = content.replace(/Apple II community/g, 'vintage computing community');
  content = content.replace(/Apple II games/g, 'classic 6502 & ProDOS games');
  content = content.replace(/physical 1984 Apple II silicon/g, 'physical 1984 65C02 silicon');
  content = content.replace(/Standard Apple II/g, 'Standard 1.02 MHz 6502');
  content = content.replace(/Apple II coordinate mapping/g, '65C02 display coordinate mapping');
  content = content.replace(/Coordinate Mapping: 0\.\.255 \(Apple II\)/g, 'Coordinate Mapping: 0..255 (Standard 6502)');
  content = content.replace(/Apple II softswitches/g, '65C02 MMIO softswitches');
  content = content.replace(/Apple II architecture/g, '65C02 Ultra architecture');
  content = content.replace(/Clean-Room Apple II Architecture/g, 'Clean-Room 65C02 Ultra Workstation');
  content = content.replace(/Apple II emulation/g, '65C02 emulation');
  content = content.replace(/Apple II hardware/g, '6502 Ultra hardware');
  content = content.replace(/Apple II system/g, '6502 Ultra system');
  content = content.replace(/Apple II screen/g, '6502 Ultra screen');
  content = content.replace(/without requiring any Apple II-specific packages or imports/g, 'without requiring any proprietary platform-specific packages or imports');
  content = content.replace(/Write Standard Modern Code Without Apple II Imports/g, 'Write Standard Modern Code Without Proprietary Imports');
  content = content.replace(/How C# Objects & Fields Live in Apple II Memory/g, 'How C# Objects & Fields Live in 6502 Ultra Memory');
  content = content.replace(/How C# Objects &amp; Fields Live in Apple II Memory/g, 'How C# Objects &amp; Fields Live in 6502 Ultra Memory');
  content = content.replace(/Running higher-level virtual machine bytecodes on an 8-bit Apple II is not a foreign concept; it is part of Apple's deepest DNA:/g,
    'Running higher-level virtual machine bytecodes on an 8-bit 65C02 system has a rich historical lineage:');
  content = content.replace(/Woz created <strong>Sweet16<\/strong>, a 16-bit virtual processor implemented as a 6502 bytecode interpreter in the Apple II Integer BASIC ROM\./g,
    'In 1977, <strong>Sweet16</strong> was created as a 16-bit virtual processor implemented as a 6502 bytecode interpreter in Integer BASIC ROM.');
  content = content.replace(/In real Apple \/\/c hardware,/g, 'In vintage 1984 65C02 hardware,');
  content = content.replace(/Era-Accurate 64KB Apple II Memory Architecture Map/g, 'Era-Accurate 64KB 6502 Memory Architecture Map');
  content = content.replace(/Full Apple II Memory Map Reference/g, 'Full 6502 Memory Map Reference');
  content = content.replace(/Java OOP Execution on Apple IIc Video & Audio Hardware/g, 'Java OOP Execution on 6502 Ultra Video & Audio Hardware');
  content = content.replace(/Java OOP Execution on Apple IIc Video &amp; Audio Hardware/g, 'Java OOP Execution on 6502 Ultra Video &amp; Audio Hardware');
  content = content.replace(/Apple2\.clearScreen/g, 'Ultra.clearScreen');
  content = content.replace(/Apple2\.drawString/g, 'Ultra.drawString');
  content = content.replace(/Apple2\.beep/g, 'Ultra.beep');
  content = content.replace(/Apple2\.BLACK/g, 'Color.BLACK');
  content = content.replace(/AppleStorage/g, 'StorageCore');
  content = content.replace(/Raw Monitor Dump: Apple String Out \(\$0300\)/g, 'Raw Monitor Dump: 65C02 String Out ($0300)');
  content = content.replace(/Apple String Out \(\$0300\)/g, '65C02 String Out ($0300)');
  content = content.replace(/\$0310: "APPLE IIc Ultra"/g, '$0310: "6502 ULTRA"');
  content = content.replace(/"APPLE IIc Ultra"/g, '"6502 ULTRA"');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    totalReplacements++;
    console.log(`Updated: ${file}`);
  }
}

console.log(`Total files modified: ${totalReplacements}`);

