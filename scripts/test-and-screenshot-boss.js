#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testBossWave() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Capture console logs
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[WAVE]') || text.includes('[SPAWN]') || text.includes('Boss')) {
        console.log('GAME:', text);
      }
    });
    
    console.log('[TEST] Going to game...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('[TEST] Starting game...');
    await page.click('button');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('[TEST] Enabling autopilot...');
    await page.evaluate(() => {
      if (window.enableAutopilot) {
        window.enableAutopilot();
      }
    });
    
    console.log('[TEST] Waiting for wave 5 boss...');
    let wave = 1;
    let attempts = 0;
    const maxAttempts = 150;
    let bossFound = false;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const gameState = await page.evaluate(() => {
        if (window.gameEngine) {
          const currentWave = window.gameEngine.getWave();
          const birds = window.gameEngine.boids || [];
          const hasBoss = birds.some(b => b.isBoss);
          return { 
            wave: currentWave, 
            birdCount: birds.length,
            hasBoss: hasBoss
          };
        }
        return { wave: 1, birdCount: 0, hasBoss: false };
      });
      
      if (gameState.wave !== wave) {
        console.log(`[TEST] Wave ${wave} -> ${gameState.wave} (Birds: ${gameState.birdCount})`);
        wave = gameState.wave;
      }
      
      if (gameState.hasBoss && !bossFound) {
        console.log('🎉 BOSS FOUND! Taking screenshot...');
        bossFound = true;
        
        // Wait a bit for the boss to be visible
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Take screenshot
        await page.screenshot({ path: '/tmp/boss-with-shield.png' });
        console.log('✅ Screenshot saved to /tmp/boss-with-shield.png');
        console.log(`✅ PROOF: Boss appeared in wave ${gameState.wave}!`);
        
        // Continue for a few more seconds to see if it works
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check if wave progresses normally
        const finalState = await page.evaluate(() => {
          if (window.gameEngine) {
            return window.gameEngine.getWave();
          }
          return 0;
        });
        
        console.log(`✅ Game continued to wave ${finalState}`);
        break;
      }
      
      if (wave >= 6 && !bossFound) {
        console.log('❌ Wave 5 passed without seeing boss!');
        break;
      }
      
      attempts++;
    }
    
    if (!bossFound) {
      console.log('❌ Boss never appeared');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

testBossWave();