import { chromium } from 'playwright';
import fs from 'fs';

async function verifyTiles() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }
  });
  const page = await context.newPage();
  
  console.log('🎮 Verifying game tiles are visible...\n');
  
  // Go to site
  await page.goto('https://color-me-same.franzai.com');
  await page.waitForTimeout(2000);
  
  // Start a game
  await page.click('button:has-text("easy")');
  await page.waitForTimeout(300);
  await page.click('button:has-text("Start Game")');
  await page.waitForTimeout(2000);
  
  // Take screenshot
  await page.screenshot({ path: 'tiles-visible-test.png' });
  
  // Check tiles
  const tiles = await page.$$('.w-full.h-full');
  console.log(`✅ Found ${tiles.length} tiles`);
  
  if (tiles.length > 0) {
    // Check first tile
    const firstTileInfo = await tiles[0].evaluate(el => {
      const styles = window.getComputedStyle(el);
      const box = el.getBoundingClientRect();
      return {
        width: styles.width,
        height: styles.height,
        backgroundColor: styles.backgroundColor,
        visible: box.width > 0 && box.height > 0,
        rect: { width: box.width, height: box.height }
      };
    });
    
    console.log('\n🎨 First tile:', firstTileInfo);
    
    // Try clicking a tile
    console.log('\n👆 Clicking first tile...');
    await tiles[0].click();
    await page.waitForTimeout(500);
    
    // Check if grid changed
    const gridAfterClick = await page.$eval('.grid', el => {
      const tiles = el.querySelectorAll('button');
      return Array.from(tiles).map(t => {
        const style = window.getComputedStyle(t);
        return style.backgroundColor;
      });
    });
    
    console.log('\n🎯 Grid colors after click:', gridAfterClick);
    
    // Take another screenshot
    await page.screenshot({ path: 'tiles-after-click.png' });
    console.log('\n📸 Screenshots saved!');
  }
  
  await browser.close();
}

verifyTiles().catch(console.error);