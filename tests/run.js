// Zero-dependency pure Node.js test executor for Apple IIc Ultra
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('🧪 Starting Apple IIc Ultra Unit Tests & QA Validation...\n');

// Lightweight TS -> JS stripper for pure ES/Node execution
function transpileTs(code) {
  return code
    .replace(/^import\s+type\s+.*?from\s+['"].*?['"];?/gm, '')
    .replace(/import\s+\{([^}]+)\}\s+from\s+['"](.*?)['"];?/g, (_, imports, mod) => {
      const isRel = mod.startsWith('.');
      return `const { ${imports} } = require('${mod}');`;
    })
    .replace(/import\s+([A-Za-z0-9_]+)\s+from\s+['"](.*?)['"];?/g, 'const $1 = require("$2");')
    .replace(/export\s+(?:enum|interface|type)\s+.*?(?:\{[\s\S]*?\}|;)/g, '')
    .replace(/export\s+class\s+/g, 'class ')
    .replace(/export\s+function\s+/g, 'function ')
    .replace(/export\s+const\s+/g, 'const ')
    .replace(/export\s+let\s+/g, 'let ')
    .replace(/:\s*[A-Za-z0-9_<>\[\]|&\s]+(?=[=,);{])/g, '')
    .replace(/as\s+[A-Za-z0-9_<>\[\]]+/g, '');
}

// Run through Node
const { runArithmeticTests } = require('./cpu/arithmetic.test');
const { runCmosOpcodeTests } = require('./cpu/cmosOpcodes.test');
const { runMmuBankingTests } = require('./mmu/banking.test');
const { runLanguageCardTests } = require('./mmu/languageCard.test');
const { runSlinkyTests } = require('./mmu/slinky.test');
const { runVideoAddressMapTests } = require('./video/addressMap.test');
const { runStorageTests } = require('./storage/diskII.test');
const { runCompilerTests } = require('./runtimes/compilers.test');
const { runCodeQualityAudit } = require('./qa/codeQualityAudit.test');
const { runner } = require('./testRunner');

runArithmeticTests();
runCmosOpcodeTests();
runMmuBankingTests();
runLanguageCardTests();
runSlinkyTests();
runVideoAddressMapTests();
runStorageTests();
runCompilerTests();
runCodeQualityAudit();

const passed = runner.summarize();
process.exit(passed ? 0 : 1);
