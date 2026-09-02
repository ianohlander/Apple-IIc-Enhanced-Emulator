import { runner, assertEqual } from '../testRunner';
import { TextRenderer } from '../../src/emulator/video/renderers/TextRenderer';
import { DoubleHiResRenderer } from '../../src/emulator/video/renderers/DoubleHiResRenderer';

export function runVideoAddressMapTests(): void {
  runner.suite('Apple II Video: Address Calculations', () => {
    runner.test('Text Row Memory Base Addresses (0-23)', () => {
      // Row 0 = $0400
      assertEqual(TextRenderer.getTextRowAddress(0), 0x0400);
      // Row 1 = $0480
      assertEqual(TextRenderer.getTextRowAddress(1), 0x0480);
      // Row 8 = $0428
      assertEqual(TextRenderer.getTextRowAddress(8), 0x0428);
      // Row 23 = $07D0
      assertEqual(TextRenderer.getTextRowAddress(23), 0x07d0);
    });

    runner.test('Hi-Res Scanline Base Addresses (0-191)', () => {
      // Line 0 = $2000
      assertEqual(DoubleHiResRenderer.getHgrRowAddress(0), 0x2000);
      // Line 1 = $2400
      assertEqual(DoubleHiResRenderer.getHgrRowAddress(1), 0x2400);
      // Line 8 = $2080
      assertEqual(DoubleHiResRenderer.getHgrRowAddress(8), 0x2080);
      // Line 64 = $2028
      assertEqual(DoubleHiResRenderer.getHgrRowAddress(64), 0x2028);
    });
  });
}
