import { ModernCodeCompilationResult } from '../../types/emulator';

export class JavaApple2Compiler {
  public static compile(sourceCode: string): ModernCodeCompilationResult {
    const logs: string[] = ['[Java AOT Compiler] Parsing Java source code...'];
    const asmOutput: string[] = ['; --- Generated 65C02 Machine Code from Java Source ---', '* = $2000', 'START:'];
    const binaryBytes: number[] = [0xd8, 0xa2, 0xff, 0x9a]; // CLD, LDX #$FF, TXS

    asmOutput.push('       CLD', '       LDX #$FF', '       TXS');

    const lines = sourceCode.split('\n');
    for (const rawLine of lines) {
      JavaApple2Compiler.compileLine(rawLine.trim(), binaryBytes, asmOutput, logs);
    }

    binaryBytes.push(0x60); // RTS
    asmOutput.push('       RTS');
    logs.push(`[Java AOT] Completed: ${binaryBytes.length} bytes binary.`);

    return {
      success: true,
      language: 'java',
      sourceCode,
      byteCodeSize: binaryBytes.length,
      generated6502Asm: asmOutput.join('\n'),
      binary: new Uint8Array(binaryBytes),
      entryAddress: 0x2000,
      symbols: [{ name: 'START', address: 0x2000 }],
      logs
    };
  }

  private static compileLine(line: string, bin: number[], asm: string[], logs: string[]): void {
    if (!line || line.startsWith('//') || line.startsWith('import') || line.startsWith('package') || line.startsWith('public class') || line === '}') return;

    if (line.includes('setVideoMode') || line.includes('MODE_DOUBLE_HIRES')) {
      JavaApple2Compiler.emitDoubleHiRes(bin, asm, logs);
    } else if (line.includes('clearScreen') || line.includes('Clear')) {
      JavaApple2Compiler.emitClearScreen(bin, asm, logs);
    } else if (line.includes('beep') || line.includes('Beep')) {
      JavaApple2Compiler.emitBeep(bin, asm, logs);
    } else if (line.includes('drawString') || line.includes('print')) {
      JavaApple2Compiler.emitStringPrint(line, bin, asm, logs);
    }
  }

  private static emitDoubleHiRes(bin: number[], asm: string[], logs: string[]): void {
    logs.push('[Java AOT] Emitting Double Hi-Res setup...');
    bin.push(0x8d, 0x50, 0xc0, 0x8d, 0x57, 0xc0, 0x8d, 0x0d, 0xc0, 0x8d, 0x5f, 0xc0);
    asm.push('       STA $C050 ; TXTCLR', '       STA $C057 ; HIRES', '       STA $C00D ; 80COLSET', '       STA $C05F ; DHIRESON');
  }

  private static emitClearScreen(bin: number[], asm: string[], logs: string[]): void {
    logs.push('[Java AOT] Emitting screen clear routine...');
    bin.push(0xa9, 0x00, 0xa0, 0x00, 0x99, 0x00, 0x20, 0x88, 0xd0, 0xfb);
    asm.push('       LDA #$00', '       LDY #$00', 'CLEAR: STA $2000,Y', '       DEY', '       BNE CLEAR');
  }

  private static emitBeep(bin: number[], asm: string[], logs: string[]): void {
    logs.push('[Java AOT] Emitting speaker pulse generator...');
    bin.push(0xa2, 0x80, 0xad, 0x30, 0xc0, 0xa0, 0x20, 0x88, 0xd0, 0xfd, 0xca, 0xd0, 0xf5);
    asm.push('       LDX #$80', 'BEEP:  LDA $C030', '       LDY #$20', 'DLY:   DEY', '       BNE DLY', '       DEX', '       BNE BEEP');
  }

  private static emitStringPrint(line: string, bin: number[], asm: string[], logs: string[]): void {
    const match = line.match(/["'](.*?)["']/);
    const str = match ? match[1] : 'HELLO APPLE II';
    logs.push(`[Java AOT] Emitting print for "${str}"...`);
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i) | 0x80;
      bin.push(0xa9, ch, 0x20, 0xed, 0xfd);
      asm.push(`       LDA #$${ch.toString(16).toUpperCase()}`, `       JSR $FDED ; COUT`);
    }
  }
}
