import { BrowserRunner } from './cdpClient.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const artifactDir = 'C:\\Users\\ianoh\\.gemini\\antigravity\\brain\\e04a9353-1aab-4a36-af43-46b76b7cf72c';

async function captureWorldGamesScreenshots() {
  console.log('🚀 Starting Automated Screenshot Capture for World Games...\n');
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
      try { fs.writeFileSync(artPath, buf); } catch (e) {}

      console.log(`📸 [${label}] -> ${filename} (${buf.length} bytes)`);
    }

    // 1. Launch World Games
    console.log('1. Launching World Games Title Screen...');
    await client.send('Runtime.evaluate', {
      expression: `
        window.emulator.launchWorldGames('WORLD GAMES DISK 1A.WOZ');
        window.emulator.setPhosphor('color');
      `
    });
    await new Promise(r => setTimeout(r, 400));
    await saveCanvasScreenshot('world_games_title.png', 'World Games Title Screen');

    // 2. Open Menu
    console.log('2. Opening Event Selection Menu...');
    await client.send('Runtime.evaluate', {
      expression: `
        window.emulator.worldGamesEngine.handleKey(27); // ESC -> Menu
      `
    });
    await new Promise(r => setTimeout(r, 200));
    await saveCanvasScreenshot('world_games_menu.png', 'World Games Event Selection Menu');

    // 3. Select Cliff Diving (Event 0)
    console.log('3. Launching Cliff Diving Event...');
    await client.send('Runtime.evaluate', {
      expression: `window.emulator.worldGamesEngine.selectEvent(0);`
    });
    await new Promise(r => setTimeout(r, 200));
    await saveCanvasScreenshot('world_games_cliff_diving.png', 'Cliff Diving (Mexico)');

    // 4. Select Weightlifting (Event 1)
    console.log('4. Launching Weightlifting Event...');
    await client.send('Runtime.evaluate', {
      expression: `window.emulator.worldGamesEngine.selectEvent(1);`
    });
    await new Promise(r => setTimeout(r, 200));
    await saveCanvasScreenshot('world_games_weightlifting.png', 'Weightlifting (Russia)');

    // 5. Select Barrel Jumping (Event 2)
    console.log('5. Launching Barrel Jumping Event...');
    await client.send('Runtime.evaluate', {
      expression: `window.emulator.worldGamesEngine.selectEvent(2);`
    });
    await new Promise(r => setTimeout(r, 200));
    await saveCanvasScreenshot('world_games_barrel_jumping.png', 'Barrel Jumping (Germany)');

    // 6. Select Log Rolling (Event 3)
    console.log('6. Launching Log Rolling Event...');
    await client.send('Runtime.evaluate', {
      expression: `window.emulator.worldGamesEngine.selectEvent(3);`
    });
    await new Promise(r => setTimeout(r, 200));
    await saveCanvasScreenshot('world_games_log_rolling.png', 'Log Rolling (Canada)');

    // 7. Select Bull Riding (Event 4)
    console.log('7. Launching Bull Riding Event...');
    await client.send('Runtime.evaluate', {
      expression: `window.emulator.worldGamesEngine.selectEvent(4);`
    });
    await new Promise(r => setTimeout(r, 200));
    await saveCanvasScreenshot('world_games_bull_riding.png', 'Bull Riding (USA)');

    // 8. Select Sumo (Event 5)
    console.log('8. Launching Sumo Wrestling Event...');
    await client.send('Runtime.evaluate', {
      expression: `window.emulator.worldGamesEngine.selectEvent(5);`
    });
    await new Promise(r => setTimeout(r, 200));
    await saveCanvasScreenshot('world_games_sumo.png', 'Sumo Wrestling (Japan)');

    // 9. Select Slalom Skiing (Event 6)
    console.log('9. Launching Slalom Skiing Event...');
    await client.send('Runtime.evaluate', {
      expression: `window.emulator.worldGamesEngine.selectEvent(6);`
    });
    await new Promise(r => setTimeout(r, 200));
    await saveCanvasScreenshot('world_games_slalom_skiing.png', 'Slalom Skiing (France)');

    // 10. Select Caber Toss (Event 7)
    console.log('10. Launching Caber Toss Event...');
    await client.send('Runtime.evaluate', {
      expression: `window.emulator.worldGamesEngine.selectEvent(7);`
    });
    await new Promise(r => setTimeout(r, 200));
    await saveCanvasScreenshot('world_games_caber_toss.png', 'Caber Toss (Scotland)');

    console.log('\n✨ All 8 World Games Championship Screenshots Captured Successfully!');
  } finally {
    try { await client.close(); } catch(e) {}
    try { proc.kill(); } catch(e) {}
  }
}

captureWorldGamesScreenshots().catch(err => {
  console.error('❌ Error during capture:', err);
  process.exit(1);
});
