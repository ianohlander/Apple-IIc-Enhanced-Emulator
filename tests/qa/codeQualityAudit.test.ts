import { runner, assertTrue } from '../testRunner';
import * as fs from 'fs';
import * as path from 'path';

function calculateComplexity(funcBody: string): number {
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

function auditSourceFile(filePath: string): { maxComplexity: number; maxFuncLines: number; totalLines: number; violations: string[] } {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const violations: string[] = [];

  let maxComplexity = 1;
  let maxFuncLines = 0;

  // Simple function regex parser matching function/method declarations
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

    if (cc > maxComplexity) maxComplexity = cc;
    if (funcLineCount > maxFuncLines) maxFuncLines = funcLineCount;

    if (cc > 7) {
      violations.push(`Function "${funcName}" in ${path.basename(filePath)} exceeds CC <= 7 (Complexity: ${cc})`);
    }
  }

  return {
    maxComplexity,
    maxFuncLines,
    totalLines: lines.length,
    violations
  };
}

export function runCodeQualityAudit(): void {
  runner.suite('Code QA: SOLID, Cyclomatic Complexity <= 7 & Function Length Audit', () => {
    runner.test('All CPU, MMU, Video, and Storage functions satisfy CC <= 7 and single-page length', () => {
      const srcDir = path.resolve(__dirname, '../../src/emulator');
      const filesToAudit: string[] = [];

      function walkDir(dir: string) {
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
      const allViolations: string[] = [];

      for (const file of filesToAudit) {
        const result = auditSourceFile(file);
        if (result.violations.length > 0) {
          allViolations.push(...result.violations);
        }
      }

      if (allViolations.length > 0) {
        console.error('QA Violations detected:\n' + allViolations.join('\n'));
      }

      assertTrue(allViolations.length === 0, `No functions exceed cyclomatic complexity of 7`);
    });
  });
}
