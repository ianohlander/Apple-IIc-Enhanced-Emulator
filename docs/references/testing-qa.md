# Testing & Quality Assurance Guide

This document outlines the testing framework and quality assurance practices for the Apple IIc Ultra project. It provides specific command targets designed to keep terminal output compact and minimize LLM context token usage.

---

## 1. Quick Validation Commands (Token-Efficient)

When working with an AI coding assistant, avoid dumping large multi-page test logs into the conversation. Use these targeted commands:

| Task | Command | Output Size | When to Run |
| :--- | :--- | :--- | :--- |
| **Type Check** | `npx tsc --noEmit` | Clean (0 lines on success) | After modifying any TypeScript file |
| **Type-In Tests** | `npm run test:typein` | ~15 lines | After touching BASIC parsing or monitor injection |
| **UI Surface Tests** | `npm run test:surface` | ~20 lines | After editing React components or CRT canvas |
| **Lab Tests** | `npm run test:labs` | ~25 lines | After modifying storage or peripheral card code |
| **Master Suite** | `npm test` | ~100 lines | Prior to commits or final plan verification |

---

## 2. Test Suites Overview

### Master Test Runner (`tests/runTests.mjs`)
Executes 66 automated test suites covering:
1. **Code QA & Cyclomatic Complexity**: Verifies that CPU, MMU, Video, Storage, and Runtime methods strictly satisfy Cyclomatic Complexity $\le 7$.
2. **Cycle & Arithmetic Accuracy**: Decimal mode `ADC`/`SBC`, branch relative offset calculations, and CMOS instruction extensions (`BRA`, `STZ`, `TRB`, `TSB`).
3. **MMU Banking**: Language Card 2-cycle write protection, `ALTZP` zero page switching, `80STORE` video page switching, and Slinky 24-bit auto-incrementing memory port.
4. **Storage Subsystems**: GCR 6-and-2 nibble translation table, 32MB SmartPort block I/O (65,536 blocks), and ProDOS volume directory structure.
5. **Video Pipeline**: Text row base address lookup ($0-23$), Hi-Res scanline base address lookup ($0-191$), and DHGR interleaved byte decoding.
6. **Audio**: AY-3-8910 tone period frequency calculation, noise generator LFSR, and volume attenuation.
7. **Modern Runtimes**: Java bytecode and C# .NET CLR Ahead-of-Time compilation to 65C02 machine code.

---

## 3. Code Standards & Static Analysis Rules

* **Cyclomatic Complexity $\le 7$**: Functions in `src/emulator/` must not exceed a CC score of 7. Use table dispatch or small helper functions rather than deep nested `if-else` or large `switch` blocks.
* **Preserve Documentation Integrity**: Never delete or alter existing HTML documentation in `docs/` as existing automated test suites audit these files for link integrity and watermark registries.
* **Strict Type Safety**: All source code compiles under TypeScript `strict: true` without errors.

---

## 4. Related Files

* Master Test Runner: [`tests/runTests.mjs`](file:///h:/My%20Drive/Repos/Apple-II-Emulator/tests/runTests.mjs)
* Surface Tests: [`tests/surfaceTestSuite.mjs`](file:///h:/My%20Drive/Repos/Apple-II-Emulator/tests/surfaceTestSuite.mjs)
* Type-In Tests: [`tests/typeinTestSuite.mjs`](file:///h:/My%20Drive/Repos/Apple-II-Emulator/tests/typeinTestSuite.mjs)
* Tutorial Lab Tests: [`tests/tutorialLabTestSuite.mjs`](file:///h:/My%20Drive/Repos/Apple-II-Emulator/tests/tutorialLabTestSuite.mjs)

