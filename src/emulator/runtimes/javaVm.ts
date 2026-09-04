import { ModernCodeCompilationResult } from '../../types/emulator';

export class JavaApple2Compiler {
  public static compile(sourceCode: string): ModernCodeCompilationResult {
    const logs: string[] = ['[Java AOT Compiler] Parsing Java source code...'];
    const asmOutput: string[] = [
      '; --- Generated 65C02 Machine Code from Java Source ---',
      '; Target System: Apple //c Ultra (WDC 65C02 @ 50 MHz Turbo)',
      '; Architecture & AOT Compiler: Copyright (c) 2026 Ian Ohlander. All rights reserved.',
      '* = $2000',
      'START:'
    ];
    const binaryBytes: number[] = [0xd8, 0xa2, 0xff, 0x9a]; // CLD, LDX #$FF, TXS

    asmOutput.push('       CLD            ; Clear decimal mode', '       LDX #$FF       ; Init stack pointer', '       TXS');

    const lines = sourceCode.split('\n');
    for (const rawLine of lines) {
      JavaApple2Compiler.compileLine(rawLine.trim(), binaryBytes, asmOutput, logs);
    }

    binaryBytes.push(0x60); // RTS
    asmOutput.push('       RTS            ; Return to Caller');
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

  private static isIgnoredLine(line: string): boolean {
    if (!line) return true;
    if (line.startsWith('//')) return true;
    if (line.startsWith('import')) return true;
    if (line.startsWith('package')) return true;
    if (line.startsWith('public class')) return true;
    return line === '{' || line === '}';
  }

  private static compileLine(line: string, bin: number[], asm: string[], logs: string[]): void {
    if (JavaApple2Compiler.isIgnoredLine(line)) return;
    if (JavaApple2Compiler.compileGraphics(line, bin, asm, logs)) return;
    if (JavaApple2Compiler.compileIo(line, bin, asm, logs)) return;
    JavaApple2Compiler.compileStorage(line, bin, asm, logs);
  }

  private static compileGraphics(line: string, bin: number[], asm: string[], logs: string[]): boolean {
    if (/setVideoMode|MODE_DOUBLE_HIRES/.test(line)) {
      JavaApple2Compiler.emitDoubleHiRes(line, bin, asm, logs);
      return true;
    }
    if (/clearScreen|Clear/.test(line)) {
      JavaApple2Compiler.emitClearScreen(line, bin, asm, logs);
      return true;
    }
    return false;
  }

  private static compileIo(line: string, bin: number[], asm: string[], logs: string[]): boolean {
    if (/beep|Beep/.test(line)) {
      JavaApple2Compiler.emitBeep(line, bin, asm, logs);
      return true;
    }
    if (/drawString|print/.test(line)) {
      JavaApple2Compiler.emitStringPrint(line, bin, asm, logs);
      return true;
    }
    return false;
  }

  private static compileStorage(line: string, bin: number[], asm: string[], logs: string[]): void {
    if (/readBlock|FileInputStream/.test(line)) {
      JavaApple2Compiler.emitStorageRead(line, bin, asm, logs);
    } else if (/writeBlock|FileOutputStream/.test(line)) {
      JavaApple2Compiler.emitStorageWrite(line, bin, asm, logs);
    }
  }

  private static emitStorageRead(line: string, bin: number[], asm: string[], logs: string[]): void {
    logs.push('[Java AOT] Emitting ProDOS MLI Block Read ($C700 / $BF00)...');
    bin.push(0xa9, 0x01, 0x8d, 0x00, 0x08, 0xa9, 0x70, 0x8d, 0x01, 0x08, 0xa9, 0x00, 0x8d, 0x02, 0x08, 0xa9, 0x20, 0x8d, 0x03, 0x08, 0x20, 0x00, 0xc7);
    asm.push(
      `; --- [Java] ${line} ---`,
      '       LDA #$01       ; MLI Command $01 (READ_BLOCK)',
      '       STA $0800      ; Param 0: MLI Command',
      '       LDA #$70       ; Unit #$70 (Slot 7 Drive 1 /HD)',
      '       STA $0801      ; Param 1: Unit Number',
      '       LDA #$00       ; Buffer Low ($2000)',
      '       STA $0802      ; Param 2: Data Buffer Ptr Low',
      '       LDA #$20       ; Buffer High',
      '       STA $0803      ; Param 3: Data Buffer Ptr High',
      '       JSR $C700      ; Call SmartPort Block Driver'
    );
  }

  private static emitStorageWrite(line: string, bin: number[], asm: string[], logs: string[]): void {
    logs.push('[Java AOT] Emitting ProDOS MLI Block Write ($C700 / $BF00)...');
    bin.push(0xa9, 0x02, 0x8d, 0x00, 0x08, 0xa9, 0x70, 0x8d, 0x01, 0x08, 0xa9, 0x00, 0x8d, 0x02, 0x08, 0xa9, 0x20, 0x8d, 0x03, 0x08, 0x20, 0x00, 0xc7);
    asm.push(
      `; --- [Java] ${line} ---`,
      '       LDA #$02       ; MLI Command $02 (WRITE_BLOCK)',
      '       STA $0800      ; Param 0: MLI Command',
      '       LDA #$70       ; Unit #$70 (Slot 7 Drive 1 /HD)',
      '       STA $0801      ; Param 1: Unit Number',
      '       LDA #$00       ; Buffer Low ($2000)',
      '       STA $0802      ; Param 2: Data Buffer Ptr Low',
      '       LDA #$20       ; Buffer High',
      '       STA $0803      ; Param 3: Data Buffer Ptr High',
      '       JSR $C700      ; Call SmartPort Block Driver'
    );
  }

  private static emitDoubleHiRes(line: string, bin: number[], asm: string[], logs: string[]): void {
    logs.push('[Java AOT] Emitting Double Hi-Res setup...');
    bin.push(0x8d, 0x50, 0xc0, 0x8d, 0x57, 0xc0, 0x8d, 0x0d, 0xc0, 0x8d, 0x5f, 0xc0);
    asm.push(
      `; --- [Java] ${line} ---`,
      '       STA $C050      ; TXTCLR (Graphics Mode)',
      '       STA $C057      ; HIRES (280x192 Display)',
      '       STA $C00D      ; 80COLSET (Aux Video RAM)',
      '       STA $C05F      ; DHIRESON (560x192 Double Hi-Res)'
    );
  }

  private static emitClearScreen(line: string, bin: number[], asm: string[], logs: string[]): void {
    logs.push('[Java AOT] Emitting screen clear routine...');
    bin.push(0xa9, 0x00, 0xa0, 0x00, 0x99, 0x00, 0x20, 0x88, 0xd0, 0xfb);
    asm.push(
      `; --- [Java] ${line} ---`,
      '       LDA #$00',
      '       LDY #$00',
      'CLEAR: STA $2000,Y    ; Clear $2000 VRAM',
      '       DEY',
      '       BNE CLEAR'
    );
  }

  private static emitBeep(line: string, bin: number[], asm: string[], logs: string[]): void {
    logs.push('[Java AOT] Emitting speaker pulse generator...');
    bin.push(0xa2, 0x80, 0xad, 0x30, 0xc0, 0xa0, 0x20, 0x88, 0xd0, 0xfd, 0xca, 0xd0, 0xf5);
    asm.push(
      `; --- [Java] ${line} ---`,
      '       LDX #$80       ; Duration loop',
      'BEEP:  LDA $C030      ; Toggle Speaker Softswitch ($C030)',
      '       LDY #$20       ; Frequency delay',
      'DLY:   DEY',
      '       BNE DLY',
      '       DEX',
      '       BNE BEEP'
    );
  }

  private static emitStringPrint(line: string, bin: number[], asm: string[], logs: string[]): void {
    const match = line.match(/["'](.*?)["']/);
    const str = match ? match[1] : 'HELLO APPLE II';
    logs.push(`[Java AOT] Emitting print for "${str}"...`);
    asm.push(`; --- [Java] ${line} ---`);
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i) | 0x80;
      bin.push(0xa9, ch, 0x20, 0xed, 0xfd);
      asm.push(`       LDA #$${ch.toString(16).toUpperCase()}      ; ASCII '${str[i]}'`, `       JSR $FDED      ; COUT character output`);
    }
  }
}
