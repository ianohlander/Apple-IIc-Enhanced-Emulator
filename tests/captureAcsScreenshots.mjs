import { BrowserRunner } from './cdpClient.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const artifactDir = 'C:\\Users\\ianoh\\.gemini\\antigravity\\brain\\e04a9353-1aab-4a36-af43-46b76b7cf72c';

async function captureAcsScreenshots() {
  console.log('🚀 Starting Automated Screenshot Capture for Adventure Construction Set (1985 EA)...\n');
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

    // 1. Launch Adventure Construction Set Title Screen
    console.log('1. Launching ACS Title Screen...');
    await client.send('Runtime.evaluate', {
      expression: `
        window.emulator.launchAdventureConstructionSet('ADVCONSTSET1OF6.DSK');
        window.emulator.setPhosphor('color');
      `
    });
    await new Promise(r => setTimeout(r, 500));
    await saveCanvasScreenshot('acs_title_screen.png', 'ACS Title Screen & EA Presentation');

    // 2. Open Main Menu
    console.log('2. Opening ACS Workstation Main Menu...');
    await client.send('Runtime.evaluate', {
      expression: `
        window.emulator.acsEngine.handleKey(32); // Space -> Main Menu
      `
    });
    await new Promise(r => setTimeout(r, 300));
    await saveCanvasScreenshot('acs_main_menu.png', 'ACS Workstation Module Selection Menu');

    // 3. Open Construction Workstation (Map & Terrain Editor)
    console.log('3. Opening Map & Terrain Construction Workstation...');
    await client.send('Runtime.evaluate', {
      expression: `
        window.emulator.acsEngine.selectMenuItem(0); // 0 -> Workstation Map Editor
      `
    });
    await new Promise(r => setTimeout(r, 300));
    await saveCanvasScreenshot('acs_workstation_editor.png', 'ACS Map & Terrain Construction Studio');

    // 4. Open Monster & Creature Studio
    console.log('4. Opening Monster & Creature Studio...');
    await client.send('Runtime.evaluate', {
      expression: `
        window.emulator.acsEngine.handleKey(77); // 'M' -> Monster Studio
      `
    });
    await new Promise(r => setTimeout(r, 300));
    await saveCanvasScreenshot('acs_monster_studio.png', 'Monster & Creature RPG Studio');

    // 5. Open Adventure Play Mode (Rivers of Light)
    console.log('5. Launching Adventure Play Mode...');
    await client.send('Runtime.evaluate', {
      expression: `
        window.emulator.acsEngine.state.view = 'PLAY';
        window.emulator.acsEngine.render();
      `
    });
    await new Promise(r => setTimeout(r, 300));
    await saveCanvasScreenshot('acs_adventure_play.png', 'Adventure Play Mode (Rivers of Light)');

    console.log('\n✨ All 5 Adventure Construction Set screenshots captured successfully!');
  } finally {
    try { client.close(); } catch (e) {}
    try { proc.kill(); } catch (e) {}
  }
}

captureAcsScreenshots().catch(err => {
  console.error('❌ Error during ACS screenshot capture:', err);
  process.exit(1);
});
