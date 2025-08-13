import { chromium } from 'playwright';
import fs from 'fs';

const SITE_URL = 'https://color-me-same.franzai.com';
const SCREENSHOT_DIR = './screenshots-complete';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function analyzeUI() {
  const browser = await chromium.launch({ headless: false });
  const bugs = [];
  
  // Test different viewports
  const viewports = [
    { name: 'iphone-se', width: 375, height: 667, desc: 'iPhone SE' },
    { name: 'iphone-12', width: 390, height: 844, desc: 'iPhone 12' },
    { name: 'ipad', width: 768, height: 1024, desc: 'iPad' },
    { name: 'laptop', width: 1366, height: 768, desc: 'Laptop' },
    { name: 'desktop', width: 1920, height: 1080, desc: 'Desktop' }
  ];

  for (const vp of viewports) {
    console.log(`\n📱 Testing ${vp.desc} (${vp.width}x${vp.height})`);
    
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height }
    });
    const page = await context.newPage();
    
    try {
      // 1. START SCREEN
      console.log('  📸 Start screen...');
      await page.goto(SITE_URL, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      // Dismiss tutorial if it auto-opened
      const tutorialModal = await page.$('.modal-backdrop');
      if (tutorialModal) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/${vp.name}-01-start.png`,
        fullPage: true
      });
      
      // Analyze start screen
      const startBtn = await page.$('button:has-text("Start Game")');
      const startBtnBox = startBtn ? await startBtn.boundingBox() : null;
      
      if (!startBtnBox) {
        bugs.push(`${vp.desc}: Start button not found`);
      } else if (startBtnBox.y + startBtnBox.height > vp.height) {
        bugs.push(`${vp.desc}: Start button is cut off (bottom at ${startBtnBox.y + startBtnBox.height}px, viewport ${vp.height}px)`);
      }
      
      // Check if scrollable
      const isScrollable = await page.evaluate(() => {
        return document.documentElement.scrollHeight > document.documentElement.clientHeight;
      });
      
      if (isScrollable) {
        bugs.push(`${vp.desc}: Start screen requires scrolling (content height: ${await page.evaluate(() => document.documentElement.scrollHeight)}px)`);
      }
      
      // 2. ACTUAL GAME SCREEN
      console.log('  📸 Game screen (dismissing tutorial)...');
      
      // Select easy difficulty
      const easyBtn = await page.$('button:has-text("easy")');
      if (easyBtn) await easyBtn.click();
      await page.waitForTimeout(300);
      
      // Start game
      const startGame = await page.$('button:has-text("Start Game")');
      if (startGame) await startGame.click();
      await page.waitForTimeout(2000);
      
      // Dismiss tutorial if it appears
      const tutorial = await page.$('.modal-backdrop:has-text("How to Play")');
      if (tutorial) {
        console.log('    Dismissing tutorial modal...');
        const letsPlayBtn = await page.$('button:has-text("Let\'s Play!")');
        if (letsPlayBtn) {
          await letsPlayBtn.click();
        } else {
          await page.keyboard.press('Escape');
        }
        await page.waitForTimeout(1000);
      }
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/${vp.name}-02-game.png`,
        fullPage: true
      });
      
      // Analyze game screen
      const gameBoard = await page.$('.grid');
      const gameBoardBox = gameBoard ? await gameBoard.boundingBox() : null;
      
      if (!gameBoardBox) {
        bugs.push(`${vp.desc}: Game board not found!`);
      } else if (gameBoardBox.y + gameBoardBox.height > vp.height) {
        bugs.push(`${vp.desc}: Game board is cut off (bottom at ${gameBoardBox.y + gameBoardBox.height}px, viewport ${vp.height}px)`);
      }
      
      // Check dashboard visibility
      const dashboard = await page.$('.glass-effect');
      const dashboardBox = dashboard ? await dashboard.boundingBox() : null;
      
      if (!dashboardBox) {
        bugs.push(`${vp.desc}: Dashboard not found`);
      } else if (dashboardBox.y < 0) {
        bugs.push(`${vp.desc}: Dashboard is cut off at top`);
      }
      
      // 3. PAUSE MODAL
      console.log('  📸 Pause modal...');
      const pauseBtn = await page.$('button:has-text("Pause")');
      if (pauseBtn) {
        await pauseBtn.click();
        await page.waitForTimeout(500);
        
        await page.screenshot({ 
          path: `${SCREENSHOT_DIR}/${vp.name}-03-pause.png`,
          fullPage: true
        });
        
        // Check modal visibility
        const modal = await page.$('.modal-content');
        const modalBox = modal ? await modal.boundingBox() : null;
        
        if (modalBox && modalBox.y + modalBox.height > vp.height) {
          bugs.push(`${vp.desc}: Pause modal is cut off (bottom at ${modalBox.y + modalBox.height}px)`);
        }
        
        // Resume
        await page.click('button:has-text("Resume")');
        await page.waitForTimeout(300);
      }
      
      // 4. VICTORY MODAL (simulate)
      console.log('  📸 Victory modal...');
      // Click random tiles to simulate gameplay
      const tiles = await page.$$('.aspect-square');
      if (tiles.length > 0) {
        // Click first tile multiple times
        for (let i = 0; i < 10; i++) {
          await tiles[0].click();
          await page.waitForTimeout(100);
        }
      }
      
      // Force show victory modal for testing
      await page.evaluate(() => {
        const event = new CustomEvent('show-victory-test');
        window.dispatchEvent(event);
      });
      
      await page.waitForTimeout(1000);
      
      const victoryModal = await page.$('.modal-backdrop:has-text("Puzzle Solved")');
      if (victoryModal) {
        await page.screenshot({ 
          path: `${SCREENSHOT_DIR}/${vp.name}-04-victory.png`,
          fullPage: true
        });
      }
      
      // 5. Test harder difficulties with larger boards
      console.log('  📸 Testing extreme difficulty...');
      await page.goto(SITE_URL, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      
      // Dismiss tutorial if needed
      const tutModal = await page.$('.modal-backdrop');
      if (tutModal) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
      
      // Select extreme
      const extremeBtn = await page.$('button:has-text("extreme")');
      if (extremeBtn) {
        await extremeBtn.click();
        await page.waitForTimeout(300);
        
        const startBtn = await page.$('button:has-text("Start Game")');
        if (startBtn) await startBtn.click();
        await page.waitForTimeout(2000);
        
        // Dismiss tutorial
        const tut = await page.$('.modal-backdrop:has-text("How to Play")');
        if (tut) {
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
        }
        
        await page.screenshot({ 
          path: `${SCREENSHOT_DIR}/${vp.name}-05-extreme.png`,
          fullPage: true
        });
        
        // Check if extreme board fits
        const extremeBoard = await page.$('.grid');
        const extremeBoardBox = extremeBoard ? await extremeBoard.boundingBox() : null;
        
        if (extremeBoardBox && extremeBoardBox.y + extremeBoardBox.height > vp.height) {
          bugs.push(`${vp.desc}: Extreme difficulty board is cut off (${extremeBoardBox.height}px height)`);
        }
      }
      
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      bugs.push(`${vp.desc}: Error - ${error.message}`);
    }
    
    await context.close();
  }
  
  await browser.close();
  return bugs;
}

// Generate comprehensive report
function generateReport(bugs) {
  let report = '# COLOR ME SAME - COMPREHENSIVE UI ANALYSIS\n\n';
  report += `Generated: ${new Date().toISOString()}\n\n`;
  
  if (bugs.length === 0) {
    report += '## ✅ NO ISSUES FOUND!\n\n';
    report += 'All screens fit perfectly in all tested viewports.\n';
  } else {
    report += `## ❌ FOUND ${bugs.length} ISSUES\n\n`;
    
    bugs.forEach((bug, i) => {
      report += `${i + 1}. ${bug}\n`;
    });
    
    report += '\n## RECOMMENDATIONS\n\n';
    report += '1. Make PageShell scrollable when content exceeds viewport\n';
    report += '2. Reduce game board size on mobile devices\n';
    report += '3. Make modals scrollable if they exceed viewport height\n';
    report += '4. Add responsive breakpoints for different screen sizes\n';
    report += '5. Test with real devices to ensure touch targets are accessible\n';
  }
  
  report += '\n## SCREENSHOTS\n\n';
  report += 'Check the `screenshots-complete/` directory for visual evidence.\n';
  
  // Save reports
  fs.writeFileSync('COMPREHENSIVE-UI-REPORT.md', report);
  fs.writeFileSync('bugs.txt', bugs.join('\n'));
  
  console.log('\n📄 Reports saved:');
  console.log('  - COMPREHENSIVE-UI-REPORT.md');
  console.log('  - bugs.txt');
  console.log(`\n❌ Found ${bugs.length} issues that need fixing!`);
}

// Run analysis
console.log('🚀 Starting comprehensive UI analysis...\n');

analyzeUI()
  .then(generateReport)
  .catch(error => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });