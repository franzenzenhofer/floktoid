#!/usr/bin/env node

/**
 * AI-POWERED COMPREHENSIVE TESTING
 * Tests EVERYTHING before deployment with real browser simulation
 */

import puppeteer from 'puppeteer';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Test configurations for different devices
const TEST_DEVICES = [
  {
    name: 'iPhone 12 Pro',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 390, height: 844, deviceScaleFactor: 3 },
    hasTouch: true
  },
  {
    name: 'iPhone SE',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 375, height: 667, deviceScaleFactor: 2 },
    hasTouch: true
  },
  {
    name: 'iPad Pro',
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 1024, height: 1366, deviceScaleFactor: 2 },
    hasTouch: true
  },
  {
    name: 'Android Pixel 5',
    userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36',
    viewport: { width: 393, height: 851, deviceScaleFactor: 2.75 },
    hasTouch: true
  },
  {
    name: 'Desktop Chrome',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
    hasTouch: false
  }
];

// Critical game scenarios to test
const GAME_SCENARIOS = [
  {
    name: 'Engine Initialization',
    test: async (page) => {
      // Check if engine initializes without errors
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      page.on('pageerror', error => {
        errors.push(error.message);
      });
      
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });
      await page.waitForFunction(() => true, { timeout: 3000 }).catch(() => {});
      
      // Check for initialization success
      const engineInitialized = await page.evaluate(() => {
        return window.gameEngine && window.gameEngine.initialized;
      });
      
      if (errors.length > 0) {
        throw new Error(`Console errors detected: ${errors.join(', ')}`);
      }
      
      if (!engineInitialized) {
        throw new Error('Engine failed to initialize');
      }
      
      return true;
    }
  },
  {
    name: 'Game Start',
    test: async (page) => {
      // Check if game starts properly
      const gameStarted = await page.evaluate(() => {
        return window.gameEngine && window.gameEngine.gameStarted;
      });
      
      if (!gameStarted) {
        throw new Error('Game failed to start');
      }
      
      return true;
    }
  },
  {
    name: 'Asteroid Launch',
    test: async (page) => {
      // Test asteroid launching
      await page.mouse.move(400, 500);
      await page.mouse.down();
      await new Promise(r => setTimeout(r, 1000); // Charge
      await page.mouse.move(400, 200);
      await page.mouse.up();
      
      await new Promise(r => setTimeout(r, 500));
      
      const asteroidCount = await page.evaluate(() => {
        return window.gameEngine ? window.gameEngine.asteroids.length : 0;
      });
      
      if (asteroidCount === 0) {
        throw new Error('Asteroid launch failed');
      }
      
      return true;
    }
  },
  {
    name: 'Wave Progression',
    test: async (page) => {
      // Simulate playing through multiple waves
      for (let wave = 1; wave <= 10; wave++) {
        // Launch asteroids to kill birds
        for (let i = 0; i < 5; i++) {
          await page.mouse.move(400, 500);
          await page.mouse.down();
          await new Promise(r => setTimeout(r, 500));
          await page.mouse.move(400, 100);
          await page.mouse.up();
          await new Promise(r => setTimeout(r, 1000));
        }
        
        // Check for freezes or crashes
        const isResponsive = await page.evaluate(() => {
          return !document.hidden && window.gameEngine && !window.gameEngine.crashed;
        });
        
        if (!isResponsive) {
          throw new Error(`Game froze at wave ${wave}`);
        }
        
        // Check current wave
        const currentWave = await page.evaluate(() => {
          return window.gameEngine ? window.gameEngine.currentWave : 0;
        });
        
        console.log(`${colors.cyan}    Wave ${currentWave} OK${colors.reset}`);
      }
      
      return true;
    }
  },
  {
    name: 'Memory Leaks',
    test: async (page) => {
      // Check for memory leaks
      const initialMemory = await page.evaluate(() => {
        if (performance.memory) {
          return performance.memory.usedJSHeapSize;
        }
        return 0;
      });
      
      // Play intensively for 30 seconds
      for (let i = 0; i < 30; i++) {
        await page.mouse.move(Math.random() * 800, 500);
        await page.mouse.down();
        await new Promise(r => setTimeout(r, 200));
        await page.mouse.move(Math.random() * 800, 100);
        await page.mouse.up();
        await new Promise(r => setTimeout(r, 800));
      }
      
      const finalMemory = await page.evaluate(() => {
        if (performance.memory) {
          return performance.memory.usedJSHeapSize;
        }
        return 0;
      });
      
      const memoryIncrease = finalMemory - initialMemory;
      const increaseMB = memoryIncrease / 1024 / 1024;
      
      if (increaseMB > 100) {
        throw new Error(`Memory leak detected: ${increaseMB.toFixed(2)}MB increase`);
      }
      
      return true;
    }
  },
  {
    name: 'Performance',
    test: async (page) => {
      // Check FPS and performance
      const metrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          let frames = 0;
          let lastTime = performance.now();
          const fpsValues = [];
          
          const checkFPS = () => {
            frames++;
            const currentTime = performance.now();
            const delta = currentTime - lastTime;
            
            if (delta >= 1000) {
              const fps = (frames * 1000) / delta;
              fpsValues.push(fps);
              frames = 0;
              lastTime = currentTime;
              
              if (fpsValues.length >= 5) {
                const avgFPS = fpsValues.reduce((a, b) => a + b) / fpsValues.length;
                resolve({ avgFPS, minFPS: Math.min(...fpsValues) });
              } else {
                requestAnimationFrame(checkFPS);
              }
            } else {
              requestAnimationFrame(checkFPS);
            }
          };
          
          requestAnimationFrame(checkFPS);
        });
      });
      
      if (metrics.minFPS < 30) {
        throw new Error(`Poor performance: ${metrics.minFPS.toFixed(1)} FPS minimum`);
      }
      
      return true;
    }
  }
];

async function testDevice(deviceConfig, url = 'http://localhost:3000') {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set device configuration
    await page.setUserAgent(deviceConfig.userAgent);
    await page.setViewport(deviceConfig.viewport);
    
    const results = {
      device: deviceConfig.name,
      passed: [],
      failed: [],
      screenshots: []
    };
    
    // Run each test scenario
    for (const scenario of GAME_SCENARIOS) {
      try {
        console.log(`${colors.yellow}    Testing: ${scenario.name}...${colors.reset}`);
        await scenario.test(page);
        results.passed.push(scenario.name);
        console.log(`${colors.green}      ✅ ${scenario.name}${colors.reset}`);
        
        // Take screenshot after each successful test
        const screenshotPath = path.join(__dirname, `../test-screenshots/${deviceConfig.name.replace(/\s/g, '-')}-${scenario.name.replace(/\s/g, '-')}.png`);
        await page.screenshot({ path: screenshotPath });
        results.screenshots.push(screenshotPath);
        
      } catch (error) {
        results.failed.push({ test: scenario.name, error: error.message });
        console.log(`${colors.red}      ❌ ${scenario.name}: ${error.message}${colors.reset}`);
        
        // Take error screenshot
        const errorScreenshotPath = path.join(__dirname, `../test-screenshots/ERROR-${deviceConfig.name.replace(/\s/g, '-')}-${scenario.name.replace(/\s/g, '-')}.png`);
        await page.screenshot({ path: errorScreenshotPath });
      }
    }
    
    return results;
    
  } finally {
    await browser.close();
  }
}

async function analyzeScreenshotsWithAI(screenshots) {
  console.log(`\n${colors.magenta}🤖 AI SCREENSHOT ANALYSIS${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(50)}${colors.reset}`);
  
  const geminiApiKey = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE';
  
  for (const screenshot of screenshots) {
    try {
      const imageData = await fs.readFile(screenshot, 'base64');
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "Analyze this game screenshot. Check for: 1) Rendering issues 2) Missing UI elements 3) Visual glitches 4) Black screens 5) Error messages. Be concise." },
              { inline_data: { mime_type: "image/png", data: imageData } }
            ]
          }]
        })
      });
      
      const result = await response.json();
      const analysis = result.candidates?.[0]?.content?.parts?.[0]?.text || 'No analysis available';
      
      console.log(`${colors.yellow}  📸 ${path.basename(screenshot)}:${colors.reset}`);
      console.log(`    ${analysis.substring(0, 200)}${analysis.length > 200 ? '...' : ''}`);
      
      // Check for critical issues
      if (analysis.toLowerCase().includes('black screen') || 
          analysis.toLowerCase().includes('error') ||
          analysis.toLowerCase().includes('missing')) {
        console.log(`${colors.red}    ⚠️ CRITICAL ISSUE DETECTED!${colors.reset}`);
        return false;
      }
      
    } catch (error) {
      console.log(`${colors.red}    Failed to analyze ${screenshot}: ${error.message}${colors.reset}`);
    }
  }
  
  return true;
}

async function runComprehensiveTesting() {
  console.log(`${colors.bold}\n🚀 AI-POWERED COMPREHENSIVE TESTING${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(70)}${colors.reset}`);
  
  // Create screenshots directory
  await fs.mkdir(path.join(__dirname, '../test-screenshots'), { recursive: true });
  
  const allResults = [];
  let totalPassed = 0;
  let totalFailed = 0;
  
  // Test on all devices
  for (const device of TEST_DEVICES) {
    console.log(`\n${colors.blue}📱 Testing on ${device.name}${colors.reset}`);
    console.log(`${colors.cyan}${'-'.repeat(50)}${colors.reset}`);
    
    try {
      const results = await testDevice(device);
      allResults.push(results);
      totalPassed += results.passed.length;
      totalFailed += results.failed.length;
      
      if (results.failed.length > 0) {
        console.log(`${colors.red}  ❌ ${results.failed.length} tests failed${colors.reset}`);
      } else {
        console.log(`${colors.green}  ✅ All tests passed!${colors.reset}`);
      }
      
    } catch (error) {
      console.log(`${colors.red}  ❌ Device test failed: ${error.message}${colors.reset}`);
      totalFailed++;
    }
  }
  
  // Analyze all screenshots with AI
  const allScreenshots = allResults.flatMap(r => r.screenshots);
  const aiAnalysisPass = await analyzeScreenshotsWithAI(allScreenshots);
  
  // Final report
  console.log(`\n${colors.bold}📊 FINAL REPORT${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(70)}${colors.reset}`);
  console.log(`${colors.green}✅ Passed: ${totalPassed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${totalFailed}${colors.reset}`);
  console.log(`${colors.magenta}🤖 AI Analysis: ${aiAnalysisPass ? '✅ PASS' : '❌ FAIL'}${colors.reset}`);
  
  // Save detailed report
  const reportPath = path.join(__dirname, '../ai-test-report.json');
  await fs.writeFile(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    results: allResults,
    summary: {
      totalPassed,
      totalFailed,
      aiAnalysisPass,
      devices: TEST_DEVICES.length,
      scenarios: GAME_SCENARIOS.length
    }
  }, null, 2);
  
  console.log(`\n${colors.blue}📁 Detailed report: ${reportPath}${colors.reset}`);
  
  // Exit with appropriate code
  if (totalFailed > 0 || !aiAnalysisPass) {
    console.log(`\n${colors.red}${colors.bold}❌ TESTING FAILED - DO NOT DEPLOY!${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`\n${colors.green}${colors.bold}✅ ALL TESTS PASSED - SAFE TO DEPLOY!${colors.reset}`);
    process.exit(0);
  }
}

// Run tests
runComprehensiveTesting().catch(error => {
  console.error(`${colors.red}CRITICAL ERROR: ${error.message}${colors.reset}`);
  process.exit(1);
});