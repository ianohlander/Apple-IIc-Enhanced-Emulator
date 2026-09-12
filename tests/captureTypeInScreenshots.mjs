import { BrowserRunner } from './cdpClient.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const artifactDir = 'C:\\Users\\ianoh\\.gemini\\antigravity\\brain\\aba576ae-a625-466a-a6fd-0e7cf3fc10a3';

async function captureAllTypeIns() {
  console.log('🚀 Starting Automated Screenshot Capture for All Type-In Programs...\n');
  const { proc, client } = await BrowserRunner.launch();

  try {
    const fileUrl = 'file:///' + path.join(rootDir, 'index-standalone.html').replace(/\\/g, '/');
    console.log('Navigating to:', fileUrl);
    await client.send('Page.navigate', { url: fileUrl });

    // Wait for emulator to be ready
    for (let i = 0; i < 50; i++) {
      const ready = await client.send('Runtime.evaluate', {
        expression: 'document.readyState === "complete" && typeof window.emulator !== "undefined"'
      });
      if (ready.result && ready.result.value === true) break;
      await new Promise(r => setTimeout(r, 100));
    }

    // Set speed to 50 MHz for fast rendering
    await client.send('Runtime.evaluate', {
      expression: 'window.emulator.setSpeed(50);'
    });

    const qaDir = path.join(rootDir, 'qa', 'screenshots');
    const docsDir = path.join(rootDir, 'docs', 'qa', 'screenshots');
    fs.mkdirSync(qaDir, { recursive: true });
    fs.mkdirSync(docsDir, { recursive: true });

    async function saveCanvasScreenshot(filename, label) {
      const res = await client.send('Runtime.evaluate', {
        expression: `
          (() => {
            const canvas = document.getElementById('screen-canvas');
            return canvas ? canvas.toDataURL('image/png') : null;
          })()
        `,
        returnByValue: true
      });

      if (!res.result || !res.result.value) {
        throw new Error(`Failed to capture canvas for ${label}`);
      }

      const base64Data = res.result.value.replace(/^data:image\/png;base64,/, '');
      const buf = Buffer.from(base64Data, 'base64');

      const qaPath = path.join(qaDir, filename);
      const docsPath = path.join(docsDir, filename);
      const artPath = path.join(artifactDir, filename);

      fs.writeFileSync(qaPath, buf);
      fs.writeFileSync(docsPath, buf);
      fs.writeFileSync(artPath, buf);
      console.log(`  📸 Saved screenshot: ${filename} (${buf.length} bytes)`);
    }

    // -------------------------------------------------------------
    // 1. inCider DHGR Kaleidoscope
    // -------------------------------------------------------------
    console.log('\n[1/5] Capturing inCider DHGR Kaleidoscope (1984)...');
    await client.send('Runtime.evaluate', {
      expression: `
        window.emulator.reset();
        window.emulator.setSpeed(50);
        window.loadSampleTypeIn('kaleidoscope');
        window.injectTypeIn();
      `
    });
    // Wait for Hi-Res plotting to complete
    await new Promise(r => setTimeout(r, 2500));
    await saveCanvasScreenshot('typein-kaleidoscope.png', 'inCider Kaleidoscope');

    // -------------------------------------------------------------
    // 2. Nibble 3D Starfield Warp
    // -------------------------------------------------------------
    console.log('\n[2/5] Capturing Nibble 3D Starfield Warp (1983)...');
    await client.send('Runtime.evaluate', {
      expression: `
        window.emulator.reset();
        window.emulator.setSpeed(50);
        window.loadSampleTypeIn('starfield');
        window.injectTypeIn();
      `
    });
    // Wait for 3D star projection
    await new Promise(r => setTimeout(r, 2500));
    await saveCanvasScreenshot('typein-starfield.png', 'Nibble 3D Starfield');

    // -------------------------------------------------------------
    // 3. Compute! / Softalk Apollo Lunar Lander
    // -------------------------------------------------------------
    console.log('\n[3/5] Capturing Compute! / Softalk Apollo Lunar Lander...');
    await client.send('Runtime.evaluate', {
      expression: `
        window.emulator.reset();
        window.emulator.setSpeed(50);
        window.loadSampleTypeIn('lander');
        window.injectTypeIn();
      `
    });
    // Wait for descent telemetry and first prompt
    await new Promise(r => setTimeout(r, 1200));
    await saveCanvasScreenshot('typein-lunarlander.png', 'Apollo Lunar Lander');

    // -------------------------------------------------------------
    // 4. 65C02 Machine Code Monitor Hex Dump ($300)
    // -------------------------------------------------------------
    console.log('\n[4/5] Capturing 65C02 Machine Code Monitor Hex Dump ($300)...');
    await client.send('Runtime.evaluate', {
      expression: `
        window.emulator.reset();
        window.emulator.setSpeed(50);
        window.loadSampleTypeIn('assembly');
        window.injectTypeIn();
      `
    });
    // Wait for monitor hex deposit & ROM execution
    await new Promise(r => setTimeout(r, 1200));
    await saveCanvasScreenshot('typein-hexdump.png', '65C02 Hex Dump');

    // -------------------------------------------------------------
    // 5. Bird Brain (HCM 1984)
    // -------------------------------------------------------------
    console.log('\n[5/5] Capturing Bird Brain (HCM 1984)...');
    await client.send('Runtime.evaluate', {
      expression: `
        window.emulator.reset();
        window.emulator.setSpeed(50);
        window.loadSampleTypeIn('birdbrain');
        window.injectTypeIn();
      `
    });

    // Provide keyboard responses to the setup prompts
    for (let sec = 0; sec < 30; sec++) {
      await new Promise(r => setTimeout(r, 400));
      const status = await client.send('Runtime.evaluate', {
        expression: `
          (() => {
            const emu = window.emulator;
            if (!emu) return null;
            const curLineObj = emu.parsedBasicLines ? emu.parsedBasicLines[emu.basicLinePtr] : null;
            const lineNum = curLineObj ? curLineObj.lineNum : null;
            const stmt = curLineObj && curLineObj.statements ? curLineObj.statements[emu.basicStmtPtr] : null;
            
            if (stmt && stmt.toUpperCase().startsWith('GET')) {
              if (lineNum === 370) emu.typeChar('K');
              else if (lineNum === 380) emu.typeChar('Y');
              else if (lineNum === 430) emu.typeChar('1');
            }

            return {
              isGraphicsMode: emu.isGraphicsMode,
              lineNum
            };
          })()
        `,
        returnByValue: true
      });

      if (status.result && status.result.value && status.result.value.isGraphicsMode) {
        console.log('  🌟 Hi-Res graphics active, waiting 1.2s for tropical landscape render...');
        await new Promise(r => setTimeout(r, 1200));
        break;
      }
    }
    await saveCanvasScreenshot('typein-birdbrain.png', 'Bird Brain HCM');

    console.log('\n🎉 ALL 5 SCREENSHOTS CAPTURED SUCCESSFULLY!\n');
  } catch (err) {
    console.error('❌ Error during capture:', err);
    throw err;
  } finally {
    try {
      await client.close();
      proc.kill();
    } catch(e) {}
    process.exit(0);
  }
}

captureAllTypeIns().catch(err => {
  console.error(err);
  process.exit(1);
});
