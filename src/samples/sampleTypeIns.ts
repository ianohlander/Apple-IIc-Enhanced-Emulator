export interface MagazineProgram {
  id: string;
  title: string;
  magazine: string;
  issueDate: string;
  author: string;
  language: 'Applesoft BASIC' | 'Machine Code Monitor' | 'Double Hi-Res';
  description: string;
  sourceCode: string;
  entryPoint?: number;
}

export const SAMPLE_MAGAZINE_PROGRAMS: MagazineProgram[] = [
  {
    id: 'incider-dhgr-kaleidoscope',
    title: 'Ultra DHGR Kaleidoscope',
    magazine: 'inCider Magazine',
    issueDate: 'October 1984',
    author: 'Bill Morgan',
    language: 'Applesoft BASIC',
    description: 'A dazzling 16-color Double Hi-Res pattern generator that calculates mathematical symmetry in real-time.',
    sourceCode: `10 REM *** IN-CIDER MAGAZINE DHGR KALEIDOSCOPE ***
20 POKE 49232,0 : POKE 49239,0 : POKE 49165,0 : POKE 49247,0
30 HGR : POKE 49234,0
40 HCOLOR= 3
50 FOR R = 10 TO 90 STEP 5
60   FOR A = 0 TO 6.28 STEP 0.15
70     X1 = 140 + R * COS(A)
80     Y1 = 96 + R * SIN(A)
90     X2 = 140 - R * COS(A)
100    Y2 = 96 - R * SIN(A)
110    HPLOT X1, Y1 TO X2, Y2
120  NEXT A
130 NEXT R
140 PRINT "ENJOY THE KALEIDOSCOPE - PRESS KEY"
150 IF PEEK(49152) < 128 THEN 150
160 POKE 49168,0 : TEXT : HOME : END`
  },
  {
    id: 'nibble-sound-blaster',
    title: 'Mockingboard / 1-Bit Dual Sound Synth',
    magazine: 'Nibble Magazine',
    issueDate: 'March 1985',
    author: 'Craig Peterson',
    language: 'Machine Code Monitor',
    description: 'A high-speed 65C02 assembly synthesizer that sweeps 1-bit speaker audio while clocking AY-3-8910 Mockingboard voices in Slot 4.',
    sourceCode: `300: A2 20 A0 10 AD 30 C0 88 D0 FD CA D0 F5 60
310: A9 00 8D 00 C0 A9 0F 8D 01 C0 60`,
    entryPoint: 0x300
  },
  {
    id: 'compute-warp-drive',
    title: 'Deep Space Starfield Warp',
    magazine: 'Compute! Magazine',
    issueDate: 'July 1986',
    author: 'David Thornburg',
    language: 'Applesoft BASIC',
    description: 'Simulates high-speed 3D starfield acceleration through deep space on the Apple IIc.',
    sourceCode: `10 REM *** COMPUTE! 3D STARFIELD WARP ***
20 HOME : HGR : HCOLOR= 3
30 DIM SX(60), SY(60), SZ(60)
40 FOR I = 1 TO 60
50   SX(I) = (RND(1) - 0.5) * 200
60   SY(I) = (RND(1) - 0.5) * 150
70   SZ(I) = RND(1) * 100 + 1
80 NEXT I
90 FOR STEP = 1 TO 200
100  FOR I = 1 TO 60
110    SZ(I) = SZ(I) - 3
120    IF SZ(I) <= 1 THEN SZ(I) = 100
130    PX = 140 + (SX(I) / SZ(I)) * 50
140    PY = 96 + (SY(I) / SZ(I)) * 50
150    IF PX >= 0 AND PX < 280 AND PY >= 0 AND PY < 192 THEN HPLOT PX, PY
160  NEXT I
170 NEXT STEP
180 TEXT : HOME : PRINT "WARP SEQUENCE COMPLETE." : END`
  },
  {
    id: 'softalk-lunar-lander',
    title: 'Apollo Lunar Lander',
    magazine: 'Softalk Magazine',
    issueDate: 'December 1983',
    author: 'Mark Pelczarski',
    language: 'Applesoft BASIC',
    description: 'Classic physics simulation of manual moon lander descent with retro thrust calculation and gravity telemetry.',
    sourceCode: `10 REM *** SOFTALK APOLLO LUNAR LANDER ***
20 HOME : PRINT "--- APOLLO 11 LUNAR LANDER ---"
30 ALT = 1000 : VEL = 50 : FUEL = 250
40 PRINT "ALTITUDE: "; ALT; " M | VELOCITY: "; VEL; " M/S | FUEL: "; FUEL
50 IF ALT <= 0 THEN 140
60 INPUT "THRUST (0-30 LBS)? "; T
70 IF T < 0 THEN T = 0
80 IF T > 30 THEN T = 30
90 IF T > FUEL THEN T = FUEL
100 FUEL = FUEL - T
110 VEL = VEL + 1.6 - (T * 0.2)
120 ALT = ALT - VEL
130 GOTO 40
140 IF VEL <= 5 THEN PRINT "PERFECT TOUCHDOWN! THE EAGLE HAS LANDED!" : END
150 PRINT "CRASHED ON IMPACT AT "; INT(VEL); " M/S! MISSION FAILED." : END`
  }
];
