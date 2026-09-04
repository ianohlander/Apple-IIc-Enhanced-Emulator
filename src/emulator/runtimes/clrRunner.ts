import { ModernCodeCompilationResult } from '../../types/emulator';

export class CSharpApple2Compiler {
  public static compile(sourceCode: string): ModernCodeCompilationResult {
    const logs: string[] = ['[C# .NET CLR AOT] Parsing C# source code...'];
    const asmOutput: string[] = [
      '; --- Generated 65C02 Machine Code from C# Source ---',
      '; Target System: Apple //c Ultra (WDC 65C02 @ 50 MHz Turbo)',
      '* = $2000',
      'MAIN:'
    ];
    const binaryBytes: number[] = [0xd8, 0xa2, 0xff, 0x9a]; // CLD, LDX #$FF, TXS

    asmOutput.push('       CLD            ; Clear decimal mode', '       LDX #$FF       ; Init stack pointer', '       TXS');

    const lines = sourceCode.split('\n');
    for (const rawLine of lines) {
      CSharpApple2Compiler.compileLine(rawLine.trim(), binaryBytes, asmOutput, logs);
    }

    binaryBytes.push(0x60); // RTS
    asmOutput.push('       RTS            ; Return from Main');
    logs.push(`[C# CLR] Generated ${binaryBytes.length} bytes binary.`);

    return {
      success: true,
      language: 'csharp',
      sourceCode,
      byteCodeSize: binaryBytes.length,
      generated6502Asm: asmOutput.join('\n'),
      binary: new Uint8Array(binaryBytes),
      entryAddress: 0x2000,
      symbols: [{ name: 'MAIN', address: 0x2000 }],
      logs
    };
  }

  private static isIgnoredLine(line: string): boolean {
    if (!line) return true;
    if (line.startsWith('//')) return true;
    if (line.startsWith('using')) return true;
    if (line.startsWith('namespace')) return true;
    if (line.startsWith('class')) return true;
    return line === '{' || line === '}';
  }

  private static compileLine(line: string, bin: number[], asm: string[], logs: string[]): void {
    if (CSharpApple2Compiler.isIgnoredLine(line)) return;

    if (/SetDoubleHiRes|DoubleHiRes/.test(line)) {
      CSharpApple2Compiler.emitDoubleHiRes(line, bin, asm, logs);
    } else if (/Print|WriteLine/.test(line)) {
      CSharpApple2Compiler.emitStringPrint(line, bin, asm, logs);
    } else if (/Beep|PlayMockingboard/.test(line)) {
      CSharpApple2Compiler.emitBeep(line, bin, asm, logs);
    }
  }

  private static emitDoubleHiRes(line: string, bin: number[], asm: string[], logs: string[]): void {
    logs.push('[C# CLR] Emitting DHGR switches...');
    bin.push(0x8d, 0x50, 0xc0, 0x8d, 0x57, 0xc0, 0x8d, 0x0d, 0xc0, 0x8d, 0x5f, 0xc0);
    asm.push(
      `; --- [C#] ${line} ---`,
      '       STA $C050      ; TXTCLR (Graphics Mode)',
      '       STA $C057      ; HIRES (280x192 Display)',
      '       STA $C00D      ; 80COLSET (Aux Video RAM)',
      '       STA $C05F      ; DHIRESON (560x192 Double Hi-Res)'
    );
  }

  private static emitStringPrint(line: string, bin: number[], asm: string[], logs: string[]): void {
    const match = line.match(/["'](.*?)["']/);
    const str = match ? match[1] : 'APPLE IIC .NET RUNNER';
    logs.push(`[C# CLR] Emitting print for "${str}"...`);
    asm.push(`; --- [C#] ${line} ---`);
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i) | 0x80;
      bin.push(0xa9, ch, 0x20, 0xed, 0xfd);
      asm.push(`       LDA #$${ch.toString(16).toUpperCase()}      ; ASCII '${str[i]}'`, `       JSR $FDED      ; COUT character output`);
    }
  }

  private static emitBeep(line: string, bin: number[], asm: string[], logs: string[]): void {
    logs.push('[C# CLR] Emitting audio trigger...');
    bin.push(0xa2, 0x60, 0xad, 0x30, 0xc0, 0xa0, 0x30, 0x88, 0xd0, 0xfd, 0xca, 0xd0, 0xf5);
    asm.push(
      `; --- [C#] ${line} ---`,
      '       LDX #$60       ; Duration loop',
      'BEEP:  LDA $C030      ; Toggle Speaker Softswitch ($C030)',
      '       LDY #$30       ; Frequency delay',
      'DLY:   DEY',
      '       BNE DLY',
      '       DEX',
      '       BNE BEEP'
    );
  }
}
