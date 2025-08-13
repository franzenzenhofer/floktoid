#!/usr/bin/env node

import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function captureScreenshots() {
  console.log('📸 Capturing screenshots of live site...\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    const screenshotDir = path.join(process.cwd(), 'test-results', 'live-screenshots');
    
    // Test different viewports
    const viewports = [
      { name: 'desktop-1920x1080', width: 1920, height: 1080 },
      { name: 'mobile-390x844', width: 390, height: 844 },
      { name: 'tablet-768x1024', width: 768, height: 1024 }
    ];
    
    for (const viewport of viewports) {
      console.log(`Testing ${viewport.name}...`);
      await page.setViewport({ width: viewport.width, height: viewport.height });
      
      // 1. Start Screen
      await page.goto('https://floktoid.franzai.com', { waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 1000));
      await page.screenshot({
        path: path.join(screenshotDir, `${viewport.name}-01-start.png`),
        fullPage: false
      });
      console.log(`  ✅ Start screen captured`);
      
      // Check if START GAME button exists
      const startButton = await page.$('button');
      if (startButton) {
        const buttonText = await page.evaluate(el => el.textContent, startButton);
        console.log(`  📝 Button found: "${buttonText}"`);
        
        // 2. Game Playing State
        await startButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        await page.screenshot({
          path: path.join(screenshotDir, `${viewport.name}-02-game.png`),
          fullPage: false
        });
        console.log(`  ✅ Game state captured`);
        
        // 3. Test Input
        await page.mouse.move(viewport.width / 2, viewport.height / 2);
        await page.mouse.down();
        await new Promise(resolve => setTimeout(resolve, 500));
        await page.mouse.move(viewport.width / 2 + 100, viewport.height / 2 - 100);
        await page.mouse.up();
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.screenshot({
          path: path.join(screenshotDir, `${viewport.name}-03-gameplay.png`),
          fullPage: false
        });
        console.log(`  ✅ Gameplay captured`);
      } else {
        console.log(`  ❌ START GAME button not found!`);
      }
      
      // Check for console errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      if (consoleErrors.length > 0) {
        console.log(`  ⚠️ Console errors found:`);
        consoleErrors.forEach(err => console.log(`    - ${err}`));
      }
      
      console.log('');
    }
    
    console.log('Screenshots saved to:', screenshotDir);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

captureScreenshots();