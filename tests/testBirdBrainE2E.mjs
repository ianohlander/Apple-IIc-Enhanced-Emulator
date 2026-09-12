import { BrowserRunner } from './cdpClient.mjs';
import fs from 'fs';

async function runBirdBrainTest() {
  console.log('🚀 Launching Headless Browser for Bird Brain E2E Execution...\n');
  const { proc, client } = await BrowserRunner.launch();

  try {
    const fileUrl = 'file:///h:/My%20Drive/Repos/Apple-II-Emulator/index-standalone.html';
    await client.send('Page.navigate', { url: fileUrl });

    for (let i = 0; i < 50; i++) {
      const ready = await client.send('Runtime.evaluate', {
        expression: 'document.readyState === "complete" && typeof window.emulator !== "undefined"'
      });
      if (ready.result && ready.result.value === true) break;
      await new Promise(r => setTimeout(r, 100));
    }

    await client.send('Runtime.evaluate', { expression: 'window.focus()' });
    await new Promise(r => setTimeout(r, 200));

    // Load Bird Brain sample
    console.log('Loading Bird Brain sample and injecting into emulator...');
    await client.send('Runtime.evaluate', {
      expression: 'loadSampleTypeIn("birdbrain"); injectTypeIn();'
    });

    for (let sec = 0; sec < 30; sec++) {
      await new Promise(r => setTimeout(r, 500));
      const status = await client.send('Runtime.evaluate', {
        expression: `
          (() => {
            const emu = window.emulator;
            if (!emu) return 'no emu';
            const curLineObj = emu.parsedBasicLines ? emu.parsedBasicLines[emu.basicLinePtr] : null;
            const lineNum = curLineObj ? curLineObj.lineNum : null;
            const stmt = curLineObj && curLineObj.statements ? curLineObj.statements[emu.basicStmtPtr] : null;
            
            // Auto feed inputs if waiting for GET
            if (stmt && stmt.toUpperCase().startsWith('GET')) {
              if (lineNum === 370) emu.typeChar('K');
              else if (lineNum === 380) emu.typeChar('Y');
              else if (lineNum === 430) emu.typeChar('1');
            }

            return {
              isRunningBasic: emu.isRunningBasic,
              lineNum,
              stmt,
              isGraphicsMode: emu.isGraphicsMode,
              isHires: emu.isHires,
              isPage2: emu.isPage2,
              basicVars: emu.basicVars
            };
          })()
        `,
        returnByValue: true
      });

      console.log(`[T+${sec * 0.5}s]`, JSON.stringify(status.result ? status.result.value : null));

      if (status.result && status.result.value && status.result.value.isGraphicsMode) {
        console.log('🌟 Hi-Res Graphics Mode is ACTIVE! Waiting 4 seconds for drawing to complete...');
        await new Promise(r => setTimeout(r, 4000));
        break;
      }
    }

    // Capture screen-canvas
    const canvasRes = await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const canvas = document.getElementById('screen-canvas');
          return canvas ? canvas.toDataURL('image/png') : null;
        })()
      `,
      returnByValue: true
    });

    if (canvasRes.result && canvasRes.result.value) {
      const base64Data = canvasRes.result.value.replace(/^data:image\/png;base64,/, '');
      const outPath = 'C:/Users/ianoh/.gemini/antigravity/brain/e04a9353-1aab-4a36-af43-46b76b7cf72c/scratch/bird_brain_live_screen.png';
      fs.writeFileSync(outPath, Buffer.from(base64Data, 'base64'));
      console.log('✅ Live canvas screenshot saved to ' + outPath);
    } else {
      console.error('❌ Could not get screen-canvas dataURL');
    }

    const screenshotRes = await client.send('Page.captureScreenshot', { format: 'png' });
    if (screenshotRes && screenshotRes.data) {
      const fullPagePath = 'C:/Users/ianoh/.gemini/antigravity/brain/e04a9353-1aab-4a36-af43-46b76b7cf72c/scratch/bird_brain_full_page.png';
      fs.writeFileSync(fullPagePath, Buffer.from(screenshotRes.data, 'base64'));
      console.log('✅ Full page screenshot saved to ' + fullPagePath);
    }
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    try {
      await client.close();
      proc.kill();
    } catch (e) {}
    console.log('Done.');
  }
}

runBirdBrainTest();
