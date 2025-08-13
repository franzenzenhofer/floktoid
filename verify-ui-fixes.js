import { chromium } from 'playwright';
import fs from 'fs';

const SITE_URL = 'https://color-me-same.franzai.com';
const SCREENSHOT_DIR = './screenshots-verification';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function verifyUIFixes() {
  const browser = await chromium.launch({ headless: false });
  const results = [];
  
  // Test key viewports
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'desktop', width: 1366, height: 768 }
  ];

  for (const vp of viewports) {
    console.log(`\n✅ Testing ${vp.name} (${vp.width}x${vp.height})`);
    
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height }
    });
    const page = await context.newPage();
    
    try {
      // 1. START SCREEN
      console.log('  📸 Start screen...');
      await page.goto(SITE_URL, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/${vp.name}-01-start-FIXED.png`,
        fullPage: true
      });
      
      // Check tutorial doesn't auto-open
      const tutorial = await page.$('.modal-backdrop:has-text("How to Play")');
      if (tutorial) {
        results.push(`❌ ${vp.name}: Tutorial still auto-opens!`);
      } else {
        results.push(`✅ ${vp.name}: Tutorial no longer auto-opens`);
      }
      
      // 2. GAME SCREEN (should now be visible!)
      console.log('  📸 Starting game...');
      await page.click('button:has-text("easy")');
      await page.waitForTimeout(300);
      await page.click('button:has-text("Start Game")');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/${vp.name}-02-game-FIXED.png`,
        fullPage: true
      });
      
      // Check if game board is visible
      const gameBoard = await page.$('.grid');
      if (!gameBoard) {
        results.push(`❌ ${vp.name}: Game board not found`);
      } else {
        const box = await gameBoard.boundingBox();
        if (box && box.y + box.height > vp.height) {
          results.push(`⚠️ ${vp.name}: Game board extends beyond viewport (${box.y + box.height}px)`);
        } else {
          results.push(`✅ ${vp.name}: Game board fits perfectly`);
        }
      }
      
      // 3. Test extreme difficulty
      console.log('  📸 Testing extreme difficulty...');
      await page.goto(SITE_URL, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      
      await page.click('button:has-text("extreme")');
      await page.waitForTimeout(300);
      await page.click('button:has-text("Start Game")');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/${vp.name}-03-extreme-FIXED.png`,
        fullPage: true
      });
      
      const extremeBoard = await page.$('.grid');
      if (extremeBoard) {
        const box = await extremeBoard.boundingBox();
        results.push(`✅ ${vp.name}: Extreme board size: ${box.width}x${box.height}px`);
      }
      
      // 4. Test scrollability
      const isScrollable = await page.evaluate(() => {
        return document.documentElement.scrollHeight > document.documentElement.clientHeight;
      });
      
      if (isScrollable) {
        results.push(`✅ ${vp.name}: Page is scrollable when needed`);
      }
      
    } catch (error) {
      results.push(`❌ ${vp.name}: Error - ${error.message}`);
    }
    
    await context.close();
  }
  
  await browser.close();
  return results;
}

// Run verification
console.log('🚀 Verifying UI fixes...\n');

verifyUIFixes()
  .then(results => {
    console.log('\n📊 VERIFICATION RESULTS:\n');
    results.forEach(result => console.log(result));
    console.log('\n✅ UI verification complete! Check screenshots in:', SCREENSHOT_DIR);
  })
  .catch(error => {
    console.error('❌ Verification failed:', error);
  });