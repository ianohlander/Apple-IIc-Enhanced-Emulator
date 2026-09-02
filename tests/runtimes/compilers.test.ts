import { runner, assertTrue, assertEqual } from '../testRunner';
import { JavaApple2Compiler } from '../../src/emulator/runtimes/javaVm';
import { CSharpApple2Compiler } from '../../src/emulator/runtimes/clrRunner';
import { SAMPLE_JAVA_CODE, SAMPLE_CSHARP_CODE } from '../../src/samples/sampleCode';

export function runCompilerTests(): void {
  runner.suite('Modern Runtimes: Java & C# 65C02 AOT Compilers', () => {
    runner.test('Java AOT Compiler produces valid 65C02 binary with DHGR switches', () => {
      const result = JavaApple2Compiler.compile(SAMPLE_JAVA_CODE);
      assertTrue(result.success, 'Java compilation succeeded');
      assertTrue(result.binary.length > 0, 'Binary output generated');
      assertEqual(result.entryAddress, 0x2000, 'Entry vector at $2000');
      assertTrue(result.generated6502Asm.includes('STA $C05F'), 'Includes DHGR softswitch');
    });

    runner.test('C# .NET CLR AOT Compiler produces valid 65C02 binary with Sound routines', () => {
      const result = CSharpApple2Compiler.compile(SAMPLE_CSHARP_CODE);
      assertTrue(result.success, 'C# compilation succeeded');
      assertTrue(result.binary.length > 0, 'Binary output generated');
      assertEqual(result.entryAddress, 0x2000, 'Entry vector at $2000');
      assertTrue(result.generated6502Asm.includes('LDA $C030'), 'Includes speaker toggle');
    });

    runner.test('C# AOT: Compile Retro Breakout Arcade App (Extract Strings, DHGR & Chiptune Beeps)', () => {
      const breakoutSrc = `
        using System;
        using Apple2.Ultra;

        namespace RetroBreakout
        {
            public class BreakoutGame
            {
                public static void Main()
                {
                    // Activate Double Hi-Res
                    Graphics.SetDoubleHiRes();

                    // Display Title & Score HUD
                    Graphics.Print(0, 0, "RETRO BREAKOUT ULTRA (C# AOT)");
                    Graphics.Print(0, 1, "SCORE: 0000 | LIVES: 3 | BRICKS: 32");

                    // Chiptune Audio Effects
                    Sound.Beep(520, 100);
                    Sound.Beep(880, 150);

                    // Launch Prompt
                    Graphics.Print(0, 2, "PRESS SPACE TO LAUNCH BALL");
                }
            }
        }
      `;

      const result = CSharpApple2Compiler.compile(breakoutSrc);
      assertTrue(result.success, 'Retro Breakout compilation succeeded');
      assertTrue(result.byteCodeSize > 100, `Generated significant machine code (${result.byteCodeSize} bytes)`);
      assertEqual(result.entryAddress, 0x2000, 'Entry point at $2000');

      // Verify DHGR softswitches emitted: $C050 (TXTCLR), $C057 (HIRES), $C00D (80COLSET), $C05F (DHIRESON)
      assertTrue(result.generated6502Asm.includes('STA $C050'), 'Emits TXTCLR softswitch');
      assertTrue(result.generated6502Asm.includes('STA $C057'), 'Emits HIRES softswitch');
      assertTrue(result.generated6502Asm.includes('STA $C00D'), 'Emits 80COLSET softswitch');
      assertTrue(result.generated6502Asm.includes('STA $C05F'), 'Emits DHIRESON softswitch');

      // Verify String extraction with high-bit set ASCII (Apple II text format)
      // 'R' = 0x52 -> 0xD2; 'E' = 0x45 -> 0xC5; 'T' = 0x54 -> 0xD4
      assertTrue(result.generated6502Asm.includes('LDA #$D2'), 'Emits character R (0xD2)');
      assertTrue(result.generated6502Asm.includes('LDA #$C5'), 'Emits character E (0xC5)');
      assertTrue(result.generated6502Asm.includes('JSR $FDED ; COUT'), 'Emits Apple II COUT routine calls');

      // Verify Chiptune sound routine with $C030 speaker toggle and delay loop
      assertTrue(result.generated6502Asm.includes('LDA $C030'), 'Emits $C030 speaker read');
      assertTrue(result.generated6502Asm.includes('LDX #$60'), 'Emits audio frequency counter in X');
      assertTrue(result.generated6502Asm.includes('BNE BEEP'), 'Emits sound synthesis loop branch');

      // Verify RTS termination
      assertEqual(result.binary[result.binary.length - 1], 0x60, 'Binary ends with RTS (0x60)');
    });

    runner.test('Java AOT: Compile OOP Class with String Rendering, ClearScreen and Sound', () => {
      const javaOopSrc = `
        package arcade.games;
        import apple2.Apple2;

        public class BreakoutOOP {
            public static void main(String[] args) {
                // Initialize Double Hi-Res & Clear Screen
                Apple2.setVideoMode(Apple2.MODE_DOUBLE_HIRES);
                Apple2.clearScreen(Apple2.BLACK);

                // OOP Text Output
                Apple2.drawString(0, 0, "JAVA VM RUNNING ON APPLE IIC ULTRA");
                Apple2.drawString(0, 1, "PADDLE INITIALIZED AT X:60 Y:180");
                Apple2.drawString(0, 2, "BALL VELOCITY: VX=+1 VY=-1");

                // Audio Tone
                Apple2.beep(440, 200);
            }
        }
      `;

      const result = JavaApple2Compiler.compile(javaOopSrc);
      assertTrue(result.success, 'Java OOP compilation succeeded');
      assertTrue(result.byteCodeSize > 100, `Generated ${result.byteCodeSize} bytes binary`);
      assertEqual(result.entryAddress, 0x2000, 'Entry vector at $2000');

      // Verify DHGR, Clear Screen, and String COUT routines
      assertTrue(result.generated6502Asm.includes('STA $C05F'), 'Emits DHGR enable switch');
      assertTrue(result.generated6502Asm.includes('STA $2000,Y'), 'Emits Hi-Res screen memory clear loop');
      assertTrue(result.generated6502Asm.includes('JSR $FDED ; COUT'), 'Emits Apple II character output');
      assertTrue(result.generated6502Asm.includes('LDA $C030'), 'Emits speaker toggle');
      assertEqual(result.binary[result.binary.length - 1], 0x60, 'Ends with RTS');
    });
  });
}
