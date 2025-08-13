#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function checkErrors() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    const errors = [];
    
    // Capture console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push({
          type: 'console',
          text: msg.text(),
          location: msg.location()
        });
      }
    });
    
    // Capture page errors
    page.on('pageerror', error => {
      errors.push({
        type: 'pageerror',
        message: error.message,
        stack: error.stack
      });
    });
    
    // Capture request failures
    page.on('requestfailed', request => {
      errors.push({
        type: 'network',
        url: request.url(),
        failure: request.failure()
      });
    });
    
    console.log('🔍 Checking for errors on live site...\n');
    
    // Navigate to the site
    await page.goto('https://floktoid.franzai.com', { waitUntil: 'networkidle2' });
    console.log('✅ Page loaded');
    
    // Try to start the game
    const startButton = await page.$('button');
    if (startButton) {
      console.log('📱 Clicking START GAME...');
      await startButton.click();
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Check if canvas exists and is visible
    const canvasInfo = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return { exists: false };
      
      const rect = canvas.getBoundingClientRect();
      const computed = window.getComputedStyle(canvas);
      
      return {
        exists: true,
        width: canvas.width,
        height: canvas.height,
        clientWidth: canvas.clientWidth,
        clientHeight: canvas.clientHeight,
        display: computed.display,
        visibility: computed.visibility,
        opacity: computed.opacity,
        rect: {
          width: rect.width,
          height: rect.height,
          top: rect.top,
          left: rect.left
        }
      };
    });
    
    console.log('\n📊 Canvas Info:', JSON.stringify(canvasInfo, null, 2));
    
    // Check if Pixi is loaded
    const pixiInfo = await page.evaluate(() => {
      return {
        PIXI: typeof window.PIXI !== 'undefined',
        pixiVersion: window.PIXI?.VERSION || 'not found'
      };
    });
    
    console.log('\n🎮 Pixi.js Info:', JSON.stringify(pixiInfo, null, 2));
    
    if (errors.length > 0) {
      console.log('\n❌ ERRORS FOUND:');
      errors.forEach((err, i) => {
        console.log(`\n${i + 1}. ${err.type.toUpperCase()} ERROR:`);
        console.log('   ', err.text || err.message || err.url);
        if (err.location) {
          console.log('   ', `at ${err.location.url}:${err.location.lineNumber}`);
        }
      });
    } else {
      console.log('\n✅ No errors detected');
    }
    
  } finally {
    await browser.close();
  }
}

checkErrors();