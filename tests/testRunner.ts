// Lightweight, zero-dependency high-speed test runner for Apple IIc Ultra

export interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: Error;
  durationMs: number;
}

export class TestRunner {
  private results: TestResult[] = [];
  private currentSuite: string = 'Default';

  public suite(name: string, fn: () => void): void {
    this.currentSuite = name;
    console.log(`\n📦 Suite: ${name}`);
    fn();
  }

  public test(name: string, fn: () => void): void {
    const start = performance.now();
    try {
      fn();
      const durationMs = performance.now() - start;
      this.results.push({ suite: this.currentSuite, name, passed: true, durationMs });
      console.log(`  ✅ ${name} (${durationMs.toFixed(2)}ms)`);
    } catch (err: unknown) {
      const durationMs = performance.now() - start;
      const error = err instanceof Error ? err : new Error(String(err));
      this.results.push({ suite: this.currentSuite, name, passed: false, error, durationMs });
      console.error(`  ❌ ${name}: ${error.message}`);
    }
  }

  public summarize(): boolean {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;

    console.log(`\n========================================`);
    console.log(`🎯 Test Summary: ${passed}/${total} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    return failed === 0;
  }
}

export const runner = new TestRunner();

export function assertEqual<T>(actual: T, expected: T, msg?: string): void {
  if (actual !== expected) {
    throw new Error(`${msg || 'Assertion Failed'}: expected ${expected}, got ${actual}`);
  }
}

export function assertTrue(actual: boolean, msg?: string): void {
  if (!actual) {
    throw new Error(`${msg || 'Assertion Failed'}: expected true, got ${actual}`);
  }
}

export function assertFalse(actual: boolean, msg?: string): void {
  if (actual) {
    throw new Error(`${msg || 'Assertion Failed'}: expected false, got ${actual}`);
  }
}
