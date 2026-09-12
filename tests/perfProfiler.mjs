import { BrowserRunner } from './cdpClient.mjs';
import fs from 'fs';

// Helper for waiting
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function runProfiler() {
  console.log('================================================================');
  console.log('   APPLE //c ULTRA WORKSTATION - HEADLESS BROWSER PROFILER      ');
  console.log('================================================================\n');

  console.log('🚀 Launching Headless Browser (Edge/Chrome)...');
  const { proc, client } = await BrowserRunner.launch();

  try {
    const fileUrl = 'file:///h:/My%20Drive/Repos/Apple-II-Emulator/index-standalone.html';
    console.log(`🌐 Navigating to ${fileUrl}...`);
    await client.send('Page.navigate', { url: fileUrl });

    // Wait for emulator to be ready
    for (let i = 0; i < 50; i++) {
      const ready = await client.send('Runtime.evaluate', {
        expression: 'document.readyState === "complete" && typeof window.emulator !== "undefined"'
      });
      if (ready.result && ready.result.value === true) break;
      await sleep(100);
    }
    console.log('✅ Emulator loaded and ready.\n');

    // Inject profiler instrumentation harness into browser
    console.log('💉 Injecting performance instrumentation into browser context...');
    const injectRes = await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          if (window.__perfHarness) return 'already injected';

          const harness = {
            active: false,
            currentScenario: 'idle',
            metrics: {
              renderScreen: {
                callCount: 0,
                totalTimeMs: 0,
                minTimeMs: Infinity,
                maxTimeMs: 0,
                fillRectCalls: 0,
                fillTextCalls: 0,
                canvasStateChanges: 0,
                byOrigin: {
                  hplot: 0,
                  print: 0,
                  draw: 0,
                  poke: 0,
                  rafLoop: 0,
                  other: 0
                }
              },
              executeBasicLoop: {
                tickCount: 0,
                totalDurationMs: 0,
                minDurationMs: Infinity,
                maxDurationMs: 0,
                ticksOver16ms: 0,
                ticksOver50ms: 0,
                ticksOver100ms: 0,
                ticksOver250ms: 0,
                totalSteps: 0
              },
              handleHplot: {
                callCount: 0,
                totalTimeMs: 0,
                minTimeMs: Infinity,
                maxTimeMs: 0
              },
              statements: {},
              eventLoopLag: {
                samples: [],
                maxLagMs: 0,
                totalLagMs: 0,
                count: 0
              },
              fps: {
                frames: 0,
                history: []
              },
              domResponsiveness: []
            },
            resetMetrics() {
              this.metrics.renderScreen = {
                callCount: 0,
                totalTimeMs: 0,
                minTimeMs: Infinity,
                maxTimeMs: 0,
                fillRectCalls: 0,
                fillTextCalls: 0,
                canvasStateChanges: 0,
                byOrigin: { hplot: 0, print: 0, draw: 0, poke: 0, rafLoop: 0, other: 0 }
              };
              this.metrics.executeBasicLoop = {
                tickCount: 0,
                totalDurationMs: 0,
                minDurationMs: Infinity,
                maxDurationMs: 0,
                ticksOver16ms: 0,
                ticksOver50ms: 0,
                ticksOver100ms: 0,
                ticksOver250ms: 0,
                totalSteps: 0
              };
              this.metrics.handleHplot = {
                callCount: 0,
                totalTimeMs: 0,
                minTimeMs: Infinity,
                maxTimeMs: 0
              };
              this.metrics.statements = {};
              this.metrics.eventLoopLag = {
                samples: [],
                maxLagMs: 0,
                totalLagMs: 0,
                count: 0
              };
              this.metrics.fps = {
                frames: 0,
                history: []
              };
              this.metrics.domResponsiveness = [];
            }
          };

          // 1. Canvas instrumentation
          const origFillRect = CanvasRenderingContext2D.prototype.fillRect;
          CanvasRenderingContext2D.prototype.fillRect = function(...args) {
            if (harness.active) {
              harness.metrics.renderScreen.fillRectCalls++;
            }
            return origFillRect.apply(this, args);
          };

          const origFillText = CanvasRenderingContext2D.prototype.fillText;
          CanvasRenderingContext2D.prototype.fillText = function(...args) {
            if (harness.active) {
              harness.metrics.renderScreen.fillTextCalls++;
            }
            return origFillText.apply(this, args);
          };

          // 2. Track current caller of renderScreen
          let currentCaller = 'other';

          // 3. Wrap renderScreen
          const origRenderScreen = window.emulator.renderScreen.bind(window.emulator);
          window.emulator.renderScreen = function() {
            if (!harness.active) return origRenderScreen();
            const t0 = performance.now();
            origRenderScreen();
            const dt = performance.now() - t0;
            const m = harness.metrics.renderScreen;
            m.callCount++;
            m.totalTimeMs += dt;
            if (dt < m.minTimeMs) m.minTimeMs = dt;
            if (dt > m.maxTimeMs) m.maxTimeMs = dt;
            m.byOrigin[currentCaller] = (m.byOrigin[currentCaller] || 0) + 1;
          };

          // 4. Wrap executeBasicLoop
          const origExecuteBasicLoop = window.emulator.executeBasicLoop.bind(window.emulator);
          window.emulator.executeBasicLoop = function() {
            if (!harness.active) return origExecuteBasicLoop();
            const t0 = performance.now();
            origExecuteBasicLoop();
            const dt = performance.now() - t0;
            const m = harness.metrics.executeBasicLoop;
            m.tickCount++;
            m.totalDurationMs += dt;
            if (dt < m.minDurationMs) m.minDurationMs = dt;
            if (dt > m.maxDurationMs) m.maxDurationMs = dt;
            if (dt > 16) m.ticksOver16ms++;
            if (dt > 50) m.ticksOver50ms++;
            if (dt > 100) m.ticksOver100ms++;
            if (dt > 250) m.ticksOver250ms++;
          };

          // 5. Wrap handleHplot
          const origHandleHplot = window.emulator.handleHplot.bind(window.emulator);
          window.emulator.handleHplot = function(stmt) {
            if (!harness.active) return origHandleHplot(stmt);
            currentCaller = 'hplot';
            const t0 = performance.now();
            const res = origHandleHplot(stmt);
            const dt = performance.now() - t0;
            const m = harness.metrics.handleHplot;
            m.callCount++;
            m.totalTimeMs += dt;
            if (dt < m.minTimeMs) m.minTimeMs = dt;
            if (dt > m.maxTimeMs) m.maxTimeMs = dt;
            return res;
          };

          // 6. Wrap executeBasicStatement to track caller origins and statement counts
          const origExecuteBasicStatement = window.emulator.executeBasicStatement.bind(window.emulator);
          window.emulator.executeBasicStatement = function(stmt, lineNum) {
            if (!harness.active) return origExecuteBasicStatement(stmt, lineNum);
            const raw = (stmt || '').trim().toUpperCase();
            const op = raw.split(/[\\s=(]/)[0] || 'EMPTY';
            harness.metrics.statements[op] = (harness.metrics.statements[op] || 0) + 1;

            if (op === 'HPLOT') currentCaller = 'hplot';
            else if (op === 'PRINT' || op === '?') currentCaller = 'print';
            else if (op === 'DRAW' || op === 'XDRAW') currentCaller = 'draw';
            else if (op === 'POKE') currentCaller = 'poke';
            else currentCaller = 'other';

            const res = origExecuteBasicStatement(stmt, lineNum);
            currentCaller = 'other';
            return res;
          };

          // 7. Event loop lag heartbeat (measures scheduling delay)
          let lastHeartbeat = performance.now();
          function heartbeat() {
            const now = performance.now();
            const actualDelta = now - lastHeartbeat;
            const lag = Math.max(0, actualDelta - 10);
            if (harness.active) {
              const ell = harness.metrics.eventLoopLag;
              ell.samples.push(lag);
              ell.totalLagMs += lag;
              ell.count++;
              if (lag > ell.maxLagMs) ell.maxLagMs = lag;
            }
            lastHeartbeat = performance.now();
            setTimeout(heartbeat, 10);
          }
          setTimeout(heartbeat, 10);

          // 8. FPS monitor via requestAnimationFrame
          let frameCount = 0;
          let lastFpsTime = performance.now();
          function fpsLoop(now) {
            frameCount++;
            if (now - lastFpsTime >= 500) {
              const currentFps = (frameCount * 1000) / (now - lastFpsTime);
              if (harness.active) {
                harness.metrics.fps.history.push(currentFps);
              }
              frameCount = 0;
              lastFpsTime = now;
            }
            requestAnimationFrame(fpsLoop);
          }
          requestAnimationFrame(fpsLoop);

          // 9. Wire speed-select if needed
          const speedSelect = document.getElementById('speed-select');
          if (speedSelect && !speedSelect.dataset.wired) {
            speedSelect.dataset.wired = 'true';
            speedSelect.addEventListener('change', (e) => {
              if (window.emulator) window.emulator.setSpeed(parseFloat(e.target.value));
            });
          }

          // 10. DOM latency probe helper
          window.__probeDOMInteraction = async function(elementId, eventType = 'click', valueToSet = null) {
            return new Promise((resolve) => {
              const el = document.getElementById(elementId);
              if (!el) {
                resolve({ error: 'element not found: ' + elementId });
                return;
              }

              const t0 = performance.now();
              let tHandler = null;

              const handler = function(e) {
                tHandler = performance.now();
                el.removeEventListener(eventType, handler, true);
              };
              el.addEventListener(eventType, handler, true);

              if (valueToSet !== null && el.tagName === 'SELECT') {
                el.value = valueToSet;
              }

              // Dispatch the synthetic DOM event
              let evt;
              if (eventType === 'click') {
                evt = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
              } else if (eventType === 'change') {
                evt = new Event('change', { bubbles: true, cancelable: true });
              } else if (eventType === 'input') {
                evt = new Event('input', { bubbles: true, cancelable: true });
              }
              el.dispatchEvent(evt);

              // Measure when next animation frame + macro task completes
              requestAnimationFrame(() => {
                setTimeout(() => {
                  const tCompleted = performance.now();
                  const dispatchLatencyMs = tHandler !== null ? (tHandler - t0) : null;
                  const totalResponseMs = tCompleted - t0;
                  resolve({
                    elementId,
                    eventType,
                    dispatchLatencyMs,
                    totalResponseMs
                  });
                }, 0);
              });
            });
          };

          window.__perfHarness = harness;
          return 'harness installed';
        })()
      `
    });
    console.log('Instrumentation status:', injectRes.result.value);

    // Function to run a profile scenario
    async function profileScenario(scenarioName, setupFn, runDurationMs = 5000, onStartFn = null) {
      console.log(`\n----------------------------------------------------------------`);
      console.log(`📊 PROFILING SCENARIO: ${scenarioName.toUpperCase()}`);
      console.log(`----------------------------------------------------------------`);

      // Run scenario setup
      await setupFn();

      // Reset harness metrics and activate
      await client.send('Runtime.evaluate', {
        expression: `
          window.__perfHarness.resetMetrics();
          window.__perfHarness.currentScenario = ${JSON.stringify(scenarioName)};
          window.__perfHarness.active = true;
        `
      });

      if (onStartFn) {
        await onStartFn();
      }

      console.log(`⏳ Profiling active for ${runDurationMs / 1000}s... Measuring DOM interactions under load...`);

      // Measure DOM responsiveness during run
      const domProbes = [];
      const probeInterval = 700;
      const numProbes = Math.floor(runDurationMs / probeInterval);

      for (let i = 0; i < numProbes; i++) {
        await sleep(probeInterval);

        // Interleave DOM interaction probes across controls and bezel buttons
        const targets = [
          { id: 'speed-select', evt: 'change', val: i % 2 === 0 ? '50' : '1' },
          { id: 'phosphor-select', evt: 'change', val: i % 2 === 0 ? 'amber' : 'green' },
          { id: 'btn-scanlines-switch', evt: 'click', val: null },
          { id: 'reset-btn', evt: 'click', val: null },
          { id: 'btn-bay-typein', evt: 'click', val: null },
          { id: 'power-btn', evt: 'click', val: null }
        ];
        const target = targets[i % targets.length];

        const probeStart = Date.now();
        const probeRes = await client.send('Runtime.evaluate', {
          expression: `window.__probeDOMInteraction('${target.id}', '${target.evt}', ${target.val ? `'${target.val}'` : 'null'})`,
          awaitPromise: true,
          returnByValue: true
        });
        const cdpLatencyMs = Date.now() - probeStart;

        if (probeRes.result && probeRes.result.value) {
          domProbes.push({
            ...probeRes.result.value,
            cdpRoundTripMs: cdpLatencyMs
          });
        }
      }

      // Stop profiling
      await client.send('Runtime.evaluate', {
        expression: `window.__perfHarness.active = false;`
      });

      // Gather metrics
      const metricsRes = await client.send('Runtime.evaluate', {
        expression: `JSON.stringify(window.__perfHarness.metrics)`,
        returnByValue: true
      });

      const metrics = JSON.parse(metricsRes.result.value);
      metrics.domProbes = domProbes;

      // Print summary report
      printScenarioReport(scenarioName, metrics, runDurationMs);

      return metrics;
    }

    function printScenarioReport(name, m, durationMs) {
      const rs = m.renderScreen;
      const loop = m.executeBasicLoop;
      const hp = m.handleHplot;
      const ell = m.eventLoopLag;
      const fpsHist = m.fps.history;
      const avgFps = fpsHist.length > 0 ? (fpsHist.reduce((a, b) => a + b, 0) / fpsHist.length).toFixed(1) : 'N/A';
      const minFps = fpsHist.length > 0 ? Math.min(...fpsHist).toFixed(1) : 'N/A';
      const avgLag = ell.count > 0 ? (ell.totalLagMs / ell.count).toFixed(1) : '0';
      const avgLoopTick = loop.tickCount > 0 ? (loop.totalDurationMs / loop.tickCount).toFixed(2) : '0';
      const avgRs = rs.callCount > 0 ? (rs.totalTimeMs / rs.callCount).toFixed(3) : '0';
      const fillRectPerRs = rs.callCount > 0 ? Math.round(rs.fillRectCalls / rs.callCount) : 0;
      const fillRectPerSec = Math.round((rs.fillRectCalls / durationMs) * 1000);

      console.log(`\n📈 RESULTS FOR: ${name}`);
      console.log(`  • FPS: Avg = ${avgFps} fps, Min = ${minFps} fps`);
      console.log(`  • Event Loop Lag: Max = ${ell.maxLagMs.toFixed(1)} ms, Avg = ${avgLag} ms`);
      console.log(`  • executeBasicLoop(): ${loop.tickCount} ticks, Total = ${loop.totalDurationMs.toFixed(1)} ms, Avg Tick = ${avgLoopTick} ms, Max Tick = ${loop.maxDurationMs.toFixed(1)} ms`);
      console.log(`      > 16ms: ${loop.ticksOver16ms} ticks (${loop.tickCount ? (loop.ticksOver16ms*100/loop.tickCount).toFixed(1) : 0}%)`);
      console.log(`      > 50ms: ${loop.ticksOver50ms} ticks (${loop.tickCount ? (loop.ticksOver50ms*100/loop.tickCount).toFixed(1) : 0}%)`);
      console.log(`      > 100ms: ${loop.ticksOver100ms} ticks (${loop.tickCount ? (loop.ticksOver100ms*100/loop.tickCount).toFixed(1) : 0}%)`);
      console.log(`      > 250ms: ${loop.ticksOver250ms} ticks (${loop.tickCount ? (loop.ticksOver250ms*100/loop.tickCount).toFixed(1) : 0}%)`);
      console.log(`  • renderScreen(): ${rs.callCount} calls (${((rs.callCount / durationMs) * 1000).toFixed(1)} calls/sec), Total = ${rs.totalTimeMs.toFixed(1)} ms, Avg = ${avgRs} ms, Max = ${rs.maxTimeMs.toFixed(1)} ms`);
      console.log(`      Origins: HPLOT=${rs.byOrigin.hplot||0}, PRINT=${rs.byOrigin.print||0}, DRAW=${rs.byOrigin.draw||0}, POKE=${rs.byOrigin.poke||0}, other=${rs.byOrigin.other||0}`);
      console.log(`  • Canvas fillRect calls: Total = ${rs.fillRectCalls.toLocaleString()}, Per renderScreen = ${fillRectPerRs}, Rate = ${fillRectPerSec.toLocaleString()} calls/sec`);
      console.log(`  • handleHplot(): ${hp.callCount} calls, Total = ${hp.totalTimeMs.toFixed(1)} ms`);
      console.log(`  • Top Statements:`, Object.entries(m.statements).sort((a,b)=>b[1]-a[1]).slice(0, 5).map(([k,v]) => `${k}:${v}`).join(', '));
      console.log(`  • DOM Interaction Latencies:`);
      for (const probe of m.domProbes) {
        console.log(`      [#${probe.elementId} ${probe.eventType}] Dispatch: ${probe.dispatchLatencyMs?.toFixed(1)} ms | Total Turn: ${probe.totalResponseMs?.toFixed(1)} ms | CDP RTT: ${probe.cdpRoundTripMs} ms`);
      }
    }

    const allResults = {};

    // 1. BASELINE IDLE (50 MHz)
    allResults['baseline_idle_50mhz'] = await profileScenario('Baseline Idle (50 MHz)', async () => {
      await client.send('Runtime.evaluate', {
        expression: `
          window.emulator.setSpeed(50);
          window.emulator.isRunningBasic = false;
        `
      });
    }, 3000);

    // 2. BASELINE IDLE (1 MHz)
    allResults['baseline_idle_1mhz'] = await profileScenario('Baseline Idle (1 MHz)', async () => {
      await client.send('Runtime.evaluate', {
        expression: `
          window.emulator.setSpeed(1);
          window.emulator.isRunningBasic = false;
        `
      });
    }, 3000);

    // 3. KALEIDOSCOPE @ 50 MHz
    allResults['kaleidoscope_50mhz'] = await profileScenario('Kaleidoscope @ 50 MHz', async () => {
      await client.send('Runtime.evaluate', {
        expression: `
          window.emulator.setSpeed(50);
          window.loadSampleTypeIn('kaleidoscope');
        `
      });
    }, 4000, async () => {
      await client.send('Runtime.evaluate', {
        expression: `window.injectTypeIn();`
      });
    });

    // 4. KALEIDOSCOPE @ 1 MHz
    allResults['kaleidoscope_1mhz'] = await profileScenario('Kaleidoscope @ 1 MHz', async () => {
      await client.send('Runtime.evaluate', {
        expression: `
          window.emulator.setSpeed(1);
          window.loadSampleTypeIn('kaleidoscope');
        `
      });
    }, 4000, async () => {
      await client.send('Runtime.evaluate', {
        expression: `window.injectTypeIn();`
      });
    });

    // 5. STARFIELD @ 50 MHz
    allResults['starfield_50mhz'] = await profileScenario('Starfield @ 50 MHz', async () => {
      await client.send('Runtime.evaluate', {
        expression: `
          window.emulator.setSpeed(50);
          window.loadSampleTypeIn('starfield');
        `
      });
    }, 4500, async () => {
      await client.send('Runtime.evaluate', {
        expression: `window.injectTypeIn();`
      });
    });

    // 6. STARFIELD @ 1 MHz
    allResults['starfield_1mhz'] = await profileScenario('Starfield @ 1 MHz', async () => {
      await client.send('Runtime.evaluate', {
        expression: `
          window.emulator.setSpeed(1);
          window.loadSampleTypeIn('starfield');
        `
      });
    }, 4500, async () => {
      await client.send('Runtime.evaluate', {
        expression: `window.injectTypeIn();`
      });
    });

    // 7. BIRD BRAIN @ 50 MHz
    allResults['birdbrain_50mhz'] = await profileScenario('Bird Brain @ 50 MHz', async () => {
      await client.send('Runtime.evaluate', {
        expression: `
          window.emulator.setSpeed(50);
          window.loadSampleTypeIn('birdbrain');
          window.injectTypeIn();
        `
      });
      // Feed menu inputs until graphics mode begins
      for (let s = 0; s < 12; s++) {
        await sleep(200);
        const res = await client.send('Runtime.evaluate', {
          expression: `
            (() => {
              const emu = window.emulator;
              if (!emu || !emu.parsedBasicLines) return 'none';
              const cur = emu.parsedBasicLines[emu.basicLinePtr];
              if (!cur) return 'none';
              if (cur.lineNum === 370) emu.typeChar('K');
              else if (cur.lineNum === 380) emu.typeChar('Y');
              else if (cur.lineNum === 430) emu.typeChar('1');
              return { lineNum: cur.lineNum, isGraphics: emu.isGraphicsMode };
            })()
          `,
          returnByValue: true
        });
        if (res.result && res.result.value && res.result.value.isGraphics) break;
      }
    }, 5000);

    // 8. BIRD BRAIN @ 1 MHz
    allResults['birdbrain_1mhz'] = await profileScenario('Bird Brain @ 1 MHz', async () => {
      await client.send('Runtime.evaluate', {
        expression: `
          window.emulator.setSpeed(1);
          window.loadSampleTypeIn('birdbrain');
          window.injectTypeIn();
        `
      });
      // Feed menu inputs until graphics mode begins
      for (let s = 0; s < 12; s++) {
        await sleep(200);
        const res = await client.send('Runtime.evaluate', {
          expression: `
            (() => {
              const emu = window.emulator;
              if (!emu || !emu.parsedBasicLines) return 'none';
              const cur = emu.parsedBasicLines[emu.basicLinePtr];
              if (!cur) return 'none';
              if (cur.lineNum === 370) emu.typeChar('K');
              else if (cur.lineNum === 380) emu.typeChar('Y');
              else if (cur.lineNum === 430) emu.typeChar('1');
              return { lineNum: cur.lineNum, isGraphics: emu.isGraphicsMode };
            })()
          `,
          returnByValue: true
        });
        if (res.result && res.result.value && res.result.value.isGraphics) break;
      }
    }, 5000);

    // Save full JSON output
    const jsonOutPath = 'tests/perf_profile_results.json';
    fs.writeFileSync(jsonOutPath, JSON.stringify(allResults, null, 2));
    console.log(`\n💾 Raw profiling JSON successfully saved to ${jsonOutPath}`);

  } catch (err) {
    console.error('❌ Error during profiling:', err);
  } finally {
    try {
      await client.close();
      proc.kill();
    } catch (e) {}
    console.log('\n🏁 Browser runner terminated.');
  }
}

runProfiler();
