#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function screenshotWave5() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    console.log('[SCREENSHOT] Going to game...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('[SCREENSHOT] Starting game...');
    await page.click('button');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('[SCREENSHOT] Enabling autopilot...');
    await page.evaluate(() => {
      if (window.enableAutopilot) {
        window.enableAutopilot();
      }
    });
    
    console.log('[SCREENSHOT] Waiting for wave 5...');
    let wave = 1;
    let attempts = 0;
    const maxAttempts = 120;
    
    while (wave < 5 && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      wave = await page.evaluate(() => {
        if (window.gameEngine) {
          return window.gameEngine.getWave();
        }
        return 1;
      });
      console.log(`[SCREENSHOT] Current wave: ${wave}`);
      attempts++;
    }
    
    if (wave >= 5) {
      console.log('[SCREENSHOT] Wave 5 reached! Taking screenshot...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Let it render
      await page.screenshot({ path: '/tmp/wave-5-proof.png' });
      console.log('✅ Screenshot saved to /tmp/wave-5-proof.png');
      console.log(`✅ PROOF: Wave ${wave} is displayed and working!`);
    } else {
      console.log('❌ Failed to reach wave 5');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

screenshotWave5();