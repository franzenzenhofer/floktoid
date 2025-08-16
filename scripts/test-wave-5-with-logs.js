#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testWave5WithLogs() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Capture console logs
    const logs = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[WAVE]') || text.includes('[AUTOPILOT]')) {
        console.log('CONSOLE:', text);
        logs.push(text);
      }
    });
    
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
        console.log('[AUTOPILOT] Enabled');
      }
    });
    
    // Monitor for wave 5
    let foundWave5 = false;
    let foundWave6 = false;
    let checkCount = 0;
    const maxChecks = 60; // 1 minute max
    
    console.log('[TEST] Starting wave monitoring with logs...');
    
    while (checkCount < maxChecks) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const waveInfo = await page.evaluate(() => {
        if (window.gameEngine) {
          return window.gameEngine.getWave();
        }
        return null;
      });
      
      if (waveInfo === 5) {
        foundWave5 = true;
        console.log('✅ Found wave 5!');
      }
      if (waveInfo === 6) {
        foundWave6 = true;
        console.log('✅ Found wave 6!');
        break;
      }
      
      checkCount++;
    }
    
    console.log('\n=== RESULTS ===');
    if (foundWave5 && foundWave6) {
      console.log('✅ SUCCESS: Wave 5 worked correctly!');
    } else if (!foundWave5 && foundWave6) {
      console.log('❌ FAILED: Wave 5 was skipped!');
    } else {
      console.log('⏱️ TIMEOUT: Did not reach wave 6');
    }
    
    console.log('\n=== RELEVANT LOGS ===');
    logs.forEach(log => console.log(log));
    
    process.exit(foundWave5 ? 0 : 1);
    
  } catch (error) {
    console.error('❌ ERROR:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testWave5WithLogs();