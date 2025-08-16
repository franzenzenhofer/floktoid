#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testWave5() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 720 });
    
    // Go to the game
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Wait for game to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Click start button
    await page.click('button');
    
    // Wait for game to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Enable autopilot
    await page.evaluate(() => {
      if (window.enableAutopilot) {
        window.enableAutopilot();
        console.log('[TEST] Autopilot enabled');
      } else {
        console.error('[TEST] Autopilot not available');
      }
    });
    
    // Monitor waves
    let lastWave = 1;
    let waveHistory = [];
    let checkCount = 0;
    const maxChecks = 120; // 2 minutes max
    
    console.log('[TEST] Starting wave monitoring...');
    
    while (checkCount < maxChecks) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Check every second
      
      const waveInfo = await page.evaluate(() => {
        if (window.gameEngine) {
          const wave = window.gameEngine.getWave();
          const birds = window.gameEngine.boids ? window.gameEngine.boids.length : 0;
          return { wave, birds };
        }
        return null;
      });
      
      if (waveInfo) {
        if (waveInfo.wave !== lastWave) {
          console.log(`[TEST] Wave ${lastWave} -> ${waveInfo.wave} (Birds: ${waveInfo.birds})`);
          waveHistory.push(waveInfo.wave);
          lastWave = waveInfo.wave;
          
          // Check if we skipped wave 5
          if (lastWave === 6 && !waveHistory.includes(5)) {
            console.error('❌ FAILED: Wave 5 was skipped!');
            console.log('Wave history:', waveHistory);
            process.exit(1);
          }
          
          // Success if we reached wave 6 normally
          if (lastWave === 6 && waveHistory.includes(5)) {
            console.log('✅ SUCCESS: Wave 5 worked correctly!');
            console.log('Wave history:', waveHistory);
            process.exit(0);
          }
        }
        
        // Log progress every 5 seconds
        if (checkCount % 5 === 0) {
          console.log(`[TEST] Current wave: ${waveInfo.wave}, Birds: ${waveInfo.birds}`);
        }
      }
      
      checkCount++;
    }
    
    console.log('⏱️ TIMEOUT: Test took too long');
    console.log('Wave history:', waveHistory);
    process.exit(1);
    
  } catch (error) {
    console.error('❌ ERROR:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testWave5();