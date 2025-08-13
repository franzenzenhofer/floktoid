#!/usr/bin/env node

import { chromium } from 'playwright';
import { spawn } from 'child_process';

async function runFullGameTest() {
  console.log('🎮 Starting Full Game Test...');
  
  // Start dev server
  const devServer = spawn('npm', ['run', 'dev:vite'], {
    stdio: 'pipe',
    shell: true
  });
  
  // Wait for server to start
  await new Promise(resolve => {
    devServer.stdout.on('data', (data) => {
      if (data.toString().includes('Local:')) {
        resolve();
      }
    });
  });
  
  console.log('✅ Dev server started');
  
  try {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();
    
    // Monitor for errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', err => {
      errors.push(err.message);
    });
    
    await page.goto('http://localhost:3000');
    
    console.log('🎮 Testing game start...');
    // Start game
    await page.click('button:has-text("START GAME")');
    await page.waitForTimeout(2000);
    
    console.log('🎮 Testing asteroid launch...');
    // Test asteroid launch
    await page.mouse.move(960, 800);
    await page.mouse.down();
    await page.waitForTimeout(500);
    await page.mouse.move(960, 400);
    await page.mouse.up();
    await page.waitForTimeout(1000);
    
    console.log('🎮 Testing multiple collisions...');
    // Launch multiple asteroids to trigger collisions
    for (let i = 0; i < 5; i++) {
      await page.mouse.move(960 + i * 50, 900);
      await page.mouse.down();
      await page.waitForTimeout(200);
      await page.mouse.move(960 + i * 30, 300);
      await page.mouse.up();
      await page.waitForTimeout(500);
    }
    
    console.log('🎮 Testing rapid-fire collisions...');
    // Test rapid collision events (this would have triggered the freeze)
    for (let i = 0; i < 10; i++) {
      await page.mouse.move(800 + i * 30, 900);
      await page.mouse.down();
      await page.waitForTimeout(100);
      await page.mouse.move(800 + i * 30, 400);
      await page.mouse.up();
      // Don't wait - rapid fire
    }
    
    await page.waitForTimeout(5000);
    
    console.log('🎮 Testing game over scenario...');
    // Wait for potential game over
    await page.waitForTimeout(10000);
    
    // Check if game is still responsive
    await page.mouse.move(500, 500);
    await page.mouse.down();
    await page.mouse.up();
    
    // Check for freezes or errors
    if (errors.length > 0) {
      console.error('❌ Errors detected during gameplay:');
      errors.forEach(err => console.error('  ', err));
      throw new Error('Game test failed with errors');
    }
    
    // Check if page is still responsive
    const isResponsive = await page.evaluate(() => {
      return new Promise(resolve => {
        const start = Date.now();
        requestAnimationFrame(() => {
          const elapsed = Date.now() - start;
          resolve(elapsed < 100); // Should be <16ms ideally
        });
      });
    });
    
    if (!isResponsive) {
      throw new Error('Game appears to be frozen!');
    }
    
    console.log('✅ All game tests passed!');
    
    await browser.close();
    return true;
    
  } catch (error) {
    console.error('❌ Game test failed:', error.message);
    throw error;
  } finally {
    // Kill dev server
    devServer.kill();
  }
}

// Run if called directly
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  runFullGameTest()
    .then(() => {
      console.log('✅ Full game test completed successfully');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Full game test failed:', err);
      process.exit(1);
    });
}

export { runFullGameTest };