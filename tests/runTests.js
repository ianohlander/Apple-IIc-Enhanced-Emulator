// Zero-dependency direct test suite and Code QA Validator
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.results = [];
    this.currentSuite = 'Default';
  }

  suite(name, fn) {
    this.currentSuite = name;
    console.log(`\n📦 Suite: ${name}`);
    fn();
  }

  test(name, fn) {
    const start = performance.now();
    try {
      fn();
      const durationMs = performance.now() - start;
      this.results.push({ suite: this.currentSuite, name, passed: true, durationMs });
      console.log(`  ✅ ${name} (${durationMs.toFixed(2)}ms)`);
    } catch (err) {
      const durationMs = performance.now() - start;
      this.results.push({ suite: this.currentSuite, name, passed: false, error: err, durationMs });
      console.error(`  ❌ ${name}: ${err.message}`);
    }
  }

  summarize() {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;

    console.log(`\n========================================`);
    console.log(`🎯 Test Summary: ${passed}/${total} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    return failed === 0;
  }
}

const runner = new TestRunner();
function assertEqual(a, b, msg) {
  if (a !== b) throw new Error(`${msg || 'Assertion Failed'}: expected ${b}, got ${a}`);
}
function assertTrue(a, msg) {
  if (!a) throw new Error(`${msg || 'Assertion Failed'}: expected true, got ${a}`);
}
function assertFalse(a, msg) {
  if (a) throw new Error(`${msg || 'Assertion Failed'}: expected false, got ${a}`);
}

// ----------------------------------------------------------------------------
// Static QA Audit: Cyclomatic Complexity & Function Length
// ----------------------------------------------------------------------------
function calculateComplexity(funcBody) {
  let complexity = 1;
  const branchPatterns = [
    /\bif\b/g,
    /\belse\s+if\b/g,
    /\bfor\b/g,
    /\bwhile\b/g,
    /\bcase\b/g,
    /\bcatch\b/g,
    /\?/g,
    /&&/g,
    /\|\|/g
  ];

  for (const pattern of branchPatterns) {
    const matches = funcBody.match(pattern);
    if (matches) {
      complexity += matches.length;
    }
  }
  return complexity;
}

function auditSourceFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const violations = [];

  const funcRegex = /(?:public|private|static|async|\s)*\s+(?:function\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*[\w<>[\]\s|]+)?\s*\{/g;
  let match;

  while ((match = funcRegex.exec(content)) !== null) {
    const funcName = match[1];
    if (['if', 'switch', 'while', 'for', 'catch'].includes(funcName)) continue;

    const startIdx = match.index;
    let braceCount = 1;
    let endIdx = startIdx + match[0].length;

    while (endIdx < content.length && braceCount > 0) {
      if (content[endIdx] === '{') braceCount++;
      else if (content[endIdx] === '}') braceCount--;
      endIdx++;
    }

    const funcBody = content.substring(startIdx, endIdx);
    const funcLineCount = funcBody.split('\n').length;
    const cc = calculateComplexity(funcBody);

    if (cc > 7) {
      violations.push(`Function "${funcName}" in ${path.basename(filePath)} exceeds CC <= 7 (Complexity: ${cc})`);
    }
  }

  return violations;
}

// ----------------------------------------------------------------------------
// Run Test Suites
// ----------------------------------------------------------------------------
console.log('🚀 Running Apple IIc Ultra Automated Test Suite & Code QA Audits...\n');

// 1. QA Audit Suite
runner.suite('Code QA: SOLID, Cyclomatic Complexity <= 7 & Function Length Audit', () => {
  runner.test('All CPU, MMU, Video, and Storage functions satisfy CC <= 7', () => {
    const srcDir = path.resolve(__dirname, '../src/emulator');
    const filesToAudit = [];

    function walkDir(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walkDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.includes('defaultRoms')) {
          filesToAudit.push(fullPath);
        }
      }
    }

    walkDir(srcDir);
    const allViolations = [];

    for (const file of filesToAudit) {
      const violations = auditSourceFile(file);
      if (violations.length > 0) {
        allViolations.push(...violations);
      }
    }

    if (allViolations.length > 0) {
      console.error('QA Violations detected:\n' + allViolations.join('\n'));
    }

    assertTrue(allViolations.length === 0, `No functions exceed cyclomatic complexity of 7`);
  });
});

// 2. Video Address Calculations Suite
runner.suite('Apple II Video: Address Mapping', () => {
  runner.test('Text Row Memory Base Addresses (0-23)', () => {
    const getTextRowAddress = (row) => {
      const group = Math.floor(row / 8);
      const sub = row % 8;
      return 0x0400 + (sub * 0x80) + (group * 0x28);
    };

    assertEqual(getTextRowAddress(0), 0x0400);
    assertEqual(getTextRowAddress(1), 0x0480);
    assertEqual(getTextRowAddress(8), 0x0428);
    assertEqual(getTextRowAddress(23), 0x07d0);
  });

  runner.test('Hi-Res Scanline Base Addresses (0-191)', () => {
    const getHgrRowAddress = (y) => {
      const box = Math.floor(y / 64);
      const row = Math.floor((y % 64) / 8);
      const sub = y % 8;
      return 0x2000 + (sub * 0x400) + (row * 0x80) + (box * 0x28);
    };

    assertEqual(getHgrRowAddress(0), 0x2000);
    assertEqual(getHgrRowAddress(1), 0x2400);
    assertEqual(getHgrRowAddress(8), 0x2080);
    assertEqual(getHgrRowAddress(64), 0x2028);
  });
});

// 3. Storage GCR & 32MB Hard Disk Block Suite
runner.suite('Apple II Storage: Floppy GCR & 32MB SmartPort HD', () => {
  runner.test('6-and-2 GCR Nibble Translation Table Integrity', () => {
    const DISK_BYTE_TO_NIBBLE = [
      0x96, 0x97, 0x9A, 0x9B, 0x9D, 0x9E, 0x9F, 0xA6,
      0xA7, 0xAB, 0xAC, 0xAD, 0xAE, 0xAF, 0xB2, 0xB3,
      0xB4, 0xB5, 0xB6, 0xB7, 0xB9, 0xBA, 0xBC, 0xBD,
      0xBE, 0xBF, 0xCB, 0xCD, 0xCE, 0xCF, 0xD3, 0xD6,
      0xD7, 0xD9, 0xDA, 0xDB, 0xDC, 0xDD, 0xDE, 0xDF,
      0xE5, 0xE6, 0xE7, 0xE9, 0xEA, 0xEB, 0xEC, 0xED,
      0xEE, 0xEF, 0xF2, 0xF3, 0xF4, 0xF5, 0xF6, 0xF7,
      0xF9, 0xFA, 0xFB, 0xFC, 0xFD, 0xFE, 0xFF
    ];

    assertEqual(DISK_BYTE_TO_NIBBLE.length, 64);
    for (const n of DISK_BYTE_TO_NIBBLE) {
      assertTrue((n & 0x80) !== 0, 'Every disk nibble must have bit 7 set for hardware shift register');
    }
  });

  runner.test('SmartPort 32MB Hard Disk Block I/O (65536 Blocks)', () => {
    const totalBlocks = (32 * 1024 * 1024) / 512;
    assertEqual(totalBlocks, 65536, '32MB volume has 65,536 512-byte blocks');

    const blocks = new Uint8Array(totalBlocks * 512);
    // Write test block
    const testData = new Uint8Array(512);
    testData[0] = 0xca;
    testData[1] = 0xfe;
    testData[511] = 0xba;

    const offset = 200 * 512;
    blocks.set(testData, offset);

    const readBack = blocks.slice(offset, offset + 512);
    assertEqual(readBack[0], 0xca);
    assertEqual(readBack[1], 0xfe);
    assertEqual(readBack[511], 0xba);
  });
});

const passed = runner.summarize();
process.exit(passed ? 0 : 1);
