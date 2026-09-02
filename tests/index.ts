import { runner } from './testRunner';
import { runArithmeticTests } from './cpu/arithmetic.test';
import { runCmosOpcodeTests } from './cpu/cmosOpcodes.test';
import { runMmuBankingTests } from './mmu/banking.test';
import { runLanguageCardTests } from './mmu/languageCard.test';
import { runSlinkyTests } from './mmu/slinky.test';
import { runVideoAddressMapTests } from './video/addressMap.test';
import { runStorageTests } from './storage/diskII.test';
import { runCompilerTests } from './runtimes/compilers.test';
import { runTypeInTests } from './typein/typeInParser.test';
import { runCodeQualityAudit } from './qa/codeQualityAudit.test';

console.log('🚀 Running Apple IIc Ultra Automated Test Suite...\n');

// 1. CPU Tests
runArithmeticTests();
runCmosOpcodeTests();

// 2. MMU & Memory Tests
runMmuBankingTests();
runLanguageCardTests();
runSlinkyTests();

// 3. Video Tests
runVideoAddressMapTests();

// 4. Storage Tests
runStorageTests();

// 5. Compiler Tests
runCompilerTests();

// 6. Magazine Type-In & Injector Tests
runTypeInTests();

// 7. QA Static Analysis Tests
runCodeQualityAudit();

const success = runner.summarize();
process.exit(success ? 0 : 1);

